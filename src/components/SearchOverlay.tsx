import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import FocusLock from 'react-focus-lock';
import { ArrowRight, Clock, Search, Sparkles, Star, Trash2, TrendingUp, X } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { api, anilistApi, POSTER_SIZES } from '../api';
import { formatRating, type Movie } from '../types';
import { PosterImage } from './PosterImage';
import { readJSON, writeJSON } from '../lib/storage';
import { navigate } from '../lib/navigation';
import { cn } from '../lib/utils';

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
  const [activeTab, setActiveTab] = useState<'all' | 'anime' | 'movie' | 'tv'>('all');
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [trendingTitles, setTrendingTitles] = useState<Movie[]>([]);
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
    setActiveTab('all');
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
    setSelectedIndex(-1);
  }, [debouncedQuery, activeTab]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    api
      .getTrending('all', 'day', 1)
      .then((res: any) => {
        if (!active) return;
        const usable = (res.results ?? [])
          .filter((item: any) => item.media_type !== 'person' && (item.poster_path || item.backdrop_path))
          .slice(0, 6)
          .map(api.mapToInternalMovie);
        setTrendingTitles(usable);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    const term = debouncedQuery.trim();
    if (term.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setSearching(false);
      return;
    }

    let active = true;
    setSearching(true);
    setActiveTab('all');

    let tmdbResults: Movie[] = [];
    let anilistResults: Movie[] = [];

    const rankAndDedup = (items: Movie[], queryTerm: string): Movie[] => {
      const cleanTerm = queryTerm.toLowerCase();
      const sorted = [...items].sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        const aExact = aTitle === cleanTerm;
        const bExact = bTitle === cleanTerm;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        const aStarts = aTitle.startsWith(cleanTerm);
        const bStarts = bTitle.startsWith(cleanTerm);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return 0;
      });

      const seen = new Set<string>();
      return sorted.filter((item) => {
        const key = `${item.type}-${item.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    let tmdbDone = false;
    let anilistDone = false;

    const finishIfDone = () => {
      if (tmdbDone && anilistDone && active) {
        setSearching(false);
      }
    };

    // 1. Fetch TMDB immediately — renders in ~300ms so tiles appear without delay
    api
      .searchMulti(term, 1)
      .then((tmdb) => {
        if (!active) return;
        tmdbDone = true;
        tmdbResults = (tmdb.results ?? [])
          .filter((item) => item.media_type !== 'person' && (item.poster_path || item.backdrop_path))
          .map(api.mapToInternalMovie);
        setResults(rankAndDedup([...anilistResults, ...tmdbResults], term));
        setSearching(false);
      })
      .catch((cause) => {
        console.error('TMDB search failed:', cause);
        tmdbDone = true;
        finishIfDone();
      });

    // 2. Concurrently fetch AniList anime without blocking TMDB results
    anilistApi
      .search(term, 12)
      .then((res) => {
        if (!active) return;
        anilistDone = true;
        anilistResults = res.results ?? [];
        if (anilistResults.length > 0) {
          setResults(rankAndDedup([...anilistResults, ...tmdbResults], term));
        }
        setSearching(false);
      })
      .catch((cause) => {
        console.warn('AniList search failed/skipped:', cause);
        anilistDone = true;
        finishIfDone();
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  const submit = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    saveToHistory(clean);
    navigate(`/search/${encodeURIComponent(clean)}`);
    onClose();
  };

  const openMovie = (movie: Movie) => {
    saveToHistory(query);
    // Routes through the parent so anime lands on #detail/ani/<id>. This used
    onMovieSelect(movie.id, movie.type);
    onClose();
  };

  const animeCount = useMemo(() => results.filter((m) => m.type === 'anime').length, [results]);
  const movieCount = useMemo(() => results.filter((m) => m.type === 'movie').length, [results]);
  const tvCount = useMemo(() => results.filter((m) => m.type === 'tv').length, [results]);

  const displayedResults = useMemo(() => {
    if (activeTab === 'anime') return results.filter((m) => m.type === 'anime');
    if (activeTab === 'movie') return results.filter((m) => m.type === 'movie');
    if (activeTab === 'tv') return results.filter((m) => m.type === 'tv');
    return results;
  }, [results, activeTab]);

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
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      setSelectedIndex((prev) => Math.min(prev + 1, displayedResults.length - 1));
                    } else if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      setSelectedIndex((prev) => Math.max(prev - 1, -1));
                    } else if (event.key === 'Enter') {
                      if (selectedIndex >= 0 && displayedResults[selectedIndex]) {
                        openMovie(displayedResults[selectedIndex]);
                      } else {
                        submit(query);
                      }
                    }
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                        <h2 className="text-lg text-muted-foreground font-display flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-brand" aria-hidden="true" /> Top matches
                        </h2>

                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2" role="tablist">
                          <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === 'all'}
                            onClick={() => setActiveTab('all')}
                            className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                              activeTab === 'all'
                                ? 'bg-brand text-background border-brand shadow-card'
                                : 'bg-white/5 text-muted-foreground border-white/10 hover:text-foreground'
                            }`}
                          >
                            All ({results.length})
                          </button>
                          {animeCount > 0 && (
                            <button
                              type="button"
                              role="tab"
                              aria-selected={activeTab === 'anime'}
                              onClick={() => setActiveTab('anime')}
                              className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
                                activeTab === 'anime'
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-500 shadow-card'
                                  : 'bg-purple-950/30 text-purple-300 border-purple-500/30 hover:bg-purple-900/40 hover:text-white'
                              }`}
                            >
                              <Sparkles className="w-3 h-3 text-purple-400" />
                              Anime ({animeCount})
                            </button>
                          )}
                          {movieCount > 0 && (
                            <button
                              type="button"
                              role="tab"
                              aria-selected={activeTab === 'movie'}
                              onClick={() => setActiveTab('movie')}
                              className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                                activeTab === 'movie'
                                  ? 'bg-amber-600 text-white border-amber-500 shadow-card'
                                  : 'bg-white/5 text-muted-foreground border-white/10 hover:text-foreground'
                              }`}
                            >
                              Movies ({movieCount})
                            </button>
                          )}
                          {tvCount > 0 && (
                            <button
                              type="button"
                              role="tab"
                              aria-selected={activeTab === 'tv'}
                              onClick={() => setActiveTab('tv')}
                              className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                                activeTab === 'tv'
                                  ? 'bg-blue-600 text-white border-blue-500 shadow-card'
                                  : 'bg-white/5 text-muted-foreground border-white/10 hover:text-foreground'
                              }`}
                            >
                              TV Shows ({tvCount})
                            </button>
                          )}
                        </div>
                      </div>

                      {displayedResults.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                          <p className="text-lg font-display">No {activeTab} matches for “{query}”</p>
                          <button
                            type="button"
                            onClick={() => setActiveTab('all')}
                            className="mt-3 text-sm text-brand hover:underline cursor-pointer"
                          >
                            View all {results.length} matches
                          </button>
                        </div>
                      ) : (
                        <ul className="grid grid-cols-2 md:grid-cols-4 gap-6 list-none m-0 p-0">
                          {displayedResults.map((movie, index) => (
                            <motion.li
                              key={`${movie.type}-${movie.id}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: Math.min(index * 0.04, 0.24) }}
                            >
                              <button
                                type="button"
                                onClick={() => openMovie(movie)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={cn(
                                  'group w-full text-left flex flex-col cursor-pointer p-1 rounded-xl transition-all',
                                  selectedIndex === index && 'ring-2 ring-brand bg-white/5'
                                )}
                              >
                                <div className="aspect-[2/3] rounded-xl overflow-hidden mb-3 relative border border-white/10 group-hover:border-brand/50 transition-colors">
                                  <PosterImage
                                    src={movie.posterUrl}
                                    srcSet={movie.posterSrcSet}
                                    thumbSrc={movie.posterThumbUrl}
                                    sizes={POSTER_SIZES}
                                    title={movie.title}
                                    decorative
                                    className="w-full h-full object-cover"
                                  />
                                  <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="bg-brand text-background px-4 py-2 rounded font-bold flex items-center gap-2 text-sm">
                                      View <ArrowRight className="w-4 h-4" aria-hidden="true" />
                                    </span>
                                  </span>
                                  {movie.type === 'anime' ? (
                                    <span className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-950/60 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                      <Sparkles className="w-2.5 h-2.5" /> ANIME
                                    </span>
                                  ) : movie.type === 'tv' ? (
                                    <span className="absolute top-2 left-2 bg-blue-600/90 backdrop-blur-md text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                                      TV SHOW
                                    </span>
                                  ) : (
                                    <span className="absolute top-2 left-2 bg-amber-500/90 backdrop-blur-md text-black px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                                      MOVIE
                                    </span>
                                  )}
                                </div>
                                <span className="font-display font-semibold text-foreground group-hover:text-brand transition-colors line-clamp-1">
                                  {movie.title}
                                </span>
                                <span className="flex items-center gap-2 mt-1">
                                  {movie.year > 0 && (
                                    <span className="text-xs text-muted-foreground">{movie.year}</span>
                                  )}
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
                      )}

                      <div className="mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground text-center sm:text-left">
                          Found <span className="text-foreground font-semibold">{results.length} matches</span> across anime series, movies, and TV shows.
                        </p>
                        <button
                          type="button"
                          onClick={() => submit(query)}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-brand text-background hover:bg-brand-light font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-card"
                        >
                          <span>Explore all titles on search page</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
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
                            className="px-4 py-2 rounded-full border border-white/10 text-foreground hover:border-brand hover:text-brand transition-colors bg-white/5 cursor-pointer"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>

                    {trendingTitles.length > 0 && (
                      <div>
                        <h2 className="text-lg text-muted-foreground mb-4 font-display flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-brand" aria-hidden="true" /> Trending right now
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
                          {trendingTitles.map((item) => (
                            <button
                              key={`trending-${item.type}-${item.id}`}
                              type="button"
                              onClick={() => openMovie(item)}
                              className="group flex flex-col text-left cursor-pointer"
                            >
                              <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 border border-white/10 group-hover:border-brand/50 transition-colors">
                                <PosterImage
                                  src={item.posterUrl}
                                  srcSet={item.posterSrcSet}
                                  thumbSrc={item.posterThumbUrl}
                                  sizes={POSTER_SIZES}
                                  title={item.title}
                                  decorative
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="text-xs font-semibold text-foreground group-hover:text-brand truncate">
                                {item.title}
                              </span>
                              {item.rating && (
                                <span className="text-[11px] text-brand flex items-center gap-1 mt-0.5">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  {formatRating(item.rating)}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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
