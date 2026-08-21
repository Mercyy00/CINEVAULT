import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Plus, Check } from 'lucide-react';
import { Movie } from '../types';
import { api, kitsuApi } from '../api';
import { useApp } from '../store';
import { getDominantColor } from '../lib/colorThief';

const heroCache: Record<string, Movie[]> = {};

export function HeroSpotlight({ type, onMovieSelect }: { type: 'movie' | 'tv' | 'anime', onMovieSelect: (id: string, type: string) => void }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 15;
    const y = (e.clientY / window.innerHeight - 0.5) * 15;
    setMousePos({ x, y });
  };
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, setAmbientColor } = useApp();

  useEffect(() => {
    let isMounted = true;
    
    if (heroCache[type]) {
      setMovies(heroCache[type]);
    } else {
      const fetchHero = async () => {
        try {
          let results: Movie[] = [];
          if (type === 'anime') {
            const url = `https://kitsu.io/api/edge/anime?sort=-averageRating&page[limit]=5&include=categories,mappings`;
            const req = await fetch(url, { headers: {
              'Accept': 'application/vnd.api+json',
              'Content-Type': 'application/vnd.api+json'
            }});
            const data = await req.json();
            if (data.data) {
                results = data.data.map((item: any) => kitsuApi.mapKitsuToInternal(item, data.included));
            }
          } else {
            const res = await api.getTrending(type, 'day');
            if (res && res.results) {
              results = res.results.slice(0, 5).map(api.mapToInternalMovie);
            }
          }
          if (isMounted) {
            heroCache[type] = results;
            setMovies(results);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchHero();
    }
    return () => { isMounted = false; };
  }, [type]);

  useEffect(() => {
    if (movies.length <= 1) return;
    
    const currentMovie = movies[currentIndex];
    if (currentMovie && currentMovie.backdropUrl) {
      const imageUrl = currentMovie.type === 'anime' ? currentMovie.backdropUrl : currentMovie.backdropUrl;
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
  }, [movies, currentIndex, setAmbientColor, type]);

  if (!movies.length) return <div className="h-[60vh] w-full animate-pulse bg-white/5" />;

  const currentMovie = movies[currentIndex];
  const inWatchlist = currentMovie ? isInWatchlist(currentMovie.id) : false;

  if (!currentMovie) return null;

  return (
    <div className="relative h-[60vh] w-full overflow-hidden" onMouseMove={handleMouseMove}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <motion.img
            src={currentMovie.type === 'anime' ? currentMovie.backdropUrl : currentMovie.backdropUrl}
            alt={currentMovie.title}
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ 
              scale: 1.15,
              x: mousePos.x,
              y: mousePos.y
            }}
            transition={{ 
              scale: { duration: 10, ease: "linear" },
              x: { type: "spring", stiffness: 50, damping: 20 },
              y: { type: "spring", stiffness: 50, damping: 20 }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
          
          <div className="absolute inset-0 flex items-center px-4 md:px-10 max-w-[1600px] mx-auto">
            <div className="max-w-2xl mt-16 md:mt-0">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-6xl font-display font-bold text-foreground mb-4 drop-shadow-lg"
              >
                {currentMovie.title}
              </motion.h1>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-4 text-sm md:text-base text-foreground mb-6"
              >
                <span className="flex items-center text-brand font-bold">
                  ★ {currentMovie.rating?.toFixed(1) || '0.0'}
                </span>
                <span>•</span>
                <span>{currentMovie.year || ''}</span>
              </motion.div>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-sm md:text-base text-muted-foreground mb-8 line-clamp-3 md:line-clamp-4 max-w-xl"
              >
                {currentMovie.description}
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-4"
              >
                <button 
                  onClick={() => onMovieSelect(currentMovie.id, currentMovie.type)}
                  className="px-8 py-3 bg-brand text-background font-bold rounded-xl hover:bg-brand-light transition-colors flex items-center gap-2 shadow-card cursor-pointer"
                >
                  <Play size={20} className="fill-current" /> Watch Now
                </button>
                <button 
                  onClick={(e) => {
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
                        const distance = 30 + Math.random() * 20;
                        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
                        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
                        particle.style.left = `${x}px`;
                        particle.style.top = `${y}px`;
                        document.body.appendChild(particle);
                        setTimeout(() => particle.remove(), 600);
                      }
                    }
                  }}
                  className="px-8 py-3 glass hover:bg-white/15 text-foreground font-bold rounded-xl transition-colors flex items-center gap-2 border border-white/10 cursor-pointer"
                >
                  {inWatchlist ? <Check size={20} className="text-brand" /> : <Plus size={20} />} 
                  {inWatchlist ? 'Added' : 'Add to Watchlist'}
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {movies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              idx === currentIndex ? 'bg-brand w-8' : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
