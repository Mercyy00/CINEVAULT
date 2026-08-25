import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { ContinueWatchingItem, Movie, WatchlistItem } from '../types';
import type { AppFont, Theme, UserProfile } from '../store';
import { getFirebase } from './firebase';

export interface UserCloudData {
  watchlist: WatchlistItem[];
  continueWatching: ContinueWatchingItem[];
  profile: Partial<UserProfile>;
  theme?: Theme;
  appFont?: AppFont;
  updatedAt?: number;
}

/** Firestore rejects documents over 1 MiB. Stay well clear of the ceiling. */
const MAX_DOCUMENT_BYTES = 700_000;
const MAX_WATCHLIST_ITEMS = 500;
const MAX_CONTINUE_WATCHING_ITEMS = 50;

/**
 * Identity of a continue-watching entry.
 *
 * Exported so the store and the merge logic cannot drift. They previously
 * disagreed: the store de-duplicated on `id` alone while merge used
 * `id_season_episode`, so watching two episodes of one show produced one local
 * entry and two cloud entries that then fought on every sync.
 */
export function continueWatchingKey(item: ContinueWatchingItem): string {
  return `${item.id}_${item.season_number ?? 0}_${item.episode_number ?? 0}`;
}

/**
 * Strips a Movie down to the fields the watchlist UI actually renders.
 *
 * Watchlist entries used to be persisted with the entire Movie object -- which
 * for a long-running series meant an `episodes` array of up to 100 objects
 * each, plus `cast`, `reviews` and `servers`. A few dozen shows was enough to
 * push the sync document toward Firestore's hard 1 MiB limit, at which point
 * every future write fails.
 */
function slimMovie(movie: Movie): Movie {
  return {
    id: movie.id,
    title: movie.title,
    type: movie.type,
    tagline: '',
    description: (movie.description ?? '').slice(0, 400),
    year: movie.year,
    duration: movie.duration,
    rating: movie.rating,
    ageRating: movie.ageRating,
    genres: (movie.genres ?? []).slice(0, 6),
    posterUrl: movie.posterUrl,
    backdropUrl: movie.backdropUrl,
    // Deliberately dropped: cast, reviews, episodes, servers. All are
    // re-fetchable from the source APIs and none are rendered in a list row.
    servers: [],
    cast: [],
    reviews: [],
    ...(movie.imdbId ? { imdbId: movie.imdbId } : {}),
    ...(movie.malId ? { malId: movie.malId } : {}),
    ...(movie.episodeCount ? { episodeCount: movie.episodeCount } : {}),
  };
}

function slimWatchlist(items: WatchlistItem[]): WatchlistItem[] {
  return items.slice(-MAX_WATCHLIST_ITEMS).map((item) => ({
    movieId: item.movieId,
    movie: slimMovie(item.movie),
    addedAt: item.addedAt,
    status: item.status,
  }));
}

/** Only the preference fields belong in the sync document. */
function slimProfile(profile: Partial<UserProfile>): Partial<UserProfile> {
  return {
    name: profile.name,
    language: profile.language,
    defaultServer: profile.defaultServer,
    audioPreference: profile.audioPreference,
    filmGrain: profile.filmGrain,
    logoStyle: profile.logoStyle,
    showSpoilers: profile.showSpoilers,
    autoPlayNext: profile.autoPlayNext,
    reducedMotion: profile.reducedMotion,
  };
}

function approximateBytes(value: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export const syncService = {
  continueWatchingKey,

  async saveUserData(userId: string, data: Partial<UserCloudData>): Promise<void> {
    if (!userId) return;

    const { db } = getFirebase();
    if (!db) return;

    let payload = {
      watchlist: slimWatchlist(data.watchlist ?? []),
      continueWatching: (data.continueWatching ?? []).slice(0, MAX_CONTINUE_WATCHING_ITEMS),
      profile: slimProfile(data.profile ?? {}),
      theme: data.theme ?? null,
      appFont: data.appFont ?? null,
      updatedAt: Date.now(),
    };

    // Last-resort guard: trim the watchlist until the document fits rather than
    // letting the write fail outright.
    while (approximateBytes(payload) > MAX_DOCUMENT_BYTES && payload.watchlist.length > 1) {
      payload = {
        ...payload,
        watchlist: payload.watchlist.slice(Math.ceil(payload.watchlist.length / 2)),
      };
    }

    try {
      await setDoc(doc(db, 'user_sync', userId), payload, { merge: true });
    } catch (error) {
      // Surfaced rather than swallowed: a permission-denied here means the
      // Firestore rules are wrong, which is worth seeing.
      console.error('Cloud sync failed:', error);
      throw error;
    }
  },

  async loadUserData(userId: string): Promise<UserCloudData | null> {
    if (!userId) return null;

    const { db } = getFirebase();
    if (!db) return null;

    try {
      const snapshot = await getDoc(doc(db, 'user_sync', userId));
      if (!snapshot.exists()) return null;

      const data = snapshot.data();
      return {
        watchlist: Array.isArray(data.watchlist) ? data.watchlist : [],
        continueWatching: Array.isArray(data.continueWatching) ? data.continueWatching : [],
        profile: typeof data.profile === 'object' && data.profile ? data.profile : {},
        theme: data.theme ?? undefined,
        appFont: data.appFont ?? undefined,
        updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : undefined,
      };
    } catch (error) {
      console.error('Cloud load failed:', error);
      return null;
    }
  },

  mergeData(
    localWatchlist: WatchlistItem[],
    cloudWatchlist: WatchlistItem[] = [],
    localContinue: ContinueWatchingItem[],
    cloudContinue: ContinueWatchingItem[] = []
  ): { watchlist: WatchlistItem[]; continueWatching: ContinueWatchingItem[] } {
    const watchlistMap = new Map<string, WatchlistItem>();
    for (const item of cloudWatchlist) {
      if (item?.movieId) watchlistMap.set(item.movieId, item);
    }
    for (const item of localWatchlist) {
      if (!item?.movieId) continue;
      const existing = watchlistMap.get(item.movieId);
      if (!existing || (item.addedAt ?? 0) >= (existing.addedAt ?? 0)) {
        watchlistMap.set(item.movieId, item);
      }
    }

    const continueMap = new Map<string, ContinueWatchingItem>();
    for (const item of cloudContinue) {
      if (item?.id) continueMap.set(continueWatchingKey(item), item);
    }
    for (const item of localContinue) {
      if (!item?.id) continue;
      const key = continueWatchingKey(item);
      const existing = continueMap.get(key);
      if (!existing || (item.timestamp ?? 0) >= (existing.timestamp ?? 0)) {
        continueMap.set(key, item);
      }
    }

    return {
      watchlist: Array.from(watchlistMap.values()),
      continueWatching: Array.from(continueMap.values()).sort(
        (a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)
      ),
    };
  },
};
