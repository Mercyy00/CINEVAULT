import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { Movie } from '../types';
import { api } from '../api';
import { cn } from '../lib/utils';

interface MovieRowProps {
  key?: React.Key;
  title: string;
  index?: number;
  fetchFn: (page: number) => Promise<{ results: any[] }>;
  onMovieSelect: (id: string, type: string) => void;
}

export function MovieRow({ title, index, fetchFn, onMovieSelect }: MovieRowProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Touch drag variables
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const updateArrows = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftArrow(scrollLeft > 15);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 15);
    }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);
    setPage(1);
    fetchFn(1).then(data => {
      if (isMounted && data && data.results) {
        setMovies(data.results.map((item: any) => item.type === 'anime' ? item : api.mapToInternalMovie(item)));
        setHasMore(data.results.length >= 20);
        setLoading(false);
        setTimeout(updateArrows, 150);
      }
    }).catch(err => {
      console.error('Error fetching row', title, err);
      if (isMounted) {
        setLoading(false);
        setError(true);
      }
    });
    return () => { isMounted = false; };
  }, [fetchFn]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await fetchFn(nextPage);
      if (data && data.results) {
        const newMovies = data.results.map((item: any) => item.type === 'anime' ? item : api.mapToInternalMovie(item));
        if (newMovies.length > 0) {
          setMovies(prev => [...prev, ...newMovies]);
          setPage(nextPage);
          setHasMore(newMovies.length >= 20);
          setTimeout(updateArrows, 150);
        } else {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error('Error loading more', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = () => {
    updateArrows();
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      if (scrollWidth - (scrollLeft + clientWidth) < 400 && !loadingMore && hasMore) {
        loadMore();
      }
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { clientWidth, currentScroll } = { clientWidth: rowRef.current.clientWidth, currentScroll: rowRef.current.scrollLeft };
      const scrollTo = direction === 'left' ? currentScroll - clientWidth * 0.75 : currentScroll + clientWidth * 0.75;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    isDown.current = true;
    if (rowRef.current) {
      startX.current = 'touches' in e ? e.touches[0].pageX - rowRef.current.offsetLeft : e.pageX - rowRef.current.offsetLeft;
      scrollLeft.current = rowRef.current.scrollLeft;
    }
  };

  const handleMouseLeave = () => {
    isDown.current = false;
  };

  const handleMouseUp = () => {
    isDown.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDown.current || !rowRef.current) return;
    const x = 'touches' in e ? e.touches[0].pageX - rowRef.current.offsetLeft : e.pageX - rowRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; // scroll-fast
    rowRef.current.scrollLeft = scrollLeft.current - walk;
  };

  // Format numbered prefix like [01], [02], etc.
  const numberedPrefix = index != null ? `[${String(index + 1).padStart(2, '0')}]` : null;

  if (loading) {
    return (
      <div className="mb-10 w-full">
        <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground mb-4 px-2 sm:px-4 lg:px-6 flex items-center gap-2">
          {numberedPrefix && <span className="font-mono text-xs sm:text-sm tracking-widest text-muted-foreground/80">{numberedPrefix}</span>}
          {title}
        </h2>
        <div className="flex gap-3.5 sm:gap-4.5 overflow-hidden px-2 sm:px-4 lg:px-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[160px] sm:w-[190px] md:w-[220px] lg:w-[250px] xl:w-[270px] aspect-[2/3] rounded-xl skeleton-shimmer border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-10 w-full px-2 sm:px-4 lg:px-6">
        <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground mb-4 flex items-center gap-2">
          {numberedPrefix && <span className="font-mono text-xs sm:text-sm tracking-widest text-muted-foreground/80">{numberedPrefix}</span>}
          {title}
        </h2>
        <div className="w-full py-12 glass border border-red-500/20 rounded-xl flex flex-col items-center justify-center text-muted-foreground backdrop-blur gap-4">
          <div className="text-4xl">⚠️</div>
          <p className="text-lg">Failed to load {title}</p>
          <button 
            onClick={() => {
              setLoading(true);
              setError(false);
              fetchFn(1).then(data => {
                if (data && data.results) {
                  setMovies(data.results.map((item: any) => item.type === 'anime' ? item : api.mapToInternalMovie(item)));
                  setHasMore(data.results.length >= 20);
                  setLoading(false);
                }
              }).catch(() => {
                setLoading(false);
                setError(true);
              });
            }}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (movies.length === 0) return null;

  return (
    <div className="mb-10 md:mb-12 relative group/row w-full">
      <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground mb-4 px-2 sm:px-4 lg:px-6 flex items-center gap-2">
        {numberedPrefix && <span className="font-mono text-xs sm:text-sm tracking-widest text-muted-foreground/80">{numberedPrefix}</span>}
        {title}
      </h2>
      
      <div className="relative w-full">
        {/* Left Scroll Arrow */}
        <AnimatePresence>
          {showLeftArrow && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => {
                e.stopPropagation();
                scroll('left');
              }}
              aria-label="Scroll left"
              className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 z-[70] w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 dark:bg-black/85 backdrop-blur-xl border border-black/10 dark:border-white/15 flex items-center justify-center text-foreground hover:bg-brand hover:text-brand-foreground hover:border-brand shadow-[0_4px_16px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_0_22px_var(--theme-accent-glow,rgba(232,133,42,0.4))] hover:scale-110 active:scale-95 transition-all cursor-pointer opacity-95 sm:opacity-0 sm:group-hover/row:opacity-100"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>
          )}
        </AnimatePresence>

        <div 
          ref={rowRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          onTouchMove={handleMouseMove}
          className="flex gap-3.5 sm:gap-4.5 overflow-x-auto scrollbar-none px-2 sm:px-4 lg:px-6 pb-4 pt-2 snap-x select-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie) => (
            <div key={movie.id} className="snap-start flex-shrink-0 w-[160px] sm:w-[190px] md:w-[220px] lg:w-[250px] xl:w-[270px] 2xl:w-[290px]">
              <MovieCard movie={movie} onClick={() => window.location.hash = `#${movie.type}/${movie.id}`} />
            </div>
          ))}
        </div>

        {/* Right Scroll Arrow */}
        <AnimatePresence>
          {showRightArrow && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => {
                e.stopPropagation();
                scroll('right');
              }}
              aria-label="Scroll right"
              className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 z-[70] w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 dark:bg-black/85 backdrop-blur-xl border border-black/10 dark:border-white/15 flex items-center justify-center text-foreground hover:bg-brand hover:text-brand-foreground hover:border-brand shadow-[0_4px_16px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:shadow-[0_0_22px_var(--theme-accent-glow,rgba(232,133,42,0.4))] hover:scale-110 active:scale-95 transition-all cursor-pointer opacity-95 sm:opacity-0 sm:group-hover/row:opacity-100"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
