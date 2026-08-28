import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getDominantColor } from '../lib/colorThief';
import { Play, Plus, Check, Info, Star } from 'lucide-react';
import { Movie, formatRating } from '../types';
import { api } from '../api';
import { useApp } from '../store';
import { cn } from '../lib/utils';

export function Hero({ onMovieSelect }: { onMovieSelect: (id: string, type: string) => void }) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, setAmbientColor } = useApp();

  useEffect(() => {
    let isMounted = true;
    api.getTrending('all', 'day').then((data) => {
      if (isMounted && data.results) {
        setMovies(data.results.slice(0, 5).map(api.mapToInternalMovie));
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (movies.length <= 1) return;

    const currentMovie = movies[currentIndex];
    if (currentMovie && currentMovie.backdropUrl) {
      const imageUrl = currentMovie.backdropUrl;
      getDominantColor(imageUrl).then((color) => {
        setAmbientColor(color);
      }).catch(() => {
        setAmbientColor(null);
      });
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 7000);
    return () => {
      clearInterval(interval);
    };
  }, [currentIndex, movies, setAmbientColor]);

  // Mouse Parallax effect for backdrop
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 15;
    const y = (e.clientY / window.innerHeight - 0.5) * 15;
    setMousePos({ x, y });
  };

  if (loading || movies.length === 0) {
    return (
      <div className="w-full min-h-[100dvh] h-[100dvh] relative skeleton-shimmer border-b border-white/5" />
    );
  }

  const currentMovie = movies[currentIndex];
  const inWatchlist = isInWatchlist(currentMovie.id);

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    if (inWatchlist) {
      removeFromWatchlist(currentMovie.id);
    } else {
      addToWatchlist(currentMovie);
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = rect.left + rect.width / 2;
      const clickY = rect.top + rect.height / 2;

      for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const angle = (i * 45) * (Math.PI / 180);
        const distance = 40 + Math.random() * 20;
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
    <div
      className="w-full min-h-[100dvh] h-[100dvh] relative overflow-hidden flex items-end select-none pb-24 sm:pb-32"
      onMouseMove={handleMouseMove}
    >
      {/* Dynamic Ambient Mesh Glow Orbs */}
      <div className="ambient-glow-orb -top-20 -left-20 w-[450px] h-[450px] bg-brand/30 z-0" />
      <div className="ambient-glow-orb top-1/3 right-0 w-[500px] h-[500px] bg-[#ffd066]/20 z-0" />

      {/* Backdrop Image Transitions */}
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          <motion.img
            src={currentMovie.backdropUrl || undefined}
            alt={currentMovie.title}
            className="w-full h-full object-cover"
            initial={{ scale: 1 }}
            animate={{
              scale: 1.15,
              x: mousePos.x,
              y: mousePos.y,
            }}
            transition={{
              scale: { duration: 8, ease: 'easeOut' },
              x: { type: 'spring', stiffness: 50, damping: 20 },
              y: { type: 'spring', stiffness: 50, damping: 20 },
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Cinema Gradient Scrims & Shading */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/50 to-transparent" />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 z-10 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      {/* Floating Particles Overlay */}
      <div
        className="absolute inset-0 z-10 pointer-events-none opacity-20 mix-blend-screen"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--theme-accent) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Main Hero Content */}
      <div className="relative z-20 max-w-5xl w-full pb-24 sm:pb-28 px-4 sm:px-10 lg:px-14">
        <motion.div
          key={`content-${currentIndex}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 mb-3 sm:mb-4">
            <span className="bg-brand/20 text-brand border border-brand/40 rounded-full px-3 py-1 text-[11px] sm:text-xs uppercase tracking-widest font-mono font-bold shadow-sm backdrop-blur-md">
              {currentMovie.type === 'tv' ? 'Series' : 'Featured Movie'}
            </span>

            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs sm:text-sm text-foreground font-bold shadow-sm">
              <Star className="w-3.5 h-3.5 text-[#ffd066] fill-[#ffd066]" />
              <span>{formatRating(currentMovie.rating)}</span>
              <span className="text-muted-foreground text-[10px] sm:text-xs font-normal">/ 10</span>
            </div>

            <span className="bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-foreground/90 text-xs sm:text-sm font-semibold">
              {currentMovie.year || '2024'}
            </span>

            {currentMovie.genres && currentMovie.genres.length > 0 && (
              <div className="hidden xs:flex flex-wrap items-center gap-1.5">
                {currentMovie.genres.slice(0, 2).map((genre: string) => (
                  <span
                    key={genre}
                    className="bg-white/5 backdrop-blur-md border border-white/5 rounded-full px-2.5 py-0.5 text-[11px] text-foreground/80 font-medium"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Hero Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-display font-black text-foreground mb-3 sm:mb-4 leading-[1.08] tracking-tight drop-shadow-2xl line-clamp-2">
            {currentMovie.title}
          </h1>

          {/* Description */}
          <p className="text-xs sm:text-base lg:text-lg text-foreground/85 mb-6 sm:mb-8 line-clamp-2 sm:line-clamp-3 max-w-2xl font-normal leading-relaxed drop-shadow-md">
            {currentMovie.tagline || currentMovie.description}
          </p>

          {/* Double-Bezel Island Actions */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => onMovieSelect(currentMovie.id, currentMovie.type)}
              className="group relative flex items-center gap-3 bg-brand text-brand-foreground rounded-full pl-5 pr-2 py-2 text-xs sm:text-base font-bold shadow-[0_10px_30px_-5px_var(--theme-accent-glow,rgba(232,133,42,0.5))] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <span>Watch Now</span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/15 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />
              </div>
            </button>

            {/* Watchlist Toggle */}
            <button
              type="button"
              onClick={handleWatchlistToggle}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-foreground rounded-full px-5 py-3 text-xs sm:text-sm font-semibold backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md cursor-pointer"
            >
              {inWatchlist ? (
                <Check className="w-4 h-4 text-brand" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{inWatchlist ? 'In Watchlist' : 'My List'}</span>
            </button>

            {/* Info Button */}
            <button
              type="button"
              onClick={() => onMovieSelect(currentMovie.id, currentMovie.type)}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 flex items-center justify-center text-foreground backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
              aria-label="More Info"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Interactive Carousel Switcher Pills (Bottom Right) */}
      {movies.length > 1 && (
        <div className="absolute bottom-24 sm:bottom-28 right-4 sm:right-10 z-30 hidden sm:flex items-center gap-2 bg-black/50 backdrop-blur-xl border border-white/10 p-1.5 rounded-full shadow-2xl">
          {movies.map((m, idx) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Slide ${idx + 1}: ${m.title}`}
              className={cn(
                "relative rounded-full transition-all duration-300 cursor-pointer overflow-hidden flex items-center justify-center",
                currentIndex === idx
                  ? "w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-brand shadow-lg"
                  : "w-6 h-6 sm:w-8 sm:h-8 opacity-60 hover:opacity-100"
              )}
            >
              {m.posterUrl ? (
                <img src={m.posterUrl} alt={m.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/20" />
              )}
              {currentIndex === idx && (
                <div className="absolute inset-0 bg-brand/20 backdrop-blur-[0.5px]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

