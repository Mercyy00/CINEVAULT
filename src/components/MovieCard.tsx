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
      className="relative aspect-[2/3] w-full select-none cursor-pointer group rounded-[1.25rem] outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-[#06070a]"
    >
      <div className="double-bezel-card p-[1.5px] rounded-[1.25rem] w-full h-full transition-all duration-200 group-hover:shadow-[0_12px_32px_-8px_var(--theme-accent-glow,rgba(232,133,42,0.4))] group-hover:border-white/20">
        <div className="aspect-[2/3] w-full double-bezel-inner rounded-[calc(1.25rem-1.5px)] overflow-hidden relative bg-[#0b0c11]">
          {/* Responsive poster: `srcSet` means a 150px phone card no longer
              downloads the same w500 file as a 500px desktop one. */}
          <PosterImage
            src={movie.posterUrl}
            srcSet={movie.posterSrcSet}
            thumbSrc={movie.posterThumbUrl}
            sizes={POSTER_SIZES}
            title={movie.title}
            decorative
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />

          {/* Media type (Top-Right). Not a quality claim. */}
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/65 backdrop-blur-md text-white/90 border border-white/15 shadow-sm">
              {typeLabel}
            </span>
          </div>

          {/* Rating pill (Top-Left). Renders an em dash when unrated. */}
          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 bg-black/65 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15 shadow-sm">
            <Star className="w-3 h-3 text-[#f5a54a] fill-[#f5a54a]" aria-hidden="true" />
            <span className="text-[10px] font-bold text-white font-mono">
              {formatRating(movie.rating)}
            </span>
          </div>

          {/* Progress bar for partially-watched titles. */}
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

          {/* Hover / focus overlay. CSS-driven: no state, no re-render. */}
          <div className="absolute inset-0 z-[15] bg-gradient-to-t from-[#06070a]/95 via-[#06070a]/40 to-transparent opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 focus-within:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
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
                {/* Omitted entirely when affinity is unknown, rather than
                    substituting a plausible-looking number. */}
                {matchScore !== null && (
                  <span className="text-emerald-400 text-[10px] font-mono font-bold">
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
      </div>
    </div>
  );
}
