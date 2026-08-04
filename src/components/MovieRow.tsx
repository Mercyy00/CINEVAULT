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
  fetchFn: (page: number) => Promise<{ results: any[] }>;
  onMovieSelect: (id: string, type: string) => void;
}

export function MovieRow({ title, fetchFn, onMovieSelect }: MovieRowProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);

  // Touch drag variables
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

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
    if (rowRef.current) {
      setShowLeftArrow(rowRef.current.scrollLeft > 0);
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

  if (loading) {
    return (
      <div className="mb-10 px-4 md:px-10">
        <h2 className="text-xl md:text-2xl font-bold text-cv-cream mb-4 font-serif">{title}</h2>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[160px] md:w-[220px] lg:w-[260px] aspect-[2/3] rounded-md skeleton-shimmer border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-10 px-4 md:px-10">
        <h2 className="text-xl md:text-2xl font-bold text-cv-cream mb-4 font-serif">{title}</h2>
        <div className="w-full py-12 glass-panel border border-red-500/20 rounded-xl flex flex-col items-center justify-center text-cv-slate backdrop-blur gap-4">
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
    <div className="mb-10 relative group">
      <h2 className="text-xl md:text-2xl font-bold text-cv-cream mb-4 font-serif px-4 md:px-10">{title}</h2>
      
      <div className="relative">
        <AnimatePresence>
          {showLeftArrow && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll('left')}
              className="absolute left-0 top-0 bottom-0 w-12 z-40 bg-gradient-to-r from-[var(--theme-bg)] to-transparent flex items-center justify-center text-cv-cream opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-8 h-8 drop-shadow-lg" />
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
          className="flex overflow-x-auto px-4 md:px-10 pb-12 pt-4 scrollbar-hide snap-x select-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie) => (
            <div key={movie.id} className="snap-start flex-shrink-0 w-[150px] md:w-[200px] lg:w-[240px] mr-5 md:mr-6">
              <MovieCard movie={movie} onClick={() => window.location.hash = `#${movie.type}/${movie.id}`} />
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 w-12 z-40 bg-gradient-to-l from-[var(--theme-bg)] to-transparent flex items-center justify-center text-cv-cream opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-8 h-8 drop-shadow-lg" />
        </button>
      </div>
    </div>
  );
}
