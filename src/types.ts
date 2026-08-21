export type Quality = '4K' | 'HD' | 'SD';
export type WatchStatus = 'Watched' | 'In Progress' | 'Not Started';

export interface ServerOption {
  id: string;
  name: string;
  quality: Quality;
  latency: number;
  status: 'working' | 'maintenance';
  url?: string | ((id: string | number, season?: number, episode?: number, imdbId?: string) => string);
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
  duration: string;
  thumbnail: string;
  description: string;
}

export interface Movie {
  id: string;
  title: string;
  type: 'movie' | 'tv' | 'anime';
  tagline: string;
  description: string;
  year: number;
  duration: string;
  rating: number; // 0-5
  ageRating: string;
  genres: string[];
  posterUrl: string;
  backdropUrl: string;
  videoUrl?: string; // Placeholder for actual video
  servers: ServerOption[];
  cast: Actor[];
  reviews: Review[];
  episodes?: Episode[];
  progress?: number; // 0-100 for continue watching
  malId?: string;
  imdbId?: string;
  episodeCount?: number;
  status?: string;
}

export interface ContinueWatchingItem {
  id: string;
  media_type: 'movie' | 'tv' | 'anime';
  title: string;
  poster_path: string;
  backdrop_path: string;
  season_number?: number;
  episode_number?: number;
  progress_percentage: number;
  timestamp: number;
  time: number;
  mal_id?: string;
}

export interface WatchlistItem {
  movieId: string;
  movie: Movie;
  addedAt: number;
  status: WatchStatus;
}
