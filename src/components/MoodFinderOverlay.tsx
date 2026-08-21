import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FocusLock from 'react-focus-lock';
import { X, Play, RefreshCcw, Star } from 'lucide-react';
import { api } from '../api';
import { Movie } from '../types';
import { cn } from '../lib/utils';

interface MoodFinderOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOODS = [
  { id: 'chill', label: 'Chill & Cozy', genres: '35,10749', bg: 'bg-blue-500/20' }, // Comedy, Romance
  { id: 'edge', label: 'Edge of Seat', genres: '53,27', bg: 'bg-red-500/20' }, // Thriller, Horror
  { id: 'mind', label: 'Mind-Bending', genres: '878,9648', bg: 'bg-purple-500/20' }, // Sci-Fi, Mystery
  { id: 'laugh', label: 'Laugh Out Loud', genres: '35', bg: 'bg-yellow-500/20' }, // Comedy
  { id: 'romance', label: 'Romantic Escape', genres: '10749', bg: 'bg-pink-500/20' }, // Romance
  { id: 'dark', label: 'Dark & Gritty', genres: '80,18', bg: 'bg-gray-500/20' }, // Crime, Drama
  { id: 'epic', label: 'Epic Adventure', genres: '12,14', bg: 'bg-green-500/20' }, // Adventure, Fantasy
  { id: 'nostalgia', label: 'Nostalgic Feels', genres: '10751,16', bg: 'bg-orange-500/20' }, // Family, Animation
];

export function MoodFinderOverlay({ isOpen, onClose }: MoodFinderOverlayProps) {
  const [selectedMood, setSelectedMood] = useState<any>(null);
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSelectedMood(null);
        setResults([]);
      }, 300);
    } else {
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  const handleSelectMood = async (mood: any) => {
    setSelectedMood(mood);
    setLoading(true);
    try {
      const type = Math.random() > 0.5 ? 'movie' : 'tv';
      const data = await api.discover(type, {
        with_genres: mood.genres,
        'vote_average.gte': 7.0,
        sort_by: 'popularity.desc',
      });
      if (data.results) {
        const filtered = data.results.filter((i: any) => i.poster_path || i.backdrop_path);
        setResults(filtered.slice(0, 10).map((i: any) => api.mapToInternalMovie({...i, media_type: type})));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedMood(null);
    setResults([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-2xl overflow-y-auto"
        >
          <div className="min-h-screen flex flex-col p-6 md:p-12 relative">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-foreground/50 hover:text-foreground hover:bg-white/10 rounded-full transition-colors z-10"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="flex-1 flex flex-col items-center justify-center max-w-6xl mx-auto w-full pt-12">
              <AnimatePresence mode="wait">
                {!selectedMood ? (
                  <motion.div
                    key="mood-selection"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full"
                  >
                    <h2 className="text-2xl sm:text-4xl md:text-6xl font-display font-bold text-foreground text-center mb-6 sm:mb-16">
                      What's your vibe tonight?
                    </h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                      {MOODS.map((mood, idx) => (
                        <motion.button
                          key={mood.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => handleSelectMood(mood)}
                          className={cn(
                            "aspect-video md:aspect-square rounded-2xl p-3 sm:p-6 flex flex-col items-center justify-center text-center gap-2 sm:gap-4 transition-all duration-300 border border-white/5 group hover:scale-105 hover:shadow-2xl",
                            mood.bg,
                            "hover:border-white/20"
                          )}
                        >
                          <span className="text-sm sm:text-xl md:text-2xl font-bold text-foreground group-hover:text-brand transition-colors">{mood.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="mood-results"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full"
                  >
                    <div className="text-center mb-12">
                      <h3 className="text-brand uppercase tracking-widest text-sm font-bold mb-2">Curated for your mood</h3>
                      <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground">{selectedMood.label}</h2>
                    </div>

                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 border-4 border-brand/30 border-t-brand rounded-full animate-spin mb-6" />
                        <p className="text-muted-foreground animate-pulse">Finding perfect matches...</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-12">
                          {results.map((movie, idx) => (
                            <motion.div
                              key={movie.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              onClick={() => {
                                window.location.hash = `#${movie.type}/${movie.id}`;
                                onClose();
                              }}
                              className="group cursor-pointer"
                            >
                              <div className="aspect-[2/3] rounded-xl overflow-hidden mb-3 relative">
                                <img loading="lazy" src={movie.posterUrl || undefined} alt={movie.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center text-background">
                                    <Play className="w-6 h-6 ml-1" />
                                  </div>
                                </div>
                              </div>
                              <h4 className="font-bold text-foreground truncate">{movie.title}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                                <span>{movie.year} • {movie.type === 'tv' ? 'TV Show' : 'Movie'}</span>
                                <span className="text-brand flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-current" />
                                  {movie.rating.toFixed(1)} <span className="text-[10px]">/ 10</span>
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        
                        <div className="flex justify-center">
                          <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 text-foreground rounded-full font-bold transition-all hover:scale-105"
                          >
                            <RefreshCcw className="w-5 h-5" /> Try Another Mood
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
