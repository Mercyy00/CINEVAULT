import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api, kitsuApi } from '../api';
import { Movie } from '../types';
import { MovieCard } from './MovieCard';
import { HeroSpotlight } from './HeroSpotlight';
import { Filter, X } from 'lucide-react';

interface PageShellProps {
  title: string;
  defaultType: 'movie' | 'tv' | 'anime';
  onMovieSelect: (id: string, type: string) => void;
  isSearch?: boolean;
  searchQuery?: string;
}

export function PageShell({ title, defaultType, onMovieSelect, isSearch, searchQuery }: PageShellProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({ type: defaultType, country: 'US' });
  const [activePill, setActivePill] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const prevPill = useRef<string>('all');

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [advFilters, setAdvFilters] = useState({
    minYear: '2000',
    maxYear: '2024',
    minRating: '5',
    sortBy: 'popularity.desc'
  });
  const [appliedFilters, setAppliedFilters] = useState({
    minYear: '2000',
    maxYear: '2024',
    minRating: '5',
    sortBy: 'popularity.desc'
  });

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('?genre=')) {
      const genreName = decodeURIComponent(hash.split('?genre=')[1]);
      const pills = getPills();
      const matchingPill = pills.find(p => p.label.toLowerCase() === genreName.toLowerCase());
      if (matchingPill) {
        setActivePill(matchingPill.id);
      }
    }
  }, []);

  const getPills = () => {
    if (filters.type === 'movie') {
      return [
        { id: 'all', label: 'All' },
        { id: '28', label: 'Action' },
        { id: '35', label: 'Comedy' },
        { id: '18', label: 'Drama' },
        { id: '27', label: 'Horror' },
        { id: '878', label: 'Sci-Fi' },
        { id: '53', label: 'Thriller' },
        { id: '10749', label: 'Romance' },
        { id: '14', label: 'Fantasy' },
        { id: '9648', label: 'Mystery' },
        { id: '99', label: 'Documentary' },
      ];
    }
    if (filters.type === 'tv') {
      return [
        { id: 'all', label: 'All' },
        { id: '18', label: 'Drama' },
        { id: '35', label: 'Comedy' },
        { id: '10765', label: 'Sci-Fi & Fantasy' },
        { id: '80', label: 'Crime' },
        { id: '99', label: 'Documentary' },
        { id: '16', label: 'Animation' },
        { id: '10764', label: 'Reality' },
      ];
    }
    if (filters.type === 'anime') {
      return [
        { id: 'all', label: 'All' },
        { id: 'action', label: 'Action' },
        { id: 'romance', label: 'Romance' },
        { id: 'fantasy', label: 'Fantasy' },
        { id: 'comedy', label: 'Comedy' },
        { id: 'isekai', label: 'Isekai' },
        { id: 'sci-fi', label: 'Sci-Fi' },
        { id: 'horror', label: 'Horror' },
        { id: 'slice-of-life', label: 'Slice of Life' },
        { id: 'drama', label: 'Drama' },
        { id: 'thriller', label: 'Thriller' },
        { id: 'sports', label: 'Sports' },
      ];
    }
    return [];
  };

  // Reset page on filter changes
  useEffect(() => {
    if (activePill !== prevPill.current) {
        setMovies([]); // Trigger exit animation
        prevPill.current = activePill;
    }
    setPage(1);
    setHasMore(true);
  }, [filters, activePill, isSearch, searchQuery, appliedFilters]);

  useEffect(() => {
    let isMounted = true;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
        
    const fetchContent = async () => {
      try {
        let results: Movie[] = [];
        let fetchedHasMore = true;

        if (isSearch && searchQuery) {
          const res = await api.searchMulti(searchQuery);
          if (res && res.results) { 
            results = res.results.filter((item: any) => item.poster_path || item.backdrop_path).map(api.mapToInternalMovie);
            fetchedHasMore = false;
          }
        } else if (filters.type === 'anime') {
          let res;
          if (activePill === 'all') {
            const url = `https://kitsu.io/api/edge/anime?sort=popularityRank&page[limit]=20&page[offset]=${(page - 1) * 20}&include=categories,mappings`;
            const req = await fetch(url, { headers: { 'Accept': 'application/vnd.api+json' } });
            res = await req.json();
          } else {
            const url = `https://kitsu.io/api/edge/anime?filter[categories]=${activePill}&sort=-averageRating&page[limit]=20&page[offset]=${(page - 1) * 20}&include=categories,mappings`;
            const req = await fetch(url, { headers: { 'Accept': 'application/vnd.api+json' } });
            res = await req.json();
          }
          if (res && res.data) { 
            results = res.data.map((item: any) => kitsuApi.mapKitsuToInternal(item, res.included));
            fetchedHasMore = res.data.length === 20;
          }
        } else {
          const typeMap = filters.type;
          const params: any = { page };
          
          if (activePill !== 'all') {
            params.with_genres = activePill;
          }

          // Apply advanced filters
          if (appliedFilters.minYear !== '2000' || appliedFilters.maxYear !== '2024' || appliedFilters.minRating !== '5' || appliedFilters.sortBy !== 'popularity.desc') {
            params['primary_release_date.gte'] = `${appliedFilters.minYear}-01-01`;
            params['primary_release_date.lte'] = `${appliedFilters.maxYear}-12-31`;
            params['vote_average.gte'] = appliedFilters.minRating;
            params.sort_by = appliedFilters.sortBy;
          } else if (activePill === 'all') {
             params.sort_by = 'popularity.desc';
          }

          const res = await api.discover(typeMap, params);
          if (res && res.results) {
            results = res.results.filter((item: any) => item.poster_path || item.backdrop_path).map(api.mapToInternalMovie);
            fetchedHasMore = page < (res.total_pages || 1);
          }
        }
                
        if (isMounted) {
          if (page === 1) {
            setMovies(results);
          } else {
            setMovies(prev => {
               // Prevent duplicates
               const newMovies = results.filter(nm => !prev.find(p => p.id === nm.id));
               return [...prev, ...newMovies];
            });
          }
          setHasMore(fetchedHasMore);
        }
      } catch (err) {
        console.error(err);
        if (filters.type === 'anime') { 
          setError('Unable to load Anime data right now. Please try again later.');
        }
      } finally {
        if (isMounted) {
            setLoading(false);
            setLoadingMore(false);
        }
      }
    };
        
    fetchContent();
    return () => { isMounted = false; };
  }, [filters, activePill, isSearch, searchQuery, appliedFilters, page]);

  return (
    <div className="pb-12 min-h-screen">
      {!isSearch && <HeroSpotlight type={defaultType} onMovieSelect={onMovieSelect} />}
      
      <div className={`max-w-[1600px] mx-auto px-4 md:px-10 ${isSearch ? 'pt-24' : 'pt-8'}`}>
        <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <h1 className="text-3xl font-display font-bold text-foreground">{isSearch ? title : "Explore " + title}</h1>
        </div>
        
        {!isSearch && getPills().length > 0 && (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 mb-8" role="tablist">
            {getPills().map((pill) => (
              <button
                key={pill.id}
                role="tab"
                aria-selected={activePill === pill.id}
                onClick={() => setActivePill(pill.id)}
                className={`px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition-all ${
                  activePill === pill.id 
                    ? 'bg-brand text-background shadow-card font-bold' 
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground border border-white/10'
                }`}
              >
                {pill.label}
              </button>
            ))}
            {filters.type !== 'anime' && (
                <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className="px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition-all bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground border border-white/10 flex items-center gap-2 ml-auto cursor-pointer"
                >
                <Filter size={18} /> Filters
                </button>
            )}
          </div>
        )}

        {error ? (
          <div className="py-20 flex justify-center">
            <div className="glass border-red-500/30 p-8 rounded-2xl max-w-lg text-center backdrop-blur-xl">
              <h3 className="text-2xl font-display text-foreground mb-4">Oops!</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : (loading && movies.length === 0) || movies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6" role="tabpanel" aria-busy={loadingMore}>
              <AnimatePresence mode="popLayout">
                {loading && movies.length === 0 ? (
                  [1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                    <motion.div key={`loading-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse"></motion.div>
                  ))
                ) : (
                  movies.map((movie, idx) => (
                    <motion.div
                      key={`${activePill}-${movie.id}`}
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      viewport={{ once: true, margin: "50px" }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.4, delay: (idx % 20) * 0.05 }}
                    >
                      <MovieCard movie={movie} onClick={() => onMovieSelect(movie.id, movie.type)} />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
            
            {hasMore && !isSearch && !loading && movies.length > 0 && (
              <div className="mt-12 flex justify-center pb-12">
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={loadingMore}
                  className="px-8 py-3 glass border border-brand/30 text-brand font-bold rounded-xl hover:bg-brand/10 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-muted-foreground text-lg">
            No results found.
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm glass z-[260] border-l border-white/10 p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-display font-bold text-foreground">Advanced Filters</h2>
                <button onClick={() => setIsFilterDrawerOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-foreground cursor-pointer">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Year Range</label>
                  <div className="flex items-center gap-4">
                    <select
                      value={advFilters.minYear}
                      onChange={e => setAdvFilters(p => ({ ...p, minYear: e.target.value }))}
                      className="w-full bg-card border border-white/10 rounded-xl px-3 py-2 text-foreground outline-none focus:border-brand"
                    >
                      {Array.from({length: 45}, (_, i) => 2024 - i).map(y => (
                        <option key={`min-${y}`} value={y}>{y}</option>
                      ))}
                    </select>
                    <span className="text-muted-foreground">to</span>
                    <select
                      value={advFilters.maxYear}
                      onChange={e => setAdvFilters(p => ({ ...p, maxYear: e.target.value }))}
                      className="w-full bg-card border border-white/10 rounded-xl px-3 py-2 text-foreground outline-none focus:border-brand"
                    >
                      {Array.from({length: 45}, (_, i) => 2024 - i).map(y => (
                        <option key={`max-${y}`} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2 flex justify-between">
                    <span>Minimum Rating</span>
                    <span className="text-brand font-bold">{advFilters.minRating}+</span>
                  </label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="0.5"
                    value={advFilters.minRating}
                    onChange={e => setAdvFilters(p => ({ ...p, minRating: e.target.value }))}
                    className="w-full accent-brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-3">Sort By</label>
                  <div className="space-y-3">
                    {[
                      { val: 'popularity.desc', label: 'Popularity Descending' },
                      { val: 'vote_average.desc', label: 'Rating Descending' },
                      { val: 'primary_release_date.desc', label: 'Release Date Descending' },
                      { val: 'original_title.asc', label: 'Title A-Z' }
                    ].map(opt => (
                      <label key={opt.val} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${advFilters.sortBy === opt.val ? 'border-brand' : 'border-white/30 group-hover:border-white/60'}`}>
                          {advFilters.sortBy === opt.val && <div className="w-2.5 h-2.5 rounded-full bg-brand" />}
                        </div>
                        <span className={`transition-colors ${advFilters.sortBy === opt.val ? 'text-foreground font-bold' : 'text-muted-foreground group-hover:text-foreground'}`}>{opt.label}</span>
                        <input 
                          type="radio" 
                          name="sortBy"
                          value={opt.val}
                          checked={advFilters.sortBy === opt.val}
                          onChange={e => setAdvFilters(p => ({ ...p, sortBy: e.target.value }))}
                          className="hidden"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-white/10">
                <button 
                  onClick={() => {
                    setAppliedFilters(advFilters);
                    setIsFilterDrawerOpen(false);
                  }}
                  className="w-full py-4 bg-brand text-background font-bold rounded-xl hover:bg-brand-light transition-colors shadow-card"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
