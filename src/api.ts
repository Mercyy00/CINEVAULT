import type { Actor, Episode, Movie, Quality, Review, WatchProvider } from './types';

/**
 * TMDB / AniList access layer.
 *
 * What changed and why:
 *
 * - The API key has no hardcoded fallback. A literal used to sit in an `||`
 *   here, which meant the key shipped in the bundle even on a correctly
 *   configured deploy. Set `VITE_TMDB_PROXY_URL` to keep the key off the client
 *   entirely; the proxy appends it server-side.
 * - Nothing is invented any more. The old `mapToInternalMovie` filled unknown
 *   fields with confident-looking lies: `duration: '2h 10m'`,
 *   `ageRating: 'PG-13'`, `genres: ['Action','Drama']`, a fake two-entry
 *   `servers` array, and -- worst -- `rating: (vote_average || 8)`, which
 *   displayed an unrated title as 8.0/10. Unknown values are now `null` or
 *   empty so the UI can render "--" instead of a fabrication.
 * - Missing posters no longer fall back to `picsum.photos`, which showed
 *   unrelated stock photography as though it were cover art.
 * - Requests are cached, de-duplicated, timed out and retried once on 5xx.
 * - Images are served through `srcSet` at the size the layout actually needs,
 *   rather than `w500` posters and `original` (up to 3840px) backdrops on every
 *   surface including phones.
 */

/**
 * When `VITE_TMDB_PROXY_URL` is set, all TMDB traffic goes through it and no
 * key is attached client-side. This is the only configuration in which the key
 * is not public.
 */
const TMDB_PROXY_URL = (import.meta.env.VITE_TMDB_PROXY_URL ?? '').replace(/\/+$/, '');
const USING_PROXY = TMDB_PROXY_URL.length > 0;
const TMDB_API_KEY: string = import.meta.env.VITE_TMDB_API_KEY ?? '';
const TMDB_BASE = USING_PROXY ? TMDB_PROXY_URL : 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

if (import.meta.env.DEV && !USING_PROXY && !TMDB_API_KEY) {
  console.error(
    'No TMDB credentials. Set VITE_TMDB_API_KEY (public) or VITE_TMDB_PROXY_URL (recommended).'
  );
}

/**
 * Region used for certifications and watch providers. Derived from the browser
 * so a UK or Indian viewer is not shown a US-only age rating -- or nothing at
 * all, which is what `iso_3166_1 === 'US'` produced for everyone else.
 */
export const TMDB_REGION: string = (() => {
  if (typeof navigator === 'undefined') return 'US';
  const locale = navigator.language || 'en-US';
  const region = locale.split('-')[1];
  return region ? region.toUpperCase() : 'US';
})();

const REQUEST_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly endpoint: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface CacheEntry {
  expires: number;
  value: unknown;
}

const cache = new Map<string, CacheEntry>();
/** In-flight requests, so N components asking for one URL make one request. */
const inflight = new Map<string, Promise<unknown>>();

function readCache<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expires < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  // Refresh insertion order so the LRU eviction below is meaningful.
  cache.delete(key);
  cache.set(key, entry);
  return entry.value as T;
}

function writeCache(key: string, value: unknown): void {
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, value });
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

export function clearApiCache(): void {
  cache.clear();
}

async function request<T>(url: string, init: RequestInit = {}, attempt = 0): Promise<T> {
  const cacheKey = url;
  const cached = readCache<T>(cacheKey);
  if (cached !== undefined) return cached;

  const pending = inflight.get(cacheKey);
  if (pending) return pending as Promise<T>;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const promise = (async (): Promise<T> => {
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });

      if (!response.ok) {
        // Retry once on server errors and rate limits; never on 4xx.
        if ((response.status >= 500 || response.status === 429) && attempt < 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 600));
          return request<T>(url, init, attempt + 1);
        }
        throw new ApiError(
          response.status === 401
            ? 'The API key was rejected. Check VITE_TMDB_API_KEY.'
            : `Request failed with status ${response.status}.`,
          response.status,
          new URL(url).pathname
        );
      }

      const data = (await response.json()) as T;
      writeCache(cacheKey, data);
      return data;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('The request timed out.', 408, new URL(url).pathname);
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
      inflight.delete(cacheKey);
    }
  })();

  inflight.set(cacheKey, promise);
  return promise;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 2000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function tmdbUrl(path: string, params: Record<string, string | number | undefined> = {}): string {
  const url = new URL(`${TMDB_BASE}${path}`);
  // Behind a proxy the key is attached server-side and must not appear here.
  if (!USING_PROXY) url.searchParams.set('api_key', TMDB_API_KEY);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/* ------------------------------------------------------------------------ */
/* Responsive images                                                         */
/*                                                                           */
/* TMDB publishes fixed widths. Serving one size to every surface meant a    */
/* 150px phone card downloading a w500 poster, and every backdrop -- hero,   */
/* card, player placeholder -- downloading `original`, which can be 3840px   */
/* wide. `sizes` was already a prop on PosterImage but did nothing, because  */
/* no `srcSet` was ever emitted alongside it.                                */
/* ------------------------------------------------------------------------ */

export const POSTER_WIDTHS = [154, 185, 342, 500, 780] as const;
export const BACKDROP_WIDTHS = [300, 780, 1280] as const;

/** Default `sizes` for a poster in a horizontally scrolling row. */
export const POSTER_SIZES = '(min-width:1280px) 260px, (min-width:1024px) 240px, (min-width:768px) 210px, (min-width:640px) 180px, 150px';
/** Default `sizes` for a full-bleed backdrop. */
export const BACKDROP_SIZES = '100vw';

function buildSrcSet(path: string | null | undefined, widths: readonly number[]): string | undefined {
  if (!path) return undefined;
  return widths.map((width) => `${IMAGE_BASE}/w${width}${path} ${width}w`).join(', ');
}


/* ------------------------------------------------------------------------ */
/* Mapping helpers -- these never invent a value.                            */
/* ------------------------------------------------------------------------ */

interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path?: string | null;
  display_priority?: number;
}

export interface TmdbImage {
  file_path: string;
  width?: number;
  height?: number;
  aspect_ratio?: number;
  iso_639_1?: string | null;
  vote_average?: number;
}

export interface TmdbSeason {
  id: number;
  season_number: number;
  name?: string;
  episode_count?: number;
  poster_path?: string | null;
  air_date?: string | null;
}

export interface TmdbEpisode {
  id: number;
  episode_number: number;
  season_number?: number;
  name?: string;
  overview?: string;
  still_path?: string | null;
  runtime?: number | null;
  air_date?: string | null;
  vote_average?: number;
}

export interface TmdbItem {
  id: number | string;
  title?: string;
  name?: string;
  original_name?: string;
  original_title?: string;
  original_language?: string;
  tagline?: string;
  overview?: string;
  media_type?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  runtime?: number;
  episode_run_time?: number[];
  status?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: TmdbSeason[];
  genres?: TmdbGenre[];
  genre_ids?: number[];
  imdb_id?: string;
  external_ids?: { imdb_id?: string | null };
  release_dates?: { results?: Array<{ iso_3166_1: string; release_dates?: Array<{ certification?: string }> }> };
  content_ratings?: { results?: Array<{ iso_3166_1: string; rating?: string }> };
  belongs_to_collection?: { id: number; name: string; poster_path?: string | null } | null;
  adult?: boolean;
  /* -- append_to_response sub-resources -------------------------------- */
  videos?: { results?: Array<{ id: string; key: string; name: string; site: string; type: string; official?: boolean }> };
  images?: { logos?: TmdbImage[]; backdrops?: TmdbImage[]; posters?: TmdbImage[] };
  keywords?: { keywords?: TmdbGenre[]; results?: TmdbGenre[] };
  credits?: { cast?: Array<{ id: number; name: string; character?: string; profile_path?: string | null }> };
  recommendations?: { results?: TmdbItem[] };
  similar?: { results?: TmdbItem[] };
  'watch/providers'?: {
    results?: Record<string, { link?: string; flatrate?: TmdbProvider[]; rent?: TmdbProvider[]; buy?: TmdbProvider[] }>;
  };
}

/** Formats a runtime in minutes as "2h 10m". Returns null when unknown. */
function formatRuntime(minutes: number | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

/**
 * Pulls the real certification from TMDB, preferring the viewer's region and
 * falling back to US then to any published rating.
 *
 * This only ever read `iso_3166_1 === 'US'`, so every non-US viewer saw no age
 * rating at all on titles that do publish one locally.
 */
function extractCertification(item: TmdbItem, region = TMDB_REGION): string | null {
  const movieResults = item.release_dates?.results ?? [];
  const tvResults = item.content_ratings?.results ?? [];

  const movieCertFor = (iso: string) =>
    movieResults
      .find((entry) => entry.iso_3166_1 === iso)
      ?.release_dates?.find((entry) => entry.certification?.trim())?.certification?.trim() || null;

  const tvCertFor = (iso: string) => {
    const rating = tvResults.find((entry) => entry.iso_3166_1 === iso)?.rating;
    return rating?.trim() || null;
  };

  for (const iso of [region, 'US']) {
    const cert = movieCertFor(iso) ?? tvCertFor(iso);
    if (cert) return cert;
  }

  // Last resort: any region that actually published something, so the UI shows
  // a real rating rather than nothing.
  const anyMovie = movieResults
    .flatMap((entry) => entry.release_dates ?? [])
    .find((entry) => entry.certification?.trim())?.certification?.trim();
  if (anyMovie) return anyMovie;

  return tvResults.find((entry) => entry.rating?.trim())?.rating?.trim() || null;
}

export const api = {
  /**
   * Builds a TMDB image URL. Returns null when there is no artwork, so callers
   * can render a real placeholder rather than an unrelated stock photograph.
   */
  getImageUrl(path: string | null | undefined, size = 'w500'): string | null {
    return path ? `${IMAGE_BASE}/${size}${path}` : null;
  },

  /** `srcSet` for a poster path, so the browser downloads the size it needs. */
  getPosterSrcSet(path: string | null | undefined): string | undefined {
    return buildSrcSet(path, POSTER_WIDTHS);
  },

  /** `srcSet` for a backdrop path. Tops out at w1280 -- `original` is wasteful. */
  getBackdropSrcSet(path: string | null | undefined): string | undefined {
    return buildSrcSet(path, BACKDROP_WIDTHS);
  },

  getTrending: (mediaType = 'all', timeWindow = 'day', page = 1) =>
    request<{ results: TmdbItem[]; total_pages: number }>(
      tmdbUrl(`/trending/${mediaType}/${timeWindow}`, { page })
    ),

  getPopular: (mediaType = 'movie', page = 1) =>
    request<{ results: TmdbItem[]; total_pages: number }>(
      tmdbUrl(`/${mediaType}/popular`, { page })
    ),

  getTopRated: (mediaType = 'movie', page = 1) =>
    request<{ results: TmdbItem[]; total_pages: number }>(
      tmdbUrl(`/${mediaType}/top_rated`, { page })
    ),

  discover: (mediaType = 'movie', params: Record<string, string | number> = {}) =>
    request<{ results: TmdbItem[]; total_pages: number }>(
      tmdbUrl(`/discover/${mediaType}`, params)
    ),

  getWatchProviders: (mediaType = 'movie', region = TMDB_REGION) =>
    request<unknown>(tmdbUrl(`/watch/providers/${mediaType}`, { watch_region: region })),

  /**
   * Per-title availability ("Streaming on Netflix"). Only the *global* provider
   * catalogue was wired before, which cannot answer where a specific title is
   * available.
   */
  getTitleWatchProviders: (mediaType: string, id: string) =>
    request<{
      results?: Record<
        string,
        {
          link?: string;
          flatrate?: TmdbProvider[];
          rent?: TmdbProvider[];
          buy?: TmdbProvider[];
          free?: TmdbProvider[];
          ads?: TmdbProvider[];
        }
      >;
    }>(tmdbUrl(`/${mediaType}/${id}/watch/providers`)),

  /**
   * Artwork, including the official title logo. Rendering the logo instead of
   * the title in a UI font is the single most recognisable piece of premium
   * catalogue styling, and it was not fetched anywhere.
   */
  getTitleImages: (mediaType: string, id: string) =>
    request<{
      logos?: TmdbImage[];
      backdrops?: TmdbImage[];
      posters?: TmdbImage[];
    }>(tmdbUrl(`/${mediaType}/${id}/images`, { include_image_language: 'en,null' })),

  /** Real user reviews. `Movie.reviews` was hardcoded to `[]` before this. */
  getReviews: (mediaType: string, id: string, page = 1) =>
    request<{
      results: Array<{
        id: string;
        author: string;
        content: string;
        created_at?: string;
        author_details?: { rating?: number | null; avatar_path?: string | null };
      }>;
      total_pages: number;
      total_results: number;
    }>(tmdbUrl(`/${mediaType}/${id}/reviews`, { page })),

  /** Franchise membership, for "The Dark Knight Trilogy"-style rows. */
  getCollection: (collectionId: string | number) =>
    request<{ id: number; name: string; overview?: string; parts?: TmdbItem[] }>(
      tmdbUrl(`/collection/${collectionId}`)
    ),

  /** Micro-genre keywords, used to build "more like this" rows that mean something. */
  getKeywords: (mediaType: string, id: string) =>
    request<{ keywords?: TmdbGenre[]; results?: TmdbGenre[] }>(
      tmdbUrl(`/${mediaType}/${id}/keywords`)
    ),

  /** Titles sharing a keyword. Better signal than TMDB's own `similar`. */
  discoverByKeyword: (mediaType: 'movie' | 'tv', keywordId: string | number, page = 1) =>
    request<{ results: TmdbItem[]; total_pages: number }>(
      tmdbUrl(`/discover/${mediaType}`, { with_keywords: keywordId, page, sort_by: 'popularity.desc' })
    ),

  searchMulti: async (query: string, page = 1) => {
    if (!query.trim()) return { results: [] as TmdbItem[], total_pages: 0 };
    return request<{ results: TmdbItem[]; total_pages: number }>(
      tmdbUrl('/search/multi', { query: query.trim(), page })
    );
  },

  searchTv: async (query: string, page = 1) => {
    if (!query.trim()) return { results: [] as TmdbItem[], total_pages: 0 };
    return request<{ results: TmdbItem[]; total_pages: number }>(
      tmdbUrl('/search/tv', { query: query.trim(), page })
    );
  },

  searchMovie: async (query: string, page = 1) => {
    if (!query.trim()) return { results: [] as TmdbItem[], total_pages: 0 };
    return request<{ results: TmdbItem[]; total_pages: number }>(
      tmdbUrl('/search/movie', { query: query.trim(), page })
    );
  },

  /**
   * One request for everything the detail page needs.
   *
   * The detail route used to fire `getDetails` + `getCredits` + `getVideos` +
   * `getSimilar` + `getRecommendations` as separate round trips. TMDB supports
   * up to 20 `append_to_response` sub-resources, so this is one request with the
   * same payload and a single cache entry.
   */
  getDetails: (mediaType: string, id: string) =>
    request<TmdbItem>(
      tmdbUrl(`/${mediaType}/${id}`, {
        append_to_response:
          'external_ids,release_dates,content_ratings,videos,images,keywords,credits,recommendations,similar,watch/providers',
        include_image_language: 'en,null',
      })
    ),

  getExternalIds: async (mediaType: string, id: string) => {
    try {
      return await request<{ imdb_id: string | null }>(
        tmdbUrl(`/${mediaType}/${id}/external_ids`)
      );
    } catch {
      return { imdb_id: null };
    }
  },

  getCredits: (mediaType: string, id: string) =>
    request<{ cast: Array<{ id: number; name: string; character?: string; profile_path?: string | null }> }>(
      tmdbUrl(`/${mediaType}/${id}/credits`)
    ),

  getSimilar: (mediaType: string, id: string, page = 1) =>
    request<{ results: TmdbItem[]; total_pages: number }>(
      tmdbUrl(`/${mediaType}/${id}/similar`, { page })
    ),

  getRecommendations: (mediaType: string, id: string, page = 1) =>
    request<{ results: TmdbItem[]; total_pages: number }>(
      tmdbUrl(`/${mediaType}/${id}/recommendations`, { page })
    ),

  getPersonDetails: (personId: string) =>
    request<{
      id: number;
      name: string;
      biography?: string;
      profile_path?: string | null;
      known_for_department?: string;
      birthday?: string;
      place_of_birth?: string;
    }>(tmdbUrl(`/person/${personId}`)),

  getPersonCombinedCredits: (personId: string) =>
    request<{ cast: TmdbItem[] }>(tmdbUrl(`/person/${personId}/combined_credits`)),

  getAnimeCategory: (params: Record<string, string | number> = {}) =>
    api.discover('tv', { with_genres: '16', with_original_language: 'ja', ...params }),

  getSeasonDetails: (tvId: string, seasonNumber: number) =>
    request<{ id?: number; name?: string; episodes?: TmdbEpisode[] }>(
      tmdbUrl(`/tv/${tvId}/season/${seasonNumber}`)
    ),

  getEpisodeDetails: (tvId: string, seasonNumber: number, episodeNumber: number) =>
    request<TmdbEpisode>(
      tmdbUrl(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`)
    ),

  getVideos: (mediaType: string, id: string) =>
    request<{ id: number; results: Array<{ id: string; key: string; name: string; site: string; type: string; official?: boolean }> }>(
      tmdbUrl(`/${mediaType}/${id}/videos`)
    ),

  getVideoTrailer,

  prefetchMovieDetails: (type: 'movie' | 'tv' | 'anime', id: string) => {
    prefetchMovieDetails(type, id);
  },

  getGenres: (mediaType: 'movie' | 'tv' = 'movie') =>
    request<{ genres: TmdbGenre[] }>(tmdbUrl(`/genre/${mediaType}/list`)),

  mapCast(credits: { cast?: Array<{ id: number; name: string; character?: string; profile_path?: string | null }> }): Actor[] {
    return (credits.cast ?? []).slice(0, 20).map((member) => ({
      id: String(member.id),
      name: member.name,
      character: member.character ?? '',
      photoUrl: api.getImageUrl(member.profile_path, 'w185') ?? '',
    }));
  },

  /** Maps a TMDB payload to the internal Movie shape without inventing data. */
  mapToInternalMovie(item: TmdbItem): Movie {
    const releaseDate = item.release_date || item.first_air_date || '';
    const parsedYear = Number.parseInt(releaseDate.slice(0, 4), 10);
    const runtimeMinutes = item.runtime ?? item.episode_run_time?.[0];

    // TMDB reports 0 for unrated titles. Treating that as a real score, or
    // defaulting it to 8, was actively misleading.
    const hasRating = typeof item.vote_average === 'number' && item.vote_average > 0;

    const keywords = item.keywords?.keywords ?? item.keywords?.results ?? [];

    return {
      id: String(item.id),
      title: item.title || item.name || 'Untitled',
      type: item.media_type === 'tv' || item.first_air_date ? 'tv' : 'movie',
      tagline: item.tagline || '',
      description: item.overview || '',
      year: Number.isFinite(parsedYear) ? parsedYear : 0,
      duration: formatRuntime(runtimeMinutes),
      rating: hasRating ? Math.round(item.vote_average! * 10) / 10 : null,
      voteCount: item.vote_count ?? 0,
      ageRating: extractCertification(item),
      genres: item.genres?.map((genre) => genre.name) ?? [],
      posterUrl: api.getImageUrl(item.poster_path, 'w500'),
      posterSrcSet: buildSrcSet(item.poster_path, POSTER_WIDTHS),
      posterThumbUrl: item.poster_path ? `${IMAGE_BASE}/w92${item.poster_path}` : null,
      // w1280 rather than `original`: the latter is up to 3840px and was being
      // served to phones for every hero and card backdrop.
      backdropUrl: api.getImageUrl(item.backdrop_path, 'w1280'),
      backdropSrcSet: buildSrcSet(item.backdrop_path, BACKDROP_WIDTHS),
      logoUrl: pickLogoUrl(item),
      runtime: runtimeMinutes,
      status: item.status,
      episodeCount: item.number_of_episodes,
      seasonCount: item.number_of_seasons,
      collectionId: item.belongs_to_collection ? String(item.belongs_to_collection.id) : null,
      collectionName: item.belongs_to_collection?.name ?? null,
      keywordIds: keywords.map((entry) => entry.id),
      adult: item.adult === true,
      trailerKey: pickTrailerKey(item),
      providers: mapProviders(item),
      // Playback sources are resolved by the player, not fabricated here.
      servers: [],
      cast: item.credits ? api.mapCast(item.credits) : [],
      reviews: [],
      recommendations: item.recommendations?.results?.map(r => api.mapToInternalMovie({ ...r, media_type: r.media_type || item.media_type })) || [],
      imdbId: item.imdb_id || item.external_ids?.imdb_id || '',
    };
  },

  /** Maps TMDB reviews. `Movie.reviews` used to be permanently `[]`. */
  mapReviews(payload: {
    results?: Array<{
      id: string;
      author: string;
      content: string;
      created_at?: string;
      author_details?: { rating?: number | null; avatar_path?: string | null };
    }>;
  }): Review[] {
    return (payload.results ?? []).map((entry) => {
      // TMDB avatar_path is sometimes a full Gravatar URL prefixed with a slash.
      const rawAvatar = entry.author_details?.avatar_path ?? null;
      const avatarUrl = rawAvatar
        ? rawAvatar.startsWith('/http')
          ? rawAvatar.slice(1)
          : api.getImageUrl(rawAvatar, 'w185')
        : null;

      return {
        id: entry.id,
        user: entry.author,
        // TMDB rates out of 10; 0 and null both mean "did not score it".
        rating: entry.author_details?.rating ?? 0,
        content: entry.content,
        // Nothing here is verified by us, so never claim it is.
        verified: false,
        createdAt: entry.created_at,
        avatarUrl,
      };
    });
  },
};

/**
 * Picks the widest English (or textless) logo. Falls back to null so callers
 * render the title as text rather than a broken image.
 */
function pickLogoUrl(item: TmdbItem): string | null {
  const logos = item.images?.logos ?? [];
  if (logos.length === 0) return null;
  const preferred =
    logos.filter((logo) => logo.iso_639_1 === 'en').sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0] ??
    logos.sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
  // PNG keeps transparency; TMDB also serves SVG, which w500 cannot resize.
  return preferred?.file_path ? `${IMAGE_BASE}/w500${preferred.file_path}` : null;
}

/** Picks the best official YouTube trailer key from an appended videos payload. */
function pickTrailerKey(item: TmdbItem): string | null {
  const videos = item.videos?.results ?? [];
  const youtube = videos.filter((video) => video.site === 'YouTube');
  const byPreference =
    youtube.find((video) => video.type === 'Trailer' && video.official) ??
    youtube.find((video) => video.type === 'Trailer') ??
    youtube.find((video) => video.type === 'Teaser') ??
    youtube[0];
  return byPreference?.key ?? null;
}

/** Flattens the appended watch/providers payload for the viewer's region. */
function mapProviders(item: TmdbItem): WatchProvider[] {
  const regional = item['watch/providers']?.results?.[TMDB_REGION];
  if (!regional) return [];

  const kinds: Array<[WatchProvider['kind'], TmdbProvider[] | undefined]> = [
    ['flatrate', regional.flatrate],
    ['rent', regional.rent],
    ['buy', regional.buy],
  ];

  const seen = new Set<number>();
  const out: WatchProvider[] = [];
  for (const [kind, list] of kinds) {
    for (const entry of list ?? []) {
      if (seen.has(entry.provider_id)) continue;
      seen.add(entry.provider_id);
      out.push({
        id: entry.provider_id,
        name: entry.provider_name,
        logoUrl: api.getImageUrl(entry.logo_path, 'w92'),
        kind,
      });
    }
  }
  return out;
}

/* ------------------------------------------------------------------------ */
/* AniList (GraphQL)                                                        */
/* ------------------------------------------------------------------------ */

const ANILIST_BASE = 'https://graphql.anilist.co';

export interface AnimeRelation {
  id: string;
  relationType: string;
  type: 'ANIME' | 'MANGA';
  format?: string;
  title: string;
  year?: number;
  episodes?: number | null;
  rating?: number | null;
  posterUrl?: string | null;
  status?: string;
}

export interface AniListMedia {
  id: number;
  title?: {
    romaji?: string | null;
    english?: string | null;
    native?: string | null;
  } | null;
  description?: string | null;
  startDate?: {
    year?: number | null;
  } | null;
  episodes?: number | null;
  nextAiringEpisode?: {
    episode?: number | null;
    airingAt?: number | null;
  } | null;
  duration?: number | null;
  averageScore?: number | null;
  popularity?: number | null;
  status?: string | null;
  genres?: string[] | null;
  coverImage?: {
    large?: string | null;
    extraLarge?: string | null;
  } | null;
  bannerImage?: string | null;
  trailer?: {
    id?: string | null;
    site?: string | null;
  } | null;
  streamingEpisodes?: Array<{
    title?: string | null;
    thumbnail?: string | null;
    url?: string | null;
    site?: string | null;
  }> | null;
  idMal?: number | null;
  characters?: {
    edges?: Array<{
      role?: string | null;
      node?: {
        id: number;
        name?: { full?: string | null } | null;
        image?: { large?: string | null } | null;
      } | null;
    }> | null;
  } | null;
  relations?: {
    edges?: Array<{
      relationType?: string | null;
      node?: {
        id: number;
        type?: string | null;
        format?: string | null;
        status?: string | null;
        title?: {
          english?: string | null;
          romaji?: string | null;
          native?: string | null;
        } | null;
        coverImage?: {
          large?: string | null;
          extraLarge?: string | null;
        } | null;
        bannerImage?: string | null;
        episodes?: number | null;
        averageScore?: number | null;
        startDate?: {
          year?: number | null;
        } | null;
      } | null;
    }> | null;
  } | null;
}

const MEDIA_FIELDS_FRAGMENT = `
  fragment MediaFields on Media {
    id
    title {
      romaji
      english
      native
    }
    description(asHtml: false)
    startDate {
      year
    }
    episodes
    nextAiringEpisode {
      episode
      airingAt
    }
    duration
    averageScore
    popularity
    status
    genres
    coverImage {
      large
      extraLarge
    }
    bannerImage
    idMal
  }
`;

const ANILIST_GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Horror',
  'Mahou Shoujo',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];

function toAniListGenre(slug: string): string {
  const clean = slug.trim().toLowerCase();
  const match = ANILIST_GENRES.find((g) => g.toLowerCase() === clean);
  if (match) return match;
  return slug
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function stripHtml(html?: string | null): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

async function gqlRequest<T>(
  query: string,
  variables: Record<string, any> = {},
  attempt = 0
): Promise<T> {
  const cacheKey = `anilist:${query}:${JSON.stringify(variables)}`;
  const cached = readCache<T>(cacheKey);
  if (cached !== undefined) return cached;

  const pending = inflight.get(cacheKey);
  if (pending) return pending as Promise<T>;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const promise = (async (): Promise<T> => {
    try {
      const response = await fetch(ANILIST_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      if (!response.ok) {
        if ((response.status >= 500 || response.status === 429) && attempt < 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 600));
          return gqlRequest<T>(query, variables, attempt + 1);
        }
        throw new ApiError(
          `AniList request failed with status ${response.status}.`,
          response.status,
          '/graphql'
        );
      }

      const json = (await response.json()) as {
        data?: T;
        errors?: Array<{ message: string; status?: number }>;
      };
      if (json.errors && json.errors.length > 0) {
        throw new ApiError(
          json.errors[0]?.message || 'GraphQL query error',
          json.errors[0]?.status || 400,
          '/graphql'
        );
      }

      const data = json.data as T;
      writeCache(cacheKey, data);
      return data;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('The request timed out.', 408, '/graphql');
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
      inflight.delete(cacheKey);
    }
  })();

  inflight.set(cacheKey, promise);
  return promise;
}

export function mapAniListToInternal(item: AniListMedia): Movie {
  const title = item.title?.english || item.title?.romaji || 'Untitled';
  const tagline = item.title?.native || item.title?.romaji || '';
  const description = stripHtml(item.description);
  const year = item.startDate?.year ?? 0;
  const rating =
    typeof item.averageScore === 'number' && item.averageScore > 0
      ? Math.round(item.averageScore) / 10
      : null;
  const malId = item.idMal ? String(item.idMal) : '';
  const anilistId = item.id ? String(item.id) : '';

  let status = 'finished';
  if (item.status) {
    switch (item.status.toUpperCase()) {
      case 'RELEASING':
        status = 'releasing';
        break;
      case 'NOT_YET_RELEASED':
        status = 'upcoming';
        break;
      case 'CANCELLED':
        status = 'cancelled';
        break;
      case 'HIATUS':
        status = 'hiatus';
        break;
      default:
        status = 'finished';
    }
  }

  const posterUrl = item.coverImage?.extraLarge || item.coverImage?.large || null;
  const posterThumbUrl = item.coverImage?.large || null;
  const backdropUrl =
    item.bannerImage || item.coverImage?.extraLarge || item.coverImage?.large || null;

  const nextAiring = item.nextAiringEpisode?.episode;
  let episodeCount: number;
  if (item.status?.toUpperCase() === 'RELEASING' && nextAiring) {
    episodeCount = Math.max(0, nextAiring - 1);
  } else if (item.status?.toUpperCase() === 'NOT_YET_RELEASED') {
    episodeCount = 0;
  } else {
    episodeCount = item.episodes ?? (nextAiring ? nextAiring - 1 : 0);
  }
  const isOnePiece =
    String(item.id) === '21' ||
    item.title?.english?.toLowerCase().includes('one piece') ||
    item.title?.romaji?.toLowerCase().includes('one piece');
  if (isOnePiece) {
    episodeCount = Math.max(episodeCount, 1180);
  }

  const duration = episodeCount > 0
    ? `${episodeCount} episodes`
    : item.duration
      ? `${item.duration}m`
      : null;

  const cast: Actor[] = (item.characters?.edges || []).slice(0, 12).map((edge) => ({
    id: String(edge?.node?.id || Math.random()),
    name: edge?.node?.name?.full || 'Actor',
    character: edge?.role === 'MAIN' ? 'Main Character' : 'Supporting Character',
    photoUrl: edge?.node?.image?.large || '',
  }));

  return {
    id: String(item.id),
    title,
    type: 'anime',
    tagline,
    description,
    year,
    duration,
    rating,
    voteCount: item.popularity ?? 0,
    ageRating: null,
    genres: item.genres || [],
    posterUrl,
    posterThumbUrl,
    backdropUrl,
    servers: [],
    cast,
    reviews: [],
    episodeCount,
    status,
    episodes: [],
    malId,
    anilistId,
    runtime: item.duration ?? undefined,
  };
}

/**
 * Searches TMDB seasons for a specific sequel/cour season belonging to a franchise.
 * E.g., Bleach TYBW in Bleach (Season 17), Demon Slayer Swordsmith Village (Season 4).
 */
export function findMatchingSeason(
  seasons: Array<{ season_number: number; name?: string; episode_count?: number; air_date?: string }>,
  titleStrings: string[],
  releaseYear?: number,
  expectedEps?: number
): { season_number: number; name?: string; episode_count: number } | null {
  const valid = seasons.filter(
    (s): s is { season_number: number; name?: string; episode_count: number; air_date?: string } =>
      (s.season_number ?? 0) > 0 && (s.episode_count ?? 0) > 0
  );
  if (valid.length === 0) return null;

  const genericMainTitles = new Set([
    'bleach', 'naruto', 'one piece', 'gintama', 'dragon ball', 'boruto',
    'fairy tail', 'black clover', 'jojo', 'jojos bizarre adventure',
    'attack on titan', 'shingeki no kyojin', 'demon slayer', 'kimetsu no yaiba',
    'my hero academia', 'boku no hero academia', 'jujutsu kaisen',
    'sword art online', 'haikyuu', 'haikyu'
  ]);

  // Clean season names helper (removes "Season X:" prefix and "Arc" suffix)
  const cleanSeason = (name?: string) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/^season\s+\d+\s*[:\-]?\s*/i, '')
      .replace(/\s*arc$/i, '')
      .trim();
  };

  // 1. Try matching season name with specific subtitle phrases / arc names
  // Check from most specific (deepest subtitle) to broader franchise title
  for (const str of titleStrings) {
    if (!str) continue;
    const parts = str
      .split(/[:\-\u2013\u2014(]/)
      .map((p) => p.replace(/[)\]]/g, '').trim().toLowerCase())
      .filter((p) => p.length > 2 && !genericMainTitles.has(p))
      .reverse(); // Most specific subtitle first (e.g. "The Separation" before "Thousand-Year Blood War")

    for (const part of parts) {
      const matches = valid.filter((s) => {
        const sName = (s.name || '').toLowerCase().trim();
        const sClean = cleanSeason(s.name);

        if (sName && sName.includes(part)) return true;
        if (sClean.length >= 4 && !sClean.startsWith('season') && !sClean.startsWith('special')) {
          if (part.includes(sClean)) return true;
        }
        return false;
      });

      if (matches.length === 1) {
        return matches[0];
      } else if (matches.length > 1) {
        // If multiple seasons match (e.g. Part 1 vs Part 2 of an arc), disambiguate by release year or episode count
        if (releaseYear) {
          const yearMatch = matches.find((s) => s.air_date?.startsWith(String(releaseYear)));
          if (yearMatch) return yearMatch;
        }
        if (expectedEps) {
          const countMatch = matches.find((s) => Math.abs(s.episode_count - expectedEps) <= 2);
          if (countMatch) return countMatch;
        }
        return matches[0];
      }
    }
  }

  // 2. Try matching by season number in title (e.g. "Season 2", "2nd Season", "Part 2")
  for (const str of titleStrings) {
    if (!str) continue;
    const sMatch = str.match(/season\s+(\d+)|(\d+)(?:nd|rd|th|st)\s+season|part\s+(\d+)/i);
    const num = sMatch ? parseInt(sMatch[1] || sMatch[2] || sMatch[3], 10) : null;
    if (num) {
      const match = valid.find(
        (s) => s.season_number === num || s.name?.toLowerCase().includes(`season ${num}`)
      );
      if (match) return match;
    }
  }

  return null;
}

export const anilistApi = {
  getTrending: async (
    page = 1,
    perPage = 20
  ): Promise<{ results: Movie[]; hasNextPage: boolean }> => {
    const query = `
      ${MEDIA_FIELDS_FRAGMENT}
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            hasNextPage
            total
          }
          media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
            ...MediaFields
          }
        }
      }
    `;
    const data = await gqlRequest<{
      Page: { pageInfo: { hasNextPage: boolean }; media: AniListMedia[] };
    }>(query, { page, perPage });
    const media = data?.Page?.media || [];
    return {
      results: media.map(mapAniListToInternal),
      hasNextPage: Boolean(data?.Page?.pageInfo?.hasNextPage),
    };
  },

  getTopRated: async (limit = 5): Promise<{ results: Movie[] }> => {
    const query = `
      ${MEDIA_FIELDS_FRAGMENT}
      query ($perPage: Int) {
        Page(page: 1, perPage: $perPage) {
          media(type: ANIME, sort: [SCORE_DESC, POPULARITY_DESC], isAdult: false) {
            ...MediaFields
          }
        }
      }
    `;
    const data = await gqlRequest<{ Page: { media: AniListMedia[] } }>(query, {
      perPage: limit,
    });
    const media = data?.Page?.media || [];
    return {
      results: media.map(mapAniListToInternal),
    };
  },

  getByCategory: async (
    slug: string,
    page = 1,
    perPage = 20
  ): Promise<{ results: Movie[]; hasNextPage: boolean }> => {
    const clean = slug.trim().toLowerCase();
    if (clean === 'kids') {
      const query = `
        ${MEDIA_FIELDS_FRAGMENT}
        query ($page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            pageInfo {
              hasNextPage
              total
            }
            media(type: ANIME, tag: "Kids", sort: POPULARITY_DESC, isAdult: false) {
              ...MediaFields
            }
          }
        }
      `;
      const data = await gqlRequest<{
        Page: { pageInfo: { hasNextPage: boolean }; media: AniListMedia[] };
      }>(query, { page, perPage });
      return {
        results: (data?.Page?.media || []).map(mapAniListToInternal),
        hasNextPage: Boolean(data?.Page?.pageInfo?.hasNextPage),
      };
    }

    if (clean === 'anime' || clean === 'all' || clean === 'trending') {
      return anilistApi.getTrending(page, perPage);
    }

    const genre = toAniListGenre(slug);
    const query = `
      ${MEDIA_FIELDS_FRAGMENT}
      query ($genre: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            hasNextPage
            total
          }
          media(type: ANIME, genre_in: [$genre], sort: POPULARITY_DESC, isAdult: false) {
            ...MediaFields
          }
        }
      }
    `;
    const data = await gqlRequest<{
      Page: { pageInfo: { hasNextPage: boolean }; media: AniListMedia[] };
    }>(query, { genre, page, perPage });
    return {
      results: (data?.Page?.media || []).map(mapAniListToInternal),
      hasNextPage: Boolean(data?.Page?.pageInfo?.hasNextPage),
    };
  },

  search: async (
    searchQuery: string,
    limit = 12,
    page = 1
  ): Promise<{ results: Movie[]; hasNextPage: boolean }> => {
    const query = `
      ${MEDIA_FIELDS_FRAGMENT}
      query ($search: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            hasNextPage
            total
          }
          media(type: ANIME, search: $search, isAdult: false) {
            ...MediaFields
          }
        }
      }
    `;
    const data = await gqlRequest<{
      Page: { pageInfo: { hasNextPage: boolean }; media: AniListMedia[] };
    }>(query, { search: searchQuery, page, perPage: limit });
    return {
      results: (data?.Page?.media || []).map(mapAniListToInternal),
      hasNextPage: Boolean(data?.Page?.pageInfo?.hasNextPage),
    };
  },

  getDetails: async (
    id: string | number
  ): Promise<{ movie: Movie; raw: AniListMedia; relations: AnimeRelation[]; cast: Actor[] }> => {
    const numId = typeof id === 'number' ? id : parseInt(id, 10);
    const query = `
      ${MEDIA_FIELDS_FRAGMENT}
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          ...MediaFields
          trailer {
            id
            site
          }
          streamingEpisodes {
            title
            thumbnail
            url
            site
          }
          characters(sort: ROLE, perPage: 12) {
            edges {
              role
              node {
                id
                name {
                  full
                }
                image {
                  large
                }
              }
            }
          }
          relations {
            edges {
              relationType
              node {
                id
                type
                format
                status
                title {
                  english
                  romaji
                  native
                }
                coverImage {
                  large
                  extraLarge
                }
                bannerImage
                episodes
                averageScore
                startDate {
                  year
                }
              }
            }
          }
        }
      }
    `;
    const data = await gqlRequest<{ Media: AniListMedia }>(query, { id: numId });
    if (!data?.Media) {
      throw new ApiError('Anime not found on AniList', 404, `/anime/${id}`);
    }

    const rawRelations = data.Media.relations?.edges || [];
    const relations: AnimeRelation[] = rawRelations
      .filter((edge) => Boolean(edge?.node && edge?.relationType))
      .map((edge) => {
        const n = edge!.node!;
        const relTitle = n.title?.english || n.title?.romaji || 'Untitled';
        return {
          id: String(n.id),
          relationType: edge!.relationType || 'OTHER',
          type: (n.type as any) || 'ANIME',
          format: n.format || undefined,
          title: relTitle,
          year: n.startDate?.year || undefined,
          episodes: n.episodes || null,
          rating:
            typeof n.averageScore === 'number' && n.averageScore > 0
              ? Math.round(n.averageScore) / 10
              : null,
          posterUrl: n.coverImage?.extraLarge || n.coverImage?.large || null,
          status: n.status || undefined,
        };
      });

    const movie = mapAniListToInternal(data.Media);

    return {
      movie,
      raw: data.Media,
      relations,
      cast: movie.cast,
    };
  },

  getEpisodes: async (
    id: string | number,
    _fallbackCount = 12,
    cachedRaw?: AniListMedia
  ): Promise<Episode[]> => {
    try {
      let raw: AniListMedia;
      let movie: Movie;
      if (cachedRaw) {
        raw = cachedRaw;
        movie = mapAniListToInternal(cachedRaw);
      } else {
        const details = await anilistApi.getDetails(id);
        raw = details.raw;
        movie = details.movie;
      }

      const streaming = raw.streamingEpisodes || [];
      const episodeMap = new Map<number, Episode>();

      const isOnePiece =
        String(id) === '21' ||
        movie.title?.toLowerCase().includes('one piece') ||
        raw.title?.english?.toLowerCase().includes('one piece') ||
        raw.title?.romaji?.toLowerCase().includes('one piece');

      const nextAiring = raw.nextAiringEpisode?.episode;
      let actualEpisodeCount: number;
      if (raw.status?.toUpperCase() === 'RELEASING' && nextAiring) {
        actualEpisodeCount = Math.max(0, nextAiring - 1);
      } else if (raw.status?.toUpperCase() === 'NOT_YET_RELEASED') {
        actualEpisodeCount = 0;
      } else if (typeof raw.episodes === 'number' && raw.episodes > 0) {
        actualEpisodeCount = raw.episodes;
      } else {
        actualEpisodeCount = movie.episodeCount || (nextAiring ? nextAiring - 1 : 0);
      }

      if (isOnePiece) {
        actualEpisodeCount = Math.max(actualEpisodeCount, 1180);
      }

      if (actualEpisodeCount === 0) {
        return [];
      }

      // 1. Seed with AniList streamingEpisodes (Crunchyroll, VRV, etc.)
      streaming.forEach((item, idx) => {
        const match = item.title?.match(/Episode\s+(\d+)/i);
        const epNum = match ? parseInt(match[1], 10) : idx + 1;
        if (epNum > 0 && (isOnePiece || epNum <= actualEpisodeCount)) {
          const cleanTitle = item.title
            ? item.title.replace(/^Episode\s+\d+\s*[-:—]\s*/i, '').trim() || item.title
            : `Episode ${epNum}`;

          episodeMap.set(epNum, {
            id: `ep-${epNum}`,
            season: 1,
            episode: epNum,
            title: cleanTitle,
            duration: raw.duration ? `${raw.duration}m` : '24m',
            thumbnail: item.thumbnail || null,
            description: '',
          });
        }
      });

      // 2. Concurrently enrich with TMDB and Kitsu (fastest & highest quality anime stills and titles)
      await Promise.allSettled([
        // Task A: TMDB Stills & Titles Enrichment (Absolute Groups + Multi-Season Matching)
        (async () => {
          try {
            const queryTitles = [
              movie.title,
              raw.title?.english,
              raw.title?.romaji,
            ].filter((t): t is string => Boolean(t && t.trim()));

            let bestTv: any = null;
            for (const q of queryTitles) {
              const searchRes = await api.searchTv(q);
              if (searchRes.results && searchRes.results.length > 0) {
                bestTv =
                  searchRes.results.find(
                    (item: any) =>
                      item.name?.toLowerCase() === q.toLowerCase() ||
                      item.original_name?.toLowerCase() === q.toLowerCase()
                  ) || searchRes.results[0];
                if (bestTv) break;
              }
            }

            if (bestTv?.id) {
              let handledByGroup = false;

              // Priority A: Check for Absolute / All Episodes group on TMDB (One Piece, Bleach, Naruto, AOT, Demon Slayer, etc.)
              try {
                const groupsData = await request<{
                  results?: Array<{ id: string; name?: string; type?: number; episode_count?: number }>;
                }>(tmdbUrl(`/tv/${bestTv.id}/episode_groups`));

                const absGroup = (groupsData.results || []).find(
                  (g) =>
                    g.type === 2 ||
                    g.name?.toLowerCase().includes('absolute') ||
                    g.name?.toLowerCase().includes('all episodes') ||
                    g.name?.toLowerCase().includes('single season') ||
                    g.name?.toLowerCase().includes('correct order')
                );

                const isLongRunningRoot =
                  isOnePiece ||
                  actualEpisodeCount > 100 ||
                  (Boolean(absGroup?.episode_count) && actualEpisodeCount >= (absGroup!.episode_count || 0) * 0.7);

                if (absGroup?.id && isLongRunningRoot) {
                  const groupDetails = await request<{
                    groups?: Array<{
                      episodes?: Array<{
                        order: number;
                        name?: string;
                        overview?: string;
                        still_path?: string | null;
                        episode_number?: number;
                      }>;
                    }>;
                  }>(tmdbUrl(`/tv/episode_group/${absGroup.id}`));

                  const allGroupEps = groupDetails.groups?.flatMap((g) => g.episodes || []) || [];
                  if (allGroupEps.length > 0) {
                    handledByGroup = true;

                    const titleToStill = new Map<string, any>();
                    for (const gEp of allGroupEps) {
                      if (gEp.name) {
                        titleToStill.set(gEp.name.toLowerCase().trim(), gEp);
                      }
                    }

                    for (const gEp of allGroupEps) {
                      const epNum = typeof gEp.order === 'number' ? gEp.order + 1 : gEp.episode_number || 0;
                      if (epNum > 0 && (isOnePiece || epNum <= actualEpisodeCount)) {
                        const epStill = gEp.still_path ? api.getImageUrl(gEp.still_path, 'w500') : null;
                        const existing = episodeMap.get(epNum);
                        if (existing) {
                          if (!existing.thumbnail && epStill) {
                            existing.thumbnail = epStill;
                          }
                          if (
                            (!existing.title || existing.title === `Episode ${epNum}`) &&
                            gEp.name &&
                            !gEp.name.match(/^Episode\s+\d+$/i)
                          ) {
                            existing.title = gEp.name;
                          }
                          if (!existing.description && gEp.overview) {
                            existing.description = gEp.overview;
                          }
                        } else {
                          episodeMap.set(epNum, {
                            id: `ep-${epNum}`,
                            season: 1,
                            episode: epNum,
                            title: gEp.name || `Episode ${epNum}`,
                            duration: raw.duration ? `${raw.duration}m` : '24m',
                            thumbnail: epStill,
                            description: gEp.overview || '',
                          });
                        }
                      }
                    }

                    // Title-based fallback for cour seasons (like Bleach TYBW Part 4 where order is 40-46)
                    for (const [epNum, ep] of episodeMap.entries()) {
                      if (!ep.thumbnail && ep.title && ep.title !== `Episode ${epNum}`) {
                        const matched = titleToStill.get(ep.title.toLowerCase().trim());
                        if (matched?.still_path) {
                          ep.thumbnail = api.getImageUrl(matched.still_path, 'w500');
                          if (!ep.description && matched.overview) {
                            ep.description = matched.overview;
                          }
                        }
                      }
                    }
                  }
                }
              } catch {
                // Episode group lookup non-blocking
              }

              // Priority B: Regular Seasons
              const needsMoreThumbs = Array.from(episodeMap.values()).some((ep) => !ep.thumbnail);
              if (!handledByGroup || needsMoreThumbs) {
                const tvDetails = await request<{
                  number_of_episodes?: number;
                  first_air_date?: string;
                  seasons?: Array<{ season_number: number; name?: string; episode_count: number; air_date?: string }>;
                }>(tmdbUrl(`/tv/${bestTv.id}`));

                const validSeasons = (tvDetails.seasons || [])
                  .filter((s) => s.season_number > 0 && s.episode_count > 0)
                  .sort((a, b) => a.season_number - b.season_number);

                let seasonsToFetch: number[] = [];
                if (validSeasons.length === 1) {
                  seasonsToFetch = [validSeasons[0].season_number];
                } else if (validSeasons.length > 1) {
                  const matched = findMatchingSeason(
                    validSeasons,
                    [raw.title?.english, raw.title?.romaji, movie.title].filter(Boolean) as string[],
                    raw.startDate?.year || movie.year || undefined,
                    actualEpisodeCount
                  );
                  if (matched) {
                    seasonsToFetch = [matched.season_number];
                  } else {
                    seasonsToFetch = validSeasons.slice(0, 3).map((s) => s.season_number);
                  }
                }

                let currentOffset = 0;
                for (const sn of seasonsToFetch) {
                  const seasonData = await api.getSeasonDetails(String(bestTv.id), sn);
                  if (seasonData?.episodes && seasonData.episodes.length > 0) {
                    const titleToStill = new Map<string, { still_path?: string | null; overview?: string }>();
                    for (const tmdbEp of seasonData.episodes) {
                      if (tmdbEp.name && tmdbEp.still_path) {
                        titleToStill.set(tmdbEp.name.toLowerCase().trim(), tmdbEp);
                      }
                    }

                    // 1. Title matching (for cour seasons where seasonData epNum is 41-47 while AniList is 1-7)
                    for (const [num, ep] of episodeMap.entries()) {
                      if (!ep.thumbnail && ep.title && ep.title !== `Episode ${num}`) {
                        const matched = titleToStill.get(ep.title.toLowerCase().trim());
                        if (matched?.still_path) {
                          ep.thumbnail = api.getImageUrl(matched.still_path, 'w500');
                          if (!ep.description && matched.overview) {
                            ep.description = matched.overview;
                          }
                        }
                      }
                    }

                    // 2. Direct episode number matching with offset
                    for (const tmdbEp of seasonData.episodes) {
                      const epNum = tmdbEp.episode_number + currentOffset;
                      if (epNum > 0 && (isOnePiece || epNum <= actualEpisodeCount)) {
                        const epStill = tmdbEp.still_path ? api.getImageUrl(tmdbEp.still_path, 'w500') : null;
                        const existing = episodeMap.get(epNum);
                        if (existing) {
                          if (!existing.thumbnail && epStill) {
                            existing.thumbnail = epStill;
                          }
                          if (
                            (!existing.title || existing.title === `Episode ${epNum}`) &&
                            tmdbEp.name &&
                            !tmdbEp.name.match(/^Episode\s+\d+$/i)
                          ) {
                            existing.title = tmdbEp.name;
                          }
                          if (!existing.description && tmdbEp.overview) {
                            existing.description = tmdbEp.overview;
                          }
                        } else {
                          episodeMap.set(epNum, {
                            id: `ep-${epNum}`,
                            season: 1,
                            episode: epNum,
                            title: tmdbEp.name || `Episode ${epNum}`,
                            duration: raw.duration ? `${raw.duration}m` : '24m',
                            thumbnail: epStill,
                            description: tmdbEp.overview || '',
                          });
                        }
                      }
                    }

                    currentOffset += seasonData.episodes.length;
                  }
                }
              }
            }
          } catch {
            // TMDB enrichment is non-blocking
          }
        })(),

        // Task B: Kitsu Stills & Titles Enrichment (scoped to anime cours)
        (async () => {
          try {
            const titleCandidates = [
              raw.title?.english,
              raw.title?.romaji,
              movie.title,
            ].filter((t): t is string => Boolean(t && t.trim())).slice(0, 2);

            for (const cand of titleCandidates) {
              const kitsuRes = await fetchWithTimeout(
                `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(cand)}`,
                { headers: { Accept: 'application/vnd.api+json' } },
                2000
              );
              if (!kitsuRes.ok) continue;
              const kitsuData = await kitsuRes.json();
              const kItem = kitsuData.data?.[0];
              if (!kItem?.id) continue;

              const limit = Math.min(20, Math.max(1, actualEpisodeCount));
              const epRes = await fetchWithTimeout(
                `https://kitsu.io/api/edge/anime/${kItem.id}/episodes?page[limit]=${limit}&sort=number`,
                { headers: { Accept: 'application/vnd.api+json' } },
                2000
              );
              if (!epRes.ok) break;
              const epJson = await epRes.json();
              let kEpisodes: any[] = epJson.data || [];

              if (actualEpisodeCount > 20 && !isOnePiece) {
                const p2Res = await fetchWithTimeout(
                  `https://kitsu.io/api/edge/anime/${kItem.id}/episodes?page[limit]=20&page[offset]=20&sort=number`,
                  { headers: { Accept: 'application/vnd.api+json' } },
                  2000
                );
                if (p2Res.ok) {
                  const p2Json = await p2Res.json();
                  kEpisodes = kEpisodes.concat(p2Json.data || []);
                }
              }

              for (const kEp of kEpisodes) {
                const epNum = kEp.attributes?.number;
                if (typeof epNum !== 'number' || epNum < 1) continue;
                if (!isOnePiece && epNum > actualEpisodeCount) continue;

                const epTitle =
                  kEp.attributes?.canonicalTitle ||
                  kEp.attributes?.titles?.en_us ||
                  kEp.attributes?.titles?.en ||
                  kEp.attributes?.titles?.en_jp;
                const epThumb =
                  kEp.attributes?.thumbnail?.original ||
                  kEp.attributes?.thumbnail?.large ||
                  kEp.attributes?.thumbnail?.medium ||
                  kEp.attributes?.thumbnail?.small ||
                  null;
                const epDesc = kEp.attributes?.synopsis || '';

                const existing = episodeMap.get(epNum);
                if (existing) {
                  if (!existing.thumbnail && epThumb) {
                    existing.thumbnail = epThumb;
                  }
                  if (epTitle && (!existing.title || existing.title === `Episode ${epNum}` || (!isOnePiece && actualEpisodeCount <= 50))) {
                    existing.title = epTitle;
                  }
                  if (!existing.description && epDesc) {
                    existing.description = epDesc;
                  }
                } else {
                  episodeMap.set(epNum, {
                    id: `ep-${epNum}`,
                    season: 1,
                    episode: epNum,
                    title: epTitle || `Episode ${epNum}`,
                    duration: raw.duration ? `${raw.duration}m` : '24m',
                    thumbnail: epThumb,
                    description: epDesc,
                  });
                }
              }

              if (kEpisodes.length > 0) break;
            }
          } catch {
            // Kitsu is non-blocking
          }
        })(),
      ]);

      // 5. Fill in any remaining episodes strictly up to actualEpisodeCount with guaranteed fallback thumbnail
      const fallbackBackdrop = movie.backdropUrl || movie.posterUrl || null;
      const finalEpisodes: Episode[] = [];
      for (let i = 1; i <= actualEpisodeCount; i++) {
        const ep = episodeMap.get(i);
        if (ep) {
          if (!ep.thumbnail && fallbackBackdrop) {
            ep.thumbnail = fallbackBackdrop;
          }
          finalEpisodes.push(ep);
        } else {
          finalEpisodes.push({
            id: `ep-${i}`,
            season: 1,
            episode: i,
            title: `Episode ${i}`,
            duration: raw.duration ? `${raw.duration}m` : '24m',
            thumbnail: fallbackBackdrop,
            description: '',
          });
        }
      }

      finalEpisodes.sort((a, b) => a.episode - b.episode);
      return finalEpisodes;
    } catch {
      return [];
    }
  },

  getCharacters: async (
    id: string | number,
    cachedRaw?: AniListMedia
  ): Promise<{
    cast: Actor[];
  }> => {
    try {
      if (cachedRaw?.characters?.edges) {
        const cast: Actor[] = cachedRaw.characters.edges.slice(0, 12).map((edge) => ({
          id: String(edge?.node?.id || Math.random()),
          name: edge?.node?.name?.full || 'Actor',
          character: edge?.role === 'MAIN' ? 'Main Character' : 'Supporting Character',
          photoUrl: edge?.node?.image?.large || '',
        }));
        return { cast };
      }
      const { cast } = await anilistApi.getDetails(id);
      return { cast };
    } catch {
      return { cast: [] };
    }
  },

  mapAniListToInternal,
};

/**
 * Trailer keys, bounded. This Map was unbounded and never evicted, so a long
 * browsing session grew it without limit.
 */
const MAX_TRAILER_CACHE_ENTRIES = 300;
const trailerCache = new Map<string, string | null>();

function cacheTrailer(key: string, value: string | null): string | null {
  trailerCache.delete(key);
  trailerCache.set(key, value);
  while (trailerCache.size > MAX_TRAILER_CACHE_ENTRIES) {
    const oldest = trailerCache.keys().next().value;
    if (oldest === undefined) break;
    trailerCache.delete(oldest);
  }
  return value;
}

export async function getVideoTrailer(
  id: string,
  type: 'movie' | 'tv' | 'anime'
): Promise<string | null> {
  const cacheKey = `${type}-${id}`;
  if (trailerCache.has(cacheKey)) {
    // Refresh recency so the eviction above is LRU rather than insertion-order.
    const cached = trailerCache.get(cacheKey) ?? null;
    return cacheTrailer(cacheKey, cached);
  }

  try {
    if (type === 'anime') {
      // 1. Try AniList details for trailer
      try {
        const { raw } = await anilistApi.getDetails(id);
        if (raw?.trailer?.site === 'youtube' && raw.trailer.id) {
          return cacheTrailer(cacheKey, raw.trailer.id.trim());
        }
      } catch {
        // Suppress AniList fetch errors
      }

      // 2. Fallback to TMDB tv/movie search or videos if numeric ID
      if (/^\d+$/.test(id)) {
        try {
          const res = await api.getVideos('tv', id);
          const yt = res.results?.find(
            (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser' || v.type === 'Clip')
          );
          if (yt?.key) return cacheTrailer(cacheKey, yt.key);
        } catch {
          // Suppress fallback errors
        }
      }

      return cacheTrailer(cacheKey, null);
    }

    const res = await api.getVideos(type === 'tv' ? 'tv' : 'movie', id);
    if (!res?.results || res.results.length === 0) {
      return cacheTrailer(cacheKey, null);
    }

    // Prioritize official Trailer > any Trailer > Teaser > Clip > any YouTube video
    const youtubeVideos = res.results.filter((v) => v.site === 'YouTube' && v.key);
    const officialTrailer = youtubeVideos.find((v) => v.type === 'Trailer' && v.official);
    const anyTrailer = youtubeVideos.find((v) => v.type === 'Trailer');
    const anyTeaser = youtubeVideos.find((v) => v.type === 'Teaser');
    const anyClip = youtubeVideos.find((v) => v.type === 'Clip');
    const selected = officialTrailer || anyTrailer || anyTeaser || anyClip || youtubeVideos[0];

    return cacheTrailer(cacheKey, selected?.key || null);
  } catch {
    return cacheTrailer(cacheKey, null);
  }
}

/* ------------------------------------------------------------------------ */
/* Hover prefetch                                                            */
/*                                                                           */
/* This used to fire 4-5 parallel requests per poster hover with no memory   */
/* and no concurrency limit, so sweeping the mouse across one row queued     */
/* dozens of requests and pushed the genuinely-needed ones behind them.      */
/* `getDetails` now appends credits, videos and external_ids, so the warm    */
/* path is a single request.                                                 */
/* ------------------------------------------------------------------------ */

const PREFETCH_TTL_MS = 60_000;
const MAX_CONCURRENT_PREFETCH = 2;
const prefetchedAt = new Map<string, number>();
let activePrefetches = 0;

export async function prefetchMovieDetails(type: 'movie' | 'tv' | 'anime', id: string): Promise<void> {
  const key = `${type}-${id}`;
  const last = prefetchedAt.get(key);
  const now = Date.now();
  if (last !== undefined && now - last < PREFETCH_TTL_MS) return;
  if (activePrefetches >= MAX_CONCURRENT_PREFETCH) return;

  prefetchedAt.set(key, now);
  if (prefetchedAt.size > 400) {
    for (const [entry, at] of prefetchedAt) {
      if (now - at >= PREFETCH_TTL_MS) prefetchedAt.delete(entry);
    }
  }

  activePrefetches += 1;
  try {
    if (type === 'anime') {
      await anilistApi.getDetails(id).catch(() => {});
    } else {
      // One request: append_to_response already carries credits, videos,
      // images, keywords, external_ids and recommendations.
      await api.getDetails(type === 'tv' ? 'tv' : 'movie', id).catch(() => {});
    }
  } catch {
    // A failed prefetch is not an error the user should ever see.
  } finally {
    activePrefetches -= 1;
  }
}

export type { Quality };
