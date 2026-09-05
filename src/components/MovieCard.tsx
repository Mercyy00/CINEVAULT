import React, { useState } from 'react';
import { Play, Plus, Check, Star } from 'lucide-react';
import { Movie, formatRating } from '../types';
import { useApp } from '../store';
import { cn } from '../lib/utils';
import { api } from '../api';
import { PosterImage } from './PosterImage';
import { goToWatch } from '../lib/navigation';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
  cardIndex?: number;
  totalCards?: number;
  onExpandChange?: (expanded: boolean) => void;
}

export function MovieCard({
  movie,
  onClick,
}: MovieCardProps) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, showToast } = useApp();
  const inWatchlist = isInWatchlist(movie.id);
  const [, setIsHovered] = useState(false);

  const toggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWatchlist) {
      removeFromWatchlist(movie.id);
      showToast?.('Removed from My List');
    } else {
      addToWatchlist(movie);
      showToast?.('Added to My List');
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (movie.type === 'anime') {
      goToWatch(movie.id, 'anime', 1);
    } else if (movie.type === 'tv') {
      goToWatch(movie.id, 'tv', 1, 1);
    } else {
      goToWatch(movie.id, 'movie');
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Prefetch detail data so clicking is instant
    api.prefetchMovieDetails(movie.type, movie.id);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const matchPercentage = movie.rating
    ? Math.min(99, Math.max(75, Math.round(movie.rating * 10 + 8)))
    : 96;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="relative aspect-[2/3] w-full select-none cursor-pointer group"
    >
      <div className="double-bezel-card p-[1.5px] rounded-[1.25rem] w-full h-full transition-all duration-200 group-hover:shadow-[0_12px_32px_-8px_var(--theme-accent-glow,rgba(232,133,42,0.4))] group-hover:border-white/20">
        <div className="aspect-[2/3] w-full double-bezel-inner rounded-[calc(1.25rem-1.5px)] overflow-hidden relative bg-[#0b0c11]">
          {/* Progressive Blur-Up Poster Image */}
          <PosterImage
            src={movie.posterUrl}
            title={movie.title}
            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />

          {/* Quality Badge (Top-Right) */}
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/65 backdrop-blur-md text-white/90 border border-white/15 shadow-sm">
              {movie.type === 'anime' ? 'Anime' : movie.type === 'tv' ? 'Series' : 'Ultra HD'}
            </span>
          </div>

          {/* Rating Pill (Top-Left) */}
          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 bg-black/65 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15 shadow-sm">
            <Star className="w-3 h-3 text-[#f5a54a] fill-[#f5a54a]" />
            <span className="text-[10px] font-bold text-white font-mono">{formatRating(movie.rating)}</span>
          </div>

          {/* Quick Action Play & Watchlist Floating Buttons (Revealed on Hover) */}
          <div className="absolute inset-0 z-15 bg-gradient-to-t from-[#06070a]/95 via-[#06070a]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3">
            {/* Top row actions */}
            <div className="flex justify-end pt-8">
              <button
                type="button"
                onClick={toggleWatchlist}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-md",
                  inWatchlist
                    ? "bg-brand/20 border-brand text-brand"
                    : "bg-black/60 border-white/20 text-white hover:bg-white/20 hover:border-white/50"
                )}
                title={inWatchlist ? "In My List" : "Add to My List"}
                aria-label={inWatchlist ? "Remove from My List" : "Add to My List"}
              >
                {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>

            {/* Bottom info & Play Button */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={handlePlay}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-full bg-white hover:bg-white/90 text-black font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  title="Play Now"
                  aria-label={`Play ${movie.title}`}
                >
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                  <span>Play</span>
                </button>
                <span className="text-emerald-400 text-[10px] font-mono font-bold">{matchPercentage}% Match</span>
              </div>

              <p className="text-xs font-display font-extrabold truncate text-white drop-shadow-md">
                {movie.title}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/70">
                <span>{movie.year || '—'}</span>
                <span>•</span>
                <span className="capitalize">{movie.type}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

