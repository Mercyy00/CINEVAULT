import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FocusLock from 'react-focus-lock';
import { X, Search, Clock, ArrowRight, TrendingUp, Star } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { api, kitsuApi } from '../api';
import { Movie } from '../types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onMovieSelect: (id: string, type: string) => void;
}

export function SearchOverlay({ isOpen, onClose, onMovieSelect }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState<Movie[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cv_search_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const saveToHistory = (q: string) => {
    if (!q.trim()) return;
    const newHistory = [q, ...history.filter(h => h !== q)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('cv_search_history', JSON.stringify(newHistory));
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen, onClose]);

  
  useEffect(() => {
    let isMounted = true;
    if (debouncedQuery.trim().length > 1) {
      Promise.all([
        api.searchMulti(debouncedQuery).catch(() => ({ results: [] })),
        kitsuApi.search(debouncedQuery).catch(() => ({ data: [] }))
      ]).then(([tmdbData, kitsuData]) => {
        if (!isMounted) return;
        
        let allResults = [];
        if (tmdbData && tmdbData.results) {
          const filtered = tmdbData.results.filter((i: any) => i.media_type !== 'person' && (i.poster_path || i.backdrop_path));
          allResults = [...allResults, ...filtered.slice(0, 6).map(api.mapToInternalMovie)];
        }
        
        if (kitsuData && kitsuData.data && kitsuData.data.length > 0) {
          const mappedAnime = kitsuData.data.slice(0, 4).map((item: any) => kitsuApi.mapKitsuToInternal(item, kitsuData.included));
          allResults = [...allResults, ...mappedAnime];
        }
        
        setResults(allResults);
      }).catch(err => {
        console.error('Search error', err);
      });
    } else {
      setResults([]);
    }
    return () => { isMounted = false; };
  }, [debouncedQuery]);


  const handleSearchSubmit = (q: string) => {
    if (!q.trim()) return;
    saveToHistory(q.trim());
    window.location.hash = `#search/${encodeURIComponent(q.trim())}`;
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-[100] bg-cv-bg/95 backdrop-blur-xl flex flex-col"
        >
          <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 flex-1 flex flex-col">
            <div className="flex items-center gap-4 border-b border-cv-gold/30 pb-4">
              <Search className="w-8 h-8 text-cv-gold" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchSubmit(query);
                }}
                placeholder="Search movies, shows, anime..."
                className="flex-1 bg-transparent border-none outline-none text-2xl md:text-4xl font-serif text-cv-cream placeholder-cv-slate/50"
              />
              <button 
                onClick={onClose}
                className="p-2 text-cv-slate hover:text-cv-gold hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-8 scrollbar-hide">
              {query.length > 1 ? (
                results.length > 0 ? (
                  <div>
                    <h3 className="text-lg text-cv-slate mb-6 font-serif flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" /> Top Recommendations
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {results.map((movie, idx) => (
                        <motion.div
                          key={movie.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="group cursor-pointer flex flex-col"
                          onClick={() => {
                            saveToHistory(query);
                            window.location.hash = `#${movie.type}/${movie.id}`;
                            onClose();
                          }}
                        >
                          <div className="aspect-[2/3] rounded-lg overflow-hidden mb-3 relative border border-white/10 group-hover:border-cv-gold/50 transition-colors">
                            <img loading="lazy" src={movie.posterUrl || undefined} alt={movie.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="bg-cv-gold text-cv-gold-content px-4 py-2 rounded font-bold flex items-center gap-2 text-sm">
                                View <ArrowRight className="w-4 h-4" />
                              </span>
                            </div>
                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white uppercase tracking-wider">
                              {movie.type}
                            </div>
                          </div>
                          <h4 className="font-serif font-semibold text-cv-cream group-hover:text-cv-gold transition-colors line-clamp-1">{movie.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-cv-slate">{movie.year}</p>
                            <span className="text-cv-gold flex items-center gap-1 text-xs">
                              <Star className="w-3 h-3 fill-current" />
                              {movie.rating.toFixed(1)} <span className="text-cv-slate text-[10px]">/ 10</span>
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-cv-slate">
                    <p className="text-2xl font-serif mb-2">No results found for "{query}"</p>
                    <p>Try searching for a different title.</p>
                  </div>
                )
              ) : (
                <div className="space-y-10">
                  {history.length > 0 && (
                    <div>
                      <h3 className="text-lg text-cv-slate mb-4 font-serif flex items-center gap-2">
                        <Clock className="w-5 h-5" /> Recent Searches
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {history.map(tag => (
                          <button
                            key={tag}
                            onClick={() => {
                              setQuery(tag);
                              handleSearchSubmit(tag);
                            }}
                            className="px-4 py-2 rounded-full border border-cv-slate/30 text-cv-cream hover:border-cv-gold hover:text-cv-gold transition-colors bg-white/5"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg text-cv-slate mb-4 font-serif flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" /> Popular Searches
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {['Marvel', 'Stranger Things', 'Anime', 'Action', 'Avatar'].map(tag => (
                        <button
                          key={tag}
                          onClick={() => {
                            setQuery(tag);
                            handleSearchSubmit(tag);
                          }}
                          className="px-4 py-2 rounded-full border border-cv-slate/30 text-cv-cream hover:border-cv-gold hover:text-cv-gold transition-colors bg-white/5"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
