import React from 'react';
import { Play, Plus, Check } from 'lucide-react';
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

/**
 * Poster card.
 *
 * Two pieces of invented data were removed:
 *
 * - **"96% Match".** `Math.min(99, Math.max(75, rating * 10 + 8))` is the TMDB
 *   score with arithmetic on it, not a match; anything unrated fell back to a
 *   flat `96`. The score now comes from `getMatchScore`, which is derived from
 *   the viewer's own genre affinity, and renders **nothing** when there is not
 *   enough signal to say anything.
 * - **"Ultra HD".** Every film asserted 4K. Nothing in the payload says that.
 *   The badge now states the one thing that is actually known: the media type.
 *
 * The whole card is also reachable by keyboard, and the hover state is pure CSS
 * so moving the mouse across a row no longer re-renders every card.
 */
export function MovieCard({
  movie,
  onClick,
  tabIndex = 0,
  priority = false,
  rankLabel,
}: MovieCardProps) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, getMatchScore } = useApp();
  const inWatchlist = isInWatchlist(movie.id);
  const matchScore = getMatchScore(movie);

  const toggleWatchlist = (event: React.MouseEvent) => {
    event.stopPropagation();
    // Both actions already raise their own toast in the store; this used to
    // raise a second, differently-worded one on top of it.
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
    // The root was a bare `<div onClick>`: unreachable by keyboard, invisible to
    // screen readers, and skipped by tab order entirely.
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      onClick();
    }
  };

  const typeLabel = movie.type === 'anime' ? 'Anime' : movie.type === 'tv' ? 'Series' : 'Film';

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
      {/* 7movies Poster Container */}
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

      {/* 7movies Editorial Card Copy Underneath Poster */}
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
