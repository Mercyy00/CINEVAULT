import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Play, Plus, Check, Film, Star } from 'lucide-react';
import { Movie, formatRating } from '../types';
import { useApp } from '../store';
import { cn } from '../lib/utils';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
}

export function MovieCard({ movie, onClick }: MovieCardProps) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useApp();
  const inWatchlist = isInWatchlist(movie.id);

  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 280, damping: 22 });
  const mouseYSpring = useSpring(y, { stiffness: 280, damping: 22 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['6deg', '-6deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-6deg', '6deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / rect.width - 0.5;
    const yPct = mouseY / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const toggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWatchlist) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie);
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = rect.left + rect.width / 2;
      const clickY = rect.top + rect.height / 2;

      for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const angle = (i * 45) * (Math.PI / 180);
        const distance = 30 + Math.random() * 20;
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
        particle.style.left = `${clickX}px`;
        particle.style.top = `${clickY}px`;
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 600);
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className="group cursor-pointer relative z-0 hover:z-30 h-full w-full block select-none"
      whileHover={{ scale: 1.04, y: -4 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Outer Shell: Double-Bezel Hardware Architecture */}
      <div className="double-bezel-card p-[1.5px] rounded-[1.25rem] transition-all duration-300 group-hover:shadow-[0_20px_45px_-12px_var(--theme-accent-glow,rgba(232,133,42,0.4))]">
        {/* Inner Core */}
        <div className="aspect-[2/3] w-full double-bezel-inner rounded-[calc(1.25rem-1.5px)] overflow-hidden relative bg-[#0d0e12]">
          {/* Specular Sheen Layer on Hover */}
          <div className="sheen-layer" />

          {/* Poster Image or Fallback */}
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl || undefined}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-[#121318] flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
              <Film className="w-10 h-10 text-brand/60 mb-2" />
              <span className="text-xs font-semibold text-foreground/80 line-clamp-2">{movie.title}</span>
            </div>
          )}

          {/* Quality / Type Badge (Always visible top-right) */}
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white/90 border border-white/10 shadow-sm">
              {movie.type === 'anime' ? 'Anime' : movie.type === 'tv' ? 'Series' : 'HD'}
            </span>
          </div>

          {/* Top-Left Rating Pill (Subtle on resting, prominent on hover) */}
          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 shadow-sm">
            <Star className="w-3 h-3 text-[#f5a54a] fill-[#f5a54a]" />
            <span className="text-[10px] font-bold text-white font-mono">{formatRating(movie.rating)}</span>
          </div>

          {/* Hover Gradient Scrim & Quick Action Tray */}
          <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#06070a]/95 via-[#06070a]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5 sm:p-4">
            <div className="translate-y-3 group-hover:translate-y-0 transition-transform duration-300 ease-out flex flex-col gap-2">
              {/* Quick Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (movie.type === 'anime') {
                      window.location.hash = `#watch/ani/${movie.id}/1`;
                    } else if (movie.type === 'tv') {
                      window.location.hash = `#watch/tv/${movie.id}/1/1`;
                    } else {
                      window.location.hash = `#watch/movie/${movie.id}`;
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-brand text-brand-foreground font-bold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Play Now"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play</span>
                </button>

                <button
                  type="button"
                  onClick={toggleWatchlist}
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center border backdrop-blur-md transition-all active:scale-90 cursor-pointer",
                    inWatchlist
                      ? "bg-brand/20 border-brand text-brand shadow-sm"
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  )}
                  title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                >
                  {inWatchlist ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Title & Metadata */}
              <div>
                <p className="text-xs sm:text-sm font-display font-bold truncate text-white drop-shadow-md">
                  {movie.title}
                </p>
                <div className="flex items-center gap-2 text-[10px] font-mono text-white/70 mt-0.5">
                  <span>{movie.year || '2024'}</span>
                  <span>•</span>
                  <span className="capitalize">{movie.type}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

