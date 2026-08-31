import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import FocusLock from 'react-focus-lock';
import { ArrowRight, Clock, Search, Star, Trash2, TrendingUp, X } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { api, kitsuApi } from '../api';
import { formatRating, type Movie } from '../types';
import { PosterImage } from './PosterImage';
import { readJSON, writeJSON } from '../lib/storage';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onMovieSelect: (id: string, type: string) => void;
}

const HISTORY_KEY = 'cv:searchHistory';
const MAX_HISTORY = 8;
const MIN_QUERY_LENGTH = 2;
const POPULAR_SEARCHES = ['Marvel', 'Stranger Things', 'Anime', 'Action', 'Avatar'];

export function SearchOverlay({ isOpen, onClose, onMovieSelect }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);
  const [history, setHistory] = useState<string[]>(() =>
    readJSON<string[]>(HISTORY_KEY, [], (value) => Array.isArray(value))
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const saveToHistory = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setHistory((previous) => {
      const next = [clean, ...previous.filter((entry) => entry !== clean)].slice(0, MAX_HISTORY);
      writeJSON(HISTORY_KEY, next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    writeJSON(HISTORY_KEY, []);
  }, []);

  const removeHistoryItem = useCallback((termToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory((previous) => {
      const next = previous.filter((entry) => entry !== termToRemove);
      writeJSON(HISTORY_KEY, next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (isOpen) return;
    setQuery('');
    setResults([]);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const term = debouncedQuery.trim();
    if (term.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setSearching(false);
      return;
    }

    let active = true;
    setSearching(true);

    Promise.all([
      api.searchMulti(term).catch(() => ({ results: [], total_pages: 0 })),
      kitsuApi.search(term).catch(() => ({ data: [], included: [] })),
    ])
      .then(([tmdb, kitsu]) => {
        if (!active) return;
        const fromTmdb: Movie[] = tmdb.results
          .filter((item) => item.media_type !== 'person' && (item.poster_path || item.backdrop_path))
          .slice(0, 6)
          .map(api.mapToInternalMovie);
        const fromKitsu: Movie[] = (kitsu.data ?? [])
          .slice(0, 4)
          .map((item) => kitsuApi.mapKitsuToInternal(item, kitsu.included ?? []));
        setResults([...fromTmdb, ...fromKitsu]);
      })
      .catch((cause) => {
        console.error('Search failed:', cause);
        if (active) setResults([]);
      })
      .finally(() => {
        if (active) setSearching(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  const submit = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    saveToHistory(clean);
    window.location.hash = `#search/${encodeURIComponent(clean)}`;
    onClose();
  };

  const openMovie = (movie: Movie) => {
    saveToHistory(query);
    // Routes through the parent so anime lands on #detail/ani/<id>. This used
    // to hardcode `#${movie.type}/${movie.id}`, i.e. `#anime/123`, which is not
    // a route -- every anime search result was a dead end.
    onMovieSelect(movie.id, movie.type);
    onClose();
  };

  const statusMessage = useMemo(() => {
    if (query.trim().length < MIN_QUERY_LENGTH) return '';
    if (searching) return 'Searching…';
    return results.length === 0
      ? `No results for ${query}`
      : `${results.length} result${results.length === 1 ? '' : 's'} for ${query}`;
  }, [query, searching, results.length]);

  return (
    <AnimatePresence>
      {isOpen && (
        <FocusLock returnFocus autoFocus={false}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col"
          >
            <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-8 flex-1 flex flex-col">
              <div className="flex items-center gap-2 sm:gap-4 border-b border-brand/30 pb-3 sm:pb-4">
                <Search className="w-5 h-5 sm:w-8 sm:h-8 text-brand shrink-0" aria-hidden="true" />
                <label className="sr-only" htmlFor="search-input">
                  Search movies, shows and anime
                </label>
                <input
                  id="search-input"
                  ref={inputRef}
                  type="search"
                  autoFocus
                  autoComplete="off"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') submit(query);
                  }}
                  placeholder="Search movies, shows, anime…"
                  className="flex-1 bg-transparent border-none outline-none text-lg sm:text-2xl md:text-4xl font-display text-foreground placeholder-muted-foreground/50 min-w-0"
                />
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close search"
                  className="p-1.5 sm:p-2 text-muted-foreground hover:text-brand hover:bg-white/5 rounded-full transition-colors shrink-0"
                >
                  <X className="w-6 h-6 sm:w-8 sm:h-8" aria-hidden="true" />
                </button>
              </div>

              {/* Announced to assistive tech; the result count was previously
                  only conveyed visually. */}
              <p aria-live="polite" className="sr-only">
                {statusMessage}
              </p>

              <div className="flex-1 overflow-y-auto py-8 scrollbar-hide">
                {query.trim().length >= MIN_QUERY_LENGTH ? (
                  searching && results.length === 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {Array.from({ length: 8 }, (_, i) => (
                        <div
                          key={`skeleton-${i}`}
                          className="aspect-[2/3] rounded-xl skeleton-shimmer bg-[#14151f] border border-white/5 relative overflow-hidden"
                        >
                          <div className="absolute top-2 left-2 w-12 h-4 rounded bg-white/10" />
                          <div className="absolute bottom-3 inset-x-3 space-y-1">
                            <div className="w-3/4 h-3 rounded bg-white/10" />
                            <div className="w-1/2 h-2 rounded bg-white/5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : results.length > 0 ? (
                    <div>
                      <h2 className="text-lg text-muted-foreground mb-6 font-display flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" aria-hidden="true" /> Top matches
                      </h2>
                      <ul className="grid grid-cols-2 md:grid-cols-4 gap-6 list-none m-0 p-0">
                        {results.map((movie, index) => (
                          <motion.li
                            // TMDB and Kitsu ids can collide, so the type is
                            // part of the key.
                            key={`${movie.type}-${movie.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.04, 0.24) }}
                          >
                            <button
                              type="button"
                              onClick={() => openMovie(movie)}
                              className="group w-full text-left flex flex-col cursor-pointer"
                            >
                              <div className="aspect-[2/3] rounded-xl overflow-hidden mb-3 relative border border-white/10 group-hover:border-brand/50 transition-colors">
                                <PosterImage
                                  src={movie.posterUrl}
                                  title={movie.title}
                                  decorative
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="bg-brand text-background px-4 py-2 rounded font-bold flex items-center gap-2 text-sm">
                                    View <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                  </span>
                                </span>
                                <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-bold text-white uppercase tracking-wider">
                                  {movie.type}
                                </span>
                              </div>
                              <span className="font-display font-semibold text-foreground group-hover:text-brand transition-colors line-clamp-1">
                                {movie.title}
                              </span>
                              <span className="flex items-center gap-2 mt-1">
                                {movie.year > 0 && (
                                  <span className="text-xs text-muted-foreground">{movie.year}</span>
                                )}
                                {/* Guarded: `movie.rating.toFixed(1)` threw for
                                    every unrated title. */}
                                {movie.rating !== null && (
                                  <span className="text-brand flex items-center gap-1 text-xs">
                                    <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                                    {formatRating(movie.rating)}
                                    <span className="text-muted-foreground text-[10px]">/ 10</span>
                                  </span>
                                )}
                              </span>
                            </button>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-center py-20 text-muted-foreground">
                      <p className="text-2xl font-display mb-2">No results for “{query}”</p>
                      <p>Try a different title or spelling.</p>
                    </div>
                  )
                ) : (
                  <div className="space-y-10">
                    {history.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg text-muted-foreground font-display flex items-center gap-2">
                            <Clock className="w-5 h-5" aria-hidden="true" /> Recent searches
                          </h2>
                          <button
                            type="button"
                            onClick={clearHistory}
                            className="text-xs text-muted-foreground hover:text-red-400 flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg hover:bg-white/5 cursor-pointer font-medium"
                            aria-label="Clear all search history"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Clear all</span>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {history.map((term) => (
                            <div
                              key={term}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/10 text-foreground hover:border-brand/50 bg-white/5 transition-all text-sm group"
                            >
                              <button
                                type="button"
                                onClick={() => submit(term)}
                                className="hover:text-brand transition-colors cursor-pointer"
                              >
                                {term}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => removeHistoryItem(term, e)}
                                className="text-muted-foreground/50 hover:text-red-400 transition-colors p-0.5 rounded-full hover:bg-white/10 cursor-pointer"
                                aria-label={`Remove ${term} from history`}
                                title={`Remove "${term}"`}
                              >
                                <X className="w-3 h-3" aria-hidden="true" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h2 className="text-lg text-muted-foreground mb-4 font-display flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" aria-hidden="true" /> Popular searches
                      </h2>
                      <div className="flex flex-wrap gap-3">
                        {POPULAR_SEARCHES.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => submit(term)}
                            className="px-4 py-2 rounded-full border border-white/10 text-foreground hover:border-brand hover:text-brand transition-colors bg-white/5"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </FocusLock>
      )}
    </AnimatePresence>
  );
}
