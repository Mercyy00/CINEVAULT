import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Play, Plus, Check, Film, Star } from 'lucide-react';
import { Movie, formatRating } from '../types';
import { useApp } from '../store';

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

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7deg', '-7deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7deg', '7deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
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
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      
      for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const angle = (i * 45) * (Math.PI / 180);
        const distance = 30 + Math.random() * 20;
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
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
      className="group cursor-pointer rounded-xl relative z-0 hover:z-20 h-full w-full block"
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2 }}
    >
      <div className="aspect-[2/3] w-full rounded-xl overflow-hidden relative border border-transparent transition-all duration-300 group-hover:border-brand/40 shadow-card">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl || undefined}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-black/50 glass flex flex-col items-center justify-center text-muted-foreground group-hover:scale-[1.03] transition-transform duration-700">
            <Film className="w-12 h-12 text-brand opacity-50 mb-2" />
            <span className="text-sm font-medium text-center px-4 line-clamp-2">{movie.title}</span>
          </div>
        )}
        {/* Subtle inner ring overlay */}
        <div className="absolute inset-0 ring-1 ring-inset ring-white/5 rounded-xl pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button 
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
                className="w-8 h-8 rounded-full bg-brand text-background flex items-center justify-center hover:scale-125 transition-transform shadow-card z-20 relative"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </button>
              <button
                onClick={toggleWatchlist}
                className="w-8 h-8 rounded-full border border-foreground text-foreground flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
            <div>
              <p className="text-sm font-semibold truncate text-white">{movie.title}</p>
              <div className="flex items-center gap-2 text-xs font-medium mt-1">
                <span className="text-brand flex items-center gap-1">
                  <Star className="w-3 h-3 fill-brand text-brand" />
                  {formatRating(movie.rating)} <span className="text-muted-foreground text-[10px]">/ 10</span>
                </span>
                <span className="text-xs text-muted-foreground">{movie.year}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
