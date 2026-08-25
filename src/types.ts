export type Quality = '4K' | '1080p' | '720p' | 'HD' | 'SD' | 'auto';
export type WatchStatus = 'Watched' | 'In Progress' | 'Not Started';
export type MediaType = 'movie' | 'tv' | 'anime';

/** Result of probing a playback source. `unknown` means it has not been tested. */
export type ServerStatus = 'unknown' | 'reachable' | 'unreachable' | 'maintenance';

export interface ServerOption {
  id: string;
  name: string;
  /** Highest quality the source advertises. Null when it does not say. */
  quality: Quality | null;
  /**
   * Measured round-trip time in milliseconds, or null when never probed.
   *
   * This was previously a hardcoded literal per server (12, 45, 8, ...) that
   * the UI rendered as live signal bars.
   */
  latencyMs: number | null;
  status: ServerStatus;
  buildUrl: (params: {
    id: string | number;
    season?: number;
    episode?: number;
    imdbId?: string;
  }) => string;
}

export interface Actor {
  id: string;
  name: string;
  character: string;
  photoUrl: string;
}

export interface Review {
  id: string;
  user: string;
  rating: number;
  content: string;
  verified: boolean;
}

export interface Episode {
  id: string;
  season: number;
  episode: number;
  title: string;
  /** Null when the source does not publish a runtime. */
  duration: string | null;
  /** Null when there is no still image. Callers must render a placeholder. */
  thumbnail: string | null;
  description: string;
}

/**
 * Normalised media record.
 *
 * Fields that the upstream API may not provide are nullable on purpose. They
 * used to be filled with plausible-looking defaults ('2h 10m', 'PG-13',
 * ['Action','Drama'], a rating of 8) which put fabricated data in front of
 * users. Rendering code must handle null and show a placeholder.
 */
export interface Movie {
  id: string;
  title: string;
  type: MediaType;
  tagline: string;
  description: string;
  /** 0 when the release year is unknown. */
  year: number;
  duration: string | null;
  /** Score out of 10, or null when the title has no votes yet. */
  rating: number | null;
  /** Number of votes behind `rating`. 0 means unrated. */
  voteCount?: number;
  /** Content certification, e.g. "PG-13". Null when not published. */
  ageRating: string | null;
  genres: string[];
  posterUrl: string | null;
  backdropUrl: string | null;
  servers: ServerOption[];
  cast: Actor[];
  reviews: Review[];
  episodes?: Episode[];
  /** 0-100, for continue-watching rows. */
  progress?: number;
  malId?: string;
  imdbId?: string;
  episodeCount?: number;
  status?: string;
  /** Runtime in minutes as reported upstream. */
  runtime?: number;
}

export interface ContinueWatchingItem {
  id: string;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  season_number?: number;
  episode_number?: number;
  /** 0-100. */
  progress_percentage: number;
  /** Epoch milliseconds of the last update. */
  timestamp: number;
  /**
   * Playback position in SECONDS.
   *
   * Two call sites previously assigned `Date.now()` here, writing epoch
   * milliseconds into a seconds field and corrupting every resume.
   */
  position_seconds: number;
  /** Total runtime in seconds, when known. Null disables progress display. */
  duration_seconds: number | null;
  mal_id?: string;
}

export interface WatchlistItem {
  movieId: string;
  movie: Movie;
  addedAt: number;
  status: WatchStatus;
}

/* -------------------------------------------------------------------------- */
/* Display helpers -- keep "unknown" rendering consistent across the UI.      */
/* -------------------------------------------------------------------------- */

/** Renders a score as "8.4", or an em dash when the title is unrated. */
export function formatRating(rating: number | null | undefined): string {
  return typeof rating === 'number' && rating > 0 ? rating.toFixed(1) : '—';
}

/** Renders a possibly-absent string, falling back to an em dash. */
export function formatOptional(value: string | null | undefined): string {
  return value && value.trim() ? value : '—';
}

/** Formats seconds as "1:23:45" or "23:45". */
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}
