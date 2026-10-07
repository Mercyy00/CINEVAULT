import React from 'react';
import { Play, Plus, Check, Star } from 'lucide-react';
import { Movie, formatRating } from '../types';
import { useApp } from '../store';
import { cn } from '../lib/utils';
import { api, POSTER_SIZES } from '../api';
import { PosterImage } from './PosterImage';
import { goToWatch } from '../lib/navigation';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
  /**
   * Roving tabindex, owned by the row. Only one card in a horizontal list should
   * be in the tab order; arrow keys move between them.
   */
  tabIndex?: number;
  /** Above-the-fold cards skip lazy loading and get fetch priority. */
  priority?: boolean;
  /**
   * Rank within a numbered row. The numeral beside the card is decorative, so
   * the position has to reach assistive tech through the accessible name.
   */
  rankLabel?: string;
}

export function MovieCard({
  movie,
  onClick,
  tabIndex = 0,
  priority = false,
  rankLabel,
}: MovieCardProps) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, getMatchScore, uiMode } = useApp();
  const inWatchlist = isInWatchlist(movie.id);
  const matchScore = getMatchScore(movie);

  const toggleWatchlist = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (inWatchlist) removeFromWatchlist(movie.id);
    else addToWatchlist(movie);
  };

  const handlePlay = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (movie.type === 'anime') goToWatch(movie.id, 'anime', 1);
    else if (movie.type === 'tv') goToWatch(movie.id, 'tv', 1, 1);
    else goToWatch(movie.id, 'movie');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      onClick();
    }
  };

  const typeLabel = movie.type === 'anime' ? 'Anime' : movie.type === 'tv' ? 'Series' : 'Film';

  if (uiMode === 'classic') {
    return (
      <div
        role="button"
        tabIndex={tabIndex}
        aria-label={`${movie.title}${movie.year ? `, ${movie.year}` : ''} — view details`}
        onMouseEnter={() => api.prefetchMovieDetails(movie.type, movie.id)}
        onFocus={() => api.prefetchMovieDetails(movie.type, movie.id)}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        data-movie-card
        className="group block relative w-full aspect-[2/3] rounded-2xl overflow-hidden glass border border-white/10 shadow-card hover:shadow-hover hover:border-brand/40 transition-all duration-300 transform-gpu hover:-translate-y-1.5 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none select-none text-left cursor-pointer"
      >
        <PosterImage
          src={movie.posterUrl}
          srcSet={movie.posterSrcSet}
          thumbSrc={movie.posterThumbUrl}
          sizes={POSTER_SIZES}
          title={movie.title}
          decorative
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Media type (Top-Right) */}
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/70 backdrop-blur-xl text-white/90 border border-white/15">
            {typeLabel}
          </span>
        </div>

        {/* Rating pill (Top-Left) */}
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 bg-black/70 backdrop-blur-xl px-2 py-0.5 rounded-full border border-white/15">
          <Star className="w-3 h-3 text-brand fill-brand" aria-hidden="true" />
          <span className="text-[10px] font-bold text-white font-mono">
            {formatRating(movie.rating)}
          </span>
        </div>

        {/* Progress bar for partially-watched titles */}
        {typeof movie.progress === 'number' && movie.progress > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 z-20"
            role="progressbar"
            aria-valuenow={Math.round(movie.progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(movie.progress)}% watched`}
          >
            <div className="h-full bg-brand" style={{ width: `${Math.min(100, movie.progress)}%` }} />
          </div>
        )}

        {/* Hover / focus overlay */}
        <div className="absolute inset-0 z-[15] bg-gradient-to-t from-[#06070a]/95 via-[#06070a]/45 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 focus-within:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5">
          <div className="flex justify-end pt-8">
            <button
              type="button"
              onClick={toggleWatchlist}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center border backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-md',
                inWatchlist
                  ? 'bg-brand/20 border-brand text-brand'
                  : 'bg-black/60 border-white/20 text-white hover:bg-white/20 hover:border-white/50'
              )}
              aria-pressed={inWatchlist}
              aria-label={
                inWatchlist ? `Remove ${movie.title} from My List` : `Add ${movie.title} to My List`
              }
            >
              {inWatchlist ? (
                <Check className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Plus className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={handlePlay}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-full bg-white hover:bg-white/90 text-black font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                aria-label={`Play ${movie.title}`}
              >
                <Play className="w-3 h-3 fill-current ml-0.5" aria-hidden="true" />
                <span>Play</span>
              </button>
              {matchScore !== null && (
                <span className="text-white/60 text-[10px] font-mono font-bold">
                  {matchScore}% Match
                </span>
              )}
            </div>

            <p className="text-xs font-display font-extrabold truncate text-white drop-shadow-md">
              {movie.title}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/70">
              <span>{movie.year || '—'}</span>
              <span aria-hidden="true">•</span>
              <span className="capitalize">{movie.type}</span>
              {movie.ageRating && (
                <>
                  <span aria-hidden="true">•</span>
                  <span className="px-1 border border-white/25 rounded">{movie.ageRating}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={tabIndex}
      aria-label={`${rankLabel ? `Number ${rankLabel}: ` : ''}${movie.title}${movie.year ? `, ${movie.year}` : ''} — view details`}
      onMouseEnter={() => api.prefetchMovieDetails(movie.type, movie.id)}
      onFocus={() => api.prefetchMovieDetails(movie.type, movie.id)}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      data-movie-card
      className="media-card group block w-full outline-none select-none text-left cursor-pointer"
    >
      {/* Modern Poster Container */}
      <div className="poster relative w-full aspect-[2/3] rounded-[12px] overflow-hidden bg-[#1b191c] border border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.55)]">
        <PosterImage
          src={movie.posterUrl}
          srcSet={movie.posterSrcSet}
          thumbSrc={movie.posterThumbUrl}
          sizes={POSTER_SIZES}
          title={movie.title}
          decorative
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Rank Numeral (Top-Left) for Top 10 lists */}
        {rankLabel && (
          <span className="card-number font-mono">
            {rankLabel.padStart(2, '0')}
          </span>
        )}

        {/* Watchlist Quick-Action Button (Top-Right) */}
        <button
          type="button"
          onClick={toggleWatchlist}
          className={cn(
            'card-watchlist',
            inWatchlist && 'is-saved !opacity-100 !scale-100'
          )}
          aria-pressed={inWatchlist}
          aria-label={
            inWatchlist ? `Remove ${movie.title} from My List` : `Add ${movie.title} to My List`
          }
          title={inWatchlist ? 'Remove from My List' : 'Add to My List'}
        >
          {inWatchlist ? (
            <Check className="w-3.5 h-3.5 text-[#111]" aria-hidden="true" />
          ) : (
            <Plus className="w-3.5 h-3.5 text-white" aria-hidden="true" />
          )}
        </button>

        {/* Play Action Floating Overlay on Card Hover */}
        <div className="absolute inset-x-0 bottom-0 p-2.5 z-10 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 flex items-center justify-between pointer-events-none">
          <button
            type="button"
            onClick={handlePlay}
            className="pointer-events-auto h-7 px-2.5 rounded-full bg-white hover:bg-white/90 text-black font-extrabold text-[11px] shadow-lg flex items-center gap-1 active:scale-95 transition-transform"
            aria-label={`Play ${movie.title}`}
          >
            <Play className="w-2.5 h-2.5 fill-current ml-0.5" aria-hidden="true" />
            <span>Play</span>
          </button>
          {matchScore !== null && (
            <span className="text-[10px] font-mono font-bold text-white/90 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded">
              {matchScore}%
            </span>
          )}
        </div>

        {/* Progress bar for partially-watched titles */}
        {typeof movie.progress === 'number' && movie.progress > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 z-20"
            role="progressbar"
            aria-valuenow={Math.round(movie.progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(movie.progress)}% watched`}
          >
            <div className="h-full bg-white" style={{ width: `${Math.min(100, movie.progress)}%` }} />
          </div>
        )}
      </div>

      {/* Modern Editorial Card Copy Underneath Poster */}
      <div className="card-copy pt-2 px-0.5">
        <h4>
          <span className="font-display font-semibold text-[13.5px] leading-snug text-[#f3f0ea] truncate block group-hover:text-white transition-colors">
            {movie.title}
          </span>
        </h4>
        <p className="font-mono text-[10px] text-[#929093] tracking-wider uppercase flex items-center gap-1.5 mt-0.5">
          <span>{movie.year || '—'}</span>
          <span className="opacity-40">·</span>
          <span>{typeLabel}</span>
          {movie.rating ? (
            <>
              <span className="opacity-40">·</span>
              <span className="card-rating-star text-[#f5c518]">★</span>
              <span>{formatRating(movie.rating)}</span>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
