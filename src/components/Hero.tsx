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
      <div className="w-full h-[85vh] md:h-[95vh] relative skeleton-shimmer border-b border-white/5" />
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
      className="w-full h-[85vh] md:h-[95vh] relative overflow-hidden flex items-end pb-24 md:pb-32"
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

      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[var(--theme-bg)] via-[var(--theme-bg)]/60 to-transparent" />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[var(--theme-bg)] via-transparent to-transparent opacity-80" />

      {/* Floating Particles Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-30 mix-blend-screen" 
           style={{ backgroundImage: 'radial-gradient(circle, var(--theme-accent) 1px, transparent 1px)', backgroundSize: '100px 100px', animation: 'drift 20s linear infinite' }} />

      <div className="relative z-20 px-6 md:px-12 max-w-[1600px] w-full mx-auto">
        <motion.div
          key={`content-${currentIndex}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2 py-1 bg-cv-gold text-cv-gold-content text-xs font-bold rounded-sm uppercase tracking-wider">
              {currentMovie.type === 'tv' ? 'Series' : 'Movie'}
            </span>
            <span className="text-cv-gold font-medium text-sm drop-shadow-md">★ {currentMovie.rating.toFixed(1)} <span className="text-cv-slate text-xs">/ 10</span></span>
            <span className="text-cv-cream opacity-80 text-sm">{currentMovie.year}</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-serif font-bold text-cv-cream mb-4 leading-tight drop-shadow-xl text-glow">
            {currentMovie.title}
          </h1>

          <p className="text-lg md:text-xl text-cv-cream opacity-90 mb-8 line-clamp-3 max-w-xl drop-shadow-md font-medium">
            {currentMovie.tagline || currentMovie.description}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={() => onMovieSelect(currentMovie.id, currentMovie.type)}
              className="flex items-center gap-2 bg-cv-gold hover:bg-white text-cv-gold-content px-8 py-3 rounded-md font-bold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,168,83,0.5)]"
            >
              <Play className="w-5 h-5 fill-current" />
              View Details
            </button>
            <button 
              onClick={handleWatchlistToggle}
              className="flex items-center gap-2 glass-panel border border-cv-cream/30 hover:border-cv-cream text-cv-cream px-6 py-3 rounded-md font-medium transition-all duration-300 hover:bg-white/10 relative overflow-hidden group"
            >
              {inWatchlist ? <Check className="w-5 h-5 text-cv-gold" /> : <Plus className="w-5 h-5" />}
              {inWatchlist ? 'Added' : 'My List'}
            </button>
            <button
              onClick={() => onMovieSelect(currentMovie.id, currentMovie.type)}
              className="w-12 h-12 rounded-md glass-panel flex items-center justify-center border border-white/20 hover:bg-white/10 transition-colors text-cv-cream"
            >
              <Info className="w-6 h-6" />
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
