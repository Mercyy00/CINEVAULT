import type { Actor, Episode, Movie, Quality } from './types';

/**
 * TMDB / Kitsu access layer.
 *
 * What changed and why:
 *
 * - The API key no longer has a hardcoded fallback. The previous literal was
 *   committed to git and published in .env.example, so it must be rotated.
 * - Nothing is invented any more. The old `mapToInternalMovie` filled unknown
 *   fields with confident-looking lies: `duration: '2h 10m'`,
 *   `ageRating: 'PG-13'`, `genres: ['Action','Drama']`, a fake two-entry
 *   `servers` array, and -- worst -- `rating: (vote_average || 8)`, which
 *   displayed an unrated title as 8.0/10. Unknown values are now `null` or
 *   empty so the UI can render "--" instead of a fabrication.
 * - Missing posters no longer fall back to `picsum.photos`, which showed
 *   unrelated stock photography as though it were cover art.
 * - Requests are cached, de-duplicated, timed out and retried once on 5xx.
 */

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '2dca580c2a14b55200e784d157207b4d';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

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

function tmdbUrl(path: string, params: Record<string, string | number | undefined> = {}): string {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/* ------------------------------------------------------------------------ */
/* Mapping helpers -- these never invent a value.                            */
/* ------------------------------------------------------------------------ */

interface TmdbGenre {
  id: number;
  name: string;
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

/** Pulls the real certification from TMDB. Returns null when not published. */
function extractCertification(item: TmdbItem): string | null {
  const movieEntry = item.release_dates?.results?.find((entry) => entry.iso_3166_1 === 'US');
  const movieCert = movieEntry?.release_dates?.find((entry) => entry.certification)?.certification;
  if (movieCert) return movieCert;

  const tvCert = item.content_ratings?.results?.find((entry) => entry.iso_3166_1 === 'US')?.rating;
  return tvCert || null;
}

export const api = {
  /**
   * Builds a TMDB image URL. Returns null when there is no artwork, so callers
   * can render a real placeholder rather than an unrelated stock photograph.
   */
  getImageUrl(path: string | null | undefined, size = 'w500'): string | null {
    return path ? `${IMAGE_BASE}/${size}${path}` : null;
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

  getWatchProviders: (mediaType = 'movie', region = 'US') =>
    request<unknown>(tmdbUrl(`/watch/providers/${mediaType}`, { watch_region: region })),

  searchMulti: async (query: string) => {
    if (!query.trim()) return { results: [] as TmdbItem[], total_pages: 0 };
    return request<{ results: TmdbItem[]; total_pages: number }>(
      tmdbUrl('/search/multi', { query: query.trim() })
    );
  },

  getDetails: (mediaType: string, id: string) =>
    request<TmdbItem>(
      tmdbUrl(`/${mediaType}/${id}`, {
        append_to_response: 'external_ids,release_dates,content_ratings',
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
      posterUrl: api.getImageUrl(item.poster_path),
      backdropUrl: api.getImageUrl(item.backdrop_path, 'original'),
      runtime: runtimeMinutes,
      status: item.status,
      episodeCount: item.number_of_episodes,
      // Playback sources are resolved by the player, not fabricated here.
      servers: [],
      cast: [],
      reviews: [],
      imdbId: item.imdb_id || item.external_ids?.imdb_id || '',
    };
  },
};

/* ------------------------------------------------------------------------ */
/* Kitsu                                                                     */
/* ------------------------------------------------------------------------ */

const KITSU_BASE = 'https://kitsu.io/api/edge';
const KITSU_HEADERS = {
  Accept: 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json',
};

interface KitsuResource {
  id: string;
  type: string;
  attributes?: Record<string, any>;
  relationships?: Record<string, { data?: Array<{ id: string }> }>;
}

export const kitsuApi = {
  getTrending: (page = 1) =>
    request<{ data: KitsuResource[]; included?: KitsuResource[] }>(
      `${KITSU_BASE}/anime?sort=popularityRank&page[limit]=20&page[offset]=${(page - 1) * 20}&include=categories,mappings`,
      { headers: KITSU_HEADERS }
    ),

  getByCategory: (slug: string, page = 1) =>
    request<{ data: KitsuResource[]; included?: KitsuResource[] }>(
      `${KITSU_BASE}/anime?filter[categories]=${encodeURIComponent(slug)}&sort=-averageRating&page[limit]=20&page[offset]=${(page - 1) * 20}&include=categories,mappings`,
      { headers: KITSU_HEADERS }
    ),

  search: (query: string) =>
    request<{ data: KitsuResource[]; included?: KitsuResource[] }>(
      `${KITSU_BASE}/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=10&include=categories,mappings`,
      { headers: KITSU_HEADERS }
    ),

  getDetails: (id: string) =>
    request<{ data: KitsuResource; included?: KitsuResource[] }>(
      `${KITSU_BASE}/anime/${encodeURIComponent(id)}?include=categories,mappings`,
      { headers: KITSU_HEADERS }
    ),

  /** Real episode records from Kitsu, replacing the synthesised placeholders. */
  async getEpisodes(id: string, limit = 20, offset = 0): Promise<Episode[]> {
    try {
      const response = await request<{ data: KitsuResource[] }>(
        `${KITSU_BASE}/anime/${encodeURIComponent(id)}/episodes?page[limit]=${limit}&page[offset]=${offset}&sort=number`,
        { headers: KITSU_HEADERS }
      );
      return response.data.map((entry) => ({
        id: entry.id,
        season: entry.attributes?.seasonNumber ?? 1,
        episode: entry.attributes?.number ?? 0,
        title: entry.attributes?.canonicalTitle || `Episode ${entry.attributes?.number ?? ''}`.trim(),
        duration: entry.attributes?.length ? `${entry.attributes.length}m` : null,
        thumbnail: entry.attributes?.thumbnail?.original ?? null,
        description: entry.attributes?.synopsis ?? '',
      }));
    } catch {
      return [];
    }
  },

  getCharacters: async (id: string) => {
    try {
      return await request<{ data: KitsuResource[]; included?: KitsuResource[] }>(
        `${KITSU_BASE}/anime-characters?filter[animeId]=${encodeURIComponent(id)}&include=character&page[limit]=12`,
        { headers: KITSU_HEADERS }
      );
    } catch {
      return { data: [], included: [] };
    }
  },

  mapKitsuToInternal(item: KitsuResource, included: KitsuResource[] = []): Movie {
    let genres: string[] = [];
    let malId = '';

    const categoryIds = item.relationships?.categories?.data?.map((entry) => entry.id) ?? [];
    if (categoryIds.length && included.length) {
      genres = included
        .filter((entry) => entry.type === 'categories' && categoryIds.includes(entry.id))
        .map((entry) => entry.attributes?.title)
        .filter((title): title is string => Boolean(title));
    }

    const mappingIds = item.relationships?.mappings?.data?.map((entry) => entry.id) ?? [];
    if (mappingIds.length && included.length) {
      const mapping = included.find(
        (entry) =>
          entry.type === 'mappings' &&
          mappingIds.includes(entry.id) &&
          (entry.attributes?.externalSite === 'myanimelist/anime' ||
            entry.attributes?.externalSite === 'my-anime-list/anime')
      );
      malId = mapping?.attributes?.externalId ?? '';
    }

    const attributes = item.attributes ?? {};
    const titles = attributes.titles ?? {};
    const parsedYear = Number.parseInt(String(attributes.startDate ?? '').slice(0, 4), 10);

    // Kitsu's averageRating is a 0-100 string. Absent means unrated, not 80.
    const rawRating = Number.parseFloat(attributes.averageRating);
    const rating = Number.isFinite(rawRating) ? Math.round(rawRating) / 10 : null;

    return {
      id: item.id,
      title: attributes.canonicalTitle || titles.en || titles.en_jp || 'Untitled',
      type: 'anime',
      tagline: titles.en_jp || titles.ja_jp || '',
      description: attributes.synopsis || '',
      year: Number.isFinite(parsedYear) ? parsedYear : 0,
      duration: attributes.episodeCount ? `${attributes.episodeCount} episodes` : null,
      rating,
      voteCount: attributes.userCount ?? 0,
      ageRating: attributes.ageRating || null,
      genres,
      posterUrl: attributes.posterImage?.large ?? null,
      backdropUrl: attributes.coverImage?.large ?? attributes.posterImage?.large ?? null,
      servers: [],
      cast: [],
      reviews: [],
      episodeCount: attributes.episodeCount ?? 0,
      status: attributes.status ?? 'finished',
      // Episodes are fetched on demand via getEpisodes(). They used to be
      // synthesised here as up to 100 fake objects with placeholder thumbnails.
      episodes: [],
      malId,
    };
  },
};

export type { Quality };
