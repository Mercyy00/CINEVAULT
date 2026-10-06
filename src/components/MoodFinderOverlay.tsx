import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, RefreshCcw } from 'lucide-react';
import { api } from '../api';
import { Movie, formatRating } from '../types';
import { goToDetail } from '../lib/navigation';

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
          className="fixed inset-0 z-[100] bg-[#0b0b0d]/96 backdrop-blur-2xl overflow-y-auto"
        >
          <div className="min-h-screen flex flex-col p-6 md:p-12 relative">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-foreground/50 hover:text-foreground hover:bg-white/10 rounded-full transition-colors z-10 cursor-pointer border border-white/10"
              aria-label="Close Mood Finder"
            >
              <X className="w-6 h-6" />
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
                    <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-foreground text-center mb-6 sm:mb-14 tracking-tight">
                      What's your vibe tonight?
                    </h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-5">
                      {MOODS.map((mood, idx) => (
                        <motion.button
                          key={mood.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => handleSelectMood(mood)}
                          className="aspect-video md:aspect-square rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center gap-2 sm:gap-4 transition-all duration-300 border border-white/[0.08] hover:border-white/25 bg-[#141417] hover:bg-[#18191e] group hover:scale-[1.03] shadow-xl cursor-pointer"
                        >
                          <span className="text-sm sm:text-lg md:text-xl font-bold font-display text-foreground group-hover:text-white transition-colors">{mood.label}</span>
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
                      <h3 className="text-xs font-mono uppercase tracking-widest text-[#929093] mb-2">Curated for your mood</h3>
                      <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">{selectedMood.label}</h2>
                    </div>

                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-2 border-white/20 border-t-[#f3f0ea] rounded-full animate-spin mb-6" />
                        <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider animate-pulse">Finding perfect matches...</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-5 mb-12">
                          {results.map((movie, idx) => (
                            <motion.div
                              key={movie.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              onClick={() => {
                                goToDetail(movie.id, movie.type);
                                onClose();
                              }}
                              className="group cursor-pointer"
                            >
                              <div className="aspect-[2/3] rounded-2xl overflow-hidden mb-3 relative bg-[#141417] border border-white/[0.08]">
                                <img loading="lazy" src={movie.posterUrl || undefined} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="w-11 h-11 rounded-full bg-[#f3f0ea] flex items-center justify-center shadow-lg">
                                    <Play className="w-5 h-5 text-[#0b0b0d] fill-current ml-0.5" />
                                  </div>
                                </div>
                              </div>
                              <h4 className="font-bold text-foreground truncate font-display text-sm group-hover:text-white transition-colors">{movie.title}</h4>
                              <div className="flex items-center gap-2 text-xs font-mono text-[#929093] truncate mt-1">
                                <span>{movie.year}</span>
                                <span>•</span>
                                <span className="text-[#e5a93b] flex items-center gap-1 font-semibold">
                                  ★ {formatRating(movie.rating)}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                        
                        <div className="flex justify-center">
                          <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-7 py-3 bg-[#f3f0ea] text-[#0b0b0d] rounded-full font-mono text-xs uppercase tracking-wider font-bold hover:bg-white transition-all shadow-md cursor-pointer"
                          >
                            <RefreshCcw className="w-4 h-4" /> Try Another Mood
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
