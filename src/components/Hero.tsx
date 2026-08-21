import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getDominantColor } from '../lib/colorThief';
import { Play, Plus, Check, Info } from 'lucide-react';
import { Movie } from '../types';
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
    api.getTrending('all', 'day').then(data => {
      if (isMounted && data.results) {
        setMovies(data.results.slice(0, 3).map(api.mapToInternalMovie));
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
    if (currentMovie && currentMovie.backdrop_path) {
      const imageUrl = `https://image.tmdb.org/t/p/w500${currentMovie.backdrop_path}`;
      getDominantColor(imageUrl).then(color => {
        setAmbientColor(color);
      }).catch(err => {
        setAmbientColor(null);
      });
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 6000);
    return () => {
      clearInterval(interval);
      setAmbientColor(null);
    };
  }, [movies.length]);

  // Mouse Parallax effect for backdrop
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    setMousePos({ x, y });
  };

  if (loading || movies.length === 0) {
    return (
      <div className="w-full h-[88vh] min-h-[560px] relative skeleton-shimmer border-b border-white/5" />
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
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      
      for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const angle = (i * 45) * (Math.PI / 180);
        const distance = 40 + Math.random() * 20;
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
    <div 
      className="w-full h-[88vh] min-h-[560px] relative overflow-hidden flex items-end"
      onMouseMove={handleMouseMove}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="absolute inset-0 z-0"
        >
          <motion.img
            src={currentMovie.backdropUrl || undefined}
            alt={currentMovie.title}
            className="w-full h-full object-cover"
            style={{ 
              transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.05)`,
            }}
            animate={{
              scale: [1.05, 1.15],
            }}
            transition={{
              duration: 10,
              ease: 'linear',
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-background/80 via-background/30 to-transparent" />

      {/* Floating Particles Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-30 mix-blend-screen" 
           style={{ backgroundImage: 'radial-gradient(circle, var(--theme-accent) 1px, transparent 1px)', backgroundSize: '100px 100px', animation: 'drift 20s linear infinite' }} />

      <div className="relative z-20 max-w-4xl w-full pb-28 sm:pb-36 px-4 sm:px-10 lg:px-14">
        <motion.div
          key={`content-${currentIndex}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-5">
            <span className="bg-white/15 backdrop-blur-md border border-white/10 rounded-full px-2.5 sm:px-3.5 py-0.5 sm:py-1 text-[11px] sm:text-sm text-foreground uppercase tracking-wider font-bold shadow-sm">
              {currentMovie.type === 'tv' ? 'Series' : 'Movie'}
            </span>
            <div className="flex items-center gap-1 text-sm sm:text-lg text-foreground font-bold drop-shadow-md">
              <span className="text-brand">★</span>
              <span>{currentMovie.rating.toFixed(1)}</span>
              <span className="text-muted-foreground text-[10px] sm:text-sm font-normal">/ 10</span>
            </div>
            <span className="text-foreground/90 text-sm sm:text-lg font-semibold">{currentMovie.year}</span>
            {currentMovie.genres && currentMovie.genres.length > 0 && (
              <div className="hidden xs:flex flex-wrap items-center gap-1.5 sm:gap-2">
                {currentMovie.genres.slice(0, 2).map((genre: string) => (
                  <span key={genre} className="bg-white/10 backdrop-blur-sm border border-white/5 rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-sm text-foreground/80 font-medium">{genre}</span>
                ))}
              </div>
            )}
          </div>

          {/* Hero Title */}
          <h1 className="text-2xl sm:text-6xl lg:text-7xl font-display font-black text-foreground mb-3 sm:mb-5 leading-[1.08] tracking-tight drop-shadow-2xl line-clamp-2">
            {currentMovie.title}
          </h1>

          {/* Description */}
          <p className="text-xs sm:text-xl lg:text-2xl text-foreground/90 mb-5 sm:mb-8 line-clamp-2 sm:line-clamp-3 max-w-2xl font-normal leading-relaxed drop-shadow-lg">
            {currentMovie.tagline || currentMovie.description}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
            <button 
              onClick={() => onMovieSelect(currentMovie.id, currentMovie.type)}
              className="flex items-center gap-2 sm:gap-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5 sm:px-7 h-10 sm:h-14 text-xs sm:text-lg font-bold transition-all duration-300 hover:scale-105 shadow-xl cursor-pointer"
            >
              <Play className="w-4 h-4 sm:w-6 sm:h-6 fill-current" />
              View Details
            </button>
            <button 
              onClick={handleWatchlistToggle}
              className="flex items-center gap-2 glass border border-white/15 text-foreground hover:bg-white/20 rounded-full px-4 sm:px-6 h-10 sm:h-14 text-xs sm:text-lg font-semibold transition-all duration-300 relative overflow-hidden group shadow-lg cursor-pointer"
            >
              {inWatchlist ? <Check className="w-4 h-4 sm:w-6 sm:h-6 text-brand" /> : <Plus className="w-4 h-4 sm:w-6 sm:h-6" />}
              {inWatchlist ? 'In Watchlist' : 'My List'}
            </button>
            <button
              onClick={() => onMovieSelect(currentMovie.id, currentMovie.type)}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full glass flex items-center justify-center border border-white/15 hover:bg-white/20 transition-all text-foreground shadow-lg cursor-pointer hover:scale-105"
              aria-label="More Info"
            >
              <Info className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
          </div>
        </motion.div>
      </div>
      
      <style>{`
        @keyframes drift {
          from { background-position: 0 0; }
          to { background-position: -100px 100px; }
        }
      `}</style>
    </div>
  );
}
