import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard } from './MovieCard';
import type { Movie } from '../types';
import { api } from '../api';
import { useApp } from '../store';

interface RowPage {
  results: unknown[];
  total_pages?: number;
}

interface MovieRowProps {
  title: string;
  index?: number;
  fetchFn: (page: number) => Promise<RowPage>;
  onMovieSelect: (id: string, type: string) => void;
}

/** Distance from the right edge, in px, at which the next page is requested. */
const PREFETCH_THRESHOLD_PX = 400;
const ARROW_DEAD_ZONE_PX = 15;

function isMovieLike(value: unknown): value is Movie {
  return typeof value === 'object' && value !== null && 'type' in value && 'title' in value;
}

/** Kitsu rows already hand back internal Movies; TMDB rows need mapping. */
function normalise(results: unknown[]): Movie[] {
  return results.map((item) =>
    isMovieLike(item) && item.type === 'anime' ? item : api.mapToInternalMovie(item as never)
  );
}

function filterKidsContent(items: Movie[]): Movie[] {
  const adultRatings = new Set(['R', 'NC-17', 'TV-MA', '18+', 'MATURE', 'X']);
  const adultGenres = new Set(['Horror', 'Erotica', 'Crime']);
  return items.filter((m) => {
    if ((m as any).adult) return false;
    if (m.ageRating && adultRatings.has(m.ageRating.toUpperCase())) return false;
    if (m.genres?.some((g) => adultGenres.has(g))) return false;
    return true;
  });
}

export function MovieRow({ title, index, fetchFn, onMovieSelect }: MovieRowProps) {
  const { isKidsMode } = useApp();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const rowRef = useRef<HTMLUListElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);
  const scrollFrame = useRef<number | null>(null);
  const loadingMoreRef = useRef(false);

  /* fetchFn is almost always an inline arrow at the call site, so its identity
   * changes on every parent render. Depending on it directly meant the row
   * refetched page 1 -- and reset the scroll position -- on every re-render.
   * The ref keeps the latest function without making it a dependency. */
  const fetchRef = useRef(fetchFn);
  useEffect(() => {
    fetchRef.current = fetchFn;
  }, [fetchFn]);

  const updateArrows = useCallback(() => {
    const element = rowRef.current;
    if (!element) return;
    const { scrollLeft, scrollWidth, clientWidth } = element;
    const overflows = scrollWidth > clientWidth + ARROW_DEAD_ZONE_PX;
    setShowLeftArrow(scrollLeft > ARROW_DEAD_ZONE_PX);
    setShowRightArrow(overflows && scrollLeft < scrollWidth - clientWidth - ARROW_DEAD_ZONE_PX);
  }, []);

  const hasMore = totalPages === null ? true : page < totalPages;

  // Load (or reload) the first page.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    fetchRef
      .current(1)
      .then((data) => {
        if (!active) return;
        const results = Array.isArray(data?.results) ? data.results : [];
        const normalised = normalise(results);
        setMovies(isKidsMode ? filterKidsContent(normalised) : normalised);
        setPage(1);
        setTotalPages(
          typeof data?.total_pages === 'number' ? data.total_pages : results.length ? null : 1
        );
        setLoading(false);
      })
      .catch((cause) => {
        if (!active) return;
        console.error(`Row "${title}" failed to load:`, cause);
        setLoading(false);
        setError(true);
      });

    return () => {
      active = false;
    };
  }, [title, reloadToken, isKidsMode]);

  // Arrow visibility depends on content width, which changes with the list and
  // on resize. A ResizeObserver replaces the previous setTimeout(…, 150) guesses.
  useEffect(() => {
    const element = rowRef.current;
    if (!element) return;
    updateArrows();
    const observer = new ResizeObserver(updateArrows);
    observer.observe(element);
    return () => observer.disconnect();
  }, [movies.length, updateArrows]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await fetchRef.current(nextPage);
      const results = Array.isArray(data?.results) ? data.results : [];
      if (results.length === 0) {
        setTotalPages(nextPage - 1);
        return;
      }
      const mapped = isKidsMode ? filterKidsContent(normalise(results)) : normalise(results);
      setMovies((previous) => {
        const seen = new Set(previous.map((item) => item.id));
        return [...previous, ...mapped.filter((item) => !seen.has(item.id))];
      });
      setPage(nextPage);
      if (typeof data?.total_pages === 'number') setTotalPages(data.total_pages);
    } catch (cause) {
      console.error(`Row "${title}" failed to page:`, cause);
      setTotalPages(page);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, page, title]);

  const handleScroll = useCallback(() => {
    if (scrollFrame.current !== null) return;
    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = null;
      updateArrows();
      const element = rowRef.current;
      if (!element) return;
      const remaining = element.scrollWidth - (element.scrollLeft + element.clientWidth);
      if (remaining < PREFETCH_THRESHOLD_PX) void loadMore();
    });
  }, [loadMore, updateArrows]);

  useEffect(
    () => () => {
      if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
    },
    []
  );

  const scrollByPage = (direction: 'left' | 'right') => {
    const element = rowRef.current;
    if (!element) return;
    const delta = element.clientWidth * 0.75;
    element.scrollTo({
      left: element.scrollLeft + (direction === 'left' ? -delta : delta),
      behavior: 'smooth',
    });
  };

  const pointerX = (event: React.MouseEvent | React.TouchEvent, element: HTMLElement) =>
    ('touches' in event ? event.touches[0].pageX : event.pageX) - element.offsetLeft;

  const handleDragStart = (event: React.MouseEvent | React.TouchEvent) => {
    const element = rowRef.current;
    if (!element) return;
    isDown.current = true;
    startX.current = pointerX(event, element);
    startScroll.current = element.scrollLeft;
  };

  const handleDragEnd = () => {
    isDown.current = false;
  };

  const handleDragMove = (event: React.MouseEvent | React.TouchEvent) => {
    const element = rowRef.current;
    if (!isDown.current || !element) return;
    element.scrollLeft = startScroll.current - (pointerX(event, element) - startX.current) * 2;
  };

  // Calculate horizontal sibling shift when an item expands in landscape mode
  const getShiftX = (i: number) => {
    if (expandedIdx === null) return 0;
    const isFirst = expandedIdx === 0;
    const isLast = expandedIdx === movies.length - 1;
    const shift = 60;
    if (i < expandedIdx) {
      return isLast ? -shift * 2 : -shift;
    }
    if (i > expandedIdx) {
      return isFirst ? shift * 2 : shift;
    }
    return 0;
  };

  const numberedPrefix = index != null ? String(index + 1).padStart(2, '0') : null;

  const heading = (
    <div className="flex items-center justify-between mb-4 px-3 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        {/* Category Accent Pip */}
        <span className="w-1.5 h-5 rounded-full bg-brand shadow-[0_0_10px_var(--theme-accent-glow,rgba(232,133,42,0.8))]" />

        {numberedPrefix && (
          <span className="font-mono text-xs sm:text-sm tracking-widest text-brand/80 font-bold">
            {numberedPrefix}
          </span>
        )}

        <h2 className="font-display text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
      </div>

      {movies.length > 0 && (
        <span className="text-[11px] font-mono text-muted-foreground/70 tracking-wider uppercase hidden sm:inline-block">
          Explore All →
        </span>
      )}
    </div>
  );

  if (loading) {
    return (
      <section className="mb-10 sm:mb-14 w-full" aria-busy="true" aria-label={`${title}, loading`}>
        {heading}
        <div className="flex gap-4 sm:gap-5 overflow-hidden px-4 sm:px-8 lg:px-12">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={`skeleton-${i}`}
              className="flex-shrink-0 w-[150px] sm:w-[180px] md:w-[210px] lg:w-[240px] xl:w-[260px] aspect-[2/3] rounded-[1.25rem] double-bezel-card p-[1.5px] border border-white/5 relative overflow-hidden"
            >
              <div className="w-full h-full skeleton-shimmer bg-[#12131b] rounded-[calc(1.25rem-1.5px)] p-3 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <div className="w-10 h-4 rounded-full bg-white/10" />
                  <div className="w-8 h-4 rounded-full bg-white/10" />
                </div>
                <div className="space-y-1.5">
                  <div className="w-3/4 h-3.5 rounded bg-white/10" />
                  <div className="w-1/2 h-2.5 rounded bg-white/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-10 sm:mb-14 w-full px-3 sm:px-6 lg:px-8">
        {heading}
        <div
          role="alert"
          className="w-full py-12 glass border border-red-500/20 rounded-2xl flex flex-col items-center justify-center text-muted-foreground backdrop-blur gap-4 shadow-card"
        >
          <p className="text-sm sm:text-base font-medium">Couldn’t load {title}.</p>
          <button
            type="button"
            onClick={() => setReloadToken((value) => value + 1)}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 text-xs sm:text-sm font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (movies.length === 0) return null;

  const arrowClasses =
    'absolute top-1/2 -translate-y-1/2 z-[90] w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#0a0a0f]/90 hover:bg-brand text-white hover:text-background backdrop-blur-2xl border border-white/15 hover:border-brand flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(232,133,42,0.3)] hover:scale-110 active:scale-90 transition-all duration-200 cursor-pointer opacity-95 sm:opacity-0 sm:group-hover/row:opacity-100 focus-visible:opacity-100';

  return (
    <section className="mb-8 sm:mb-10 relative group/row w-full" aria-label={title}>
      {heading}

      <div className="relative w-full">
        <AnimatePresence>
          {showLeftArrow && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
              transition={{ duration: 0.2 }}
              onClick={() => scrollByPage('left')}
              aria-label={`Scroll ${title} left`}
              className={`${arrowClasses} left-2 sm:left-4`}
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </motion.button>
          )}
        </AnimatePresence>

        <ul
          ref={rowRef}
          onScroll={handleScroll}
          onMouseDown={handleDragStart}
          onMouseLeave={handleDragEnd}
          onMouseUp={handleDragEnd}
          onMouseMove={handleDragMove}
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
          onTouchMove={handleDragMove}
          className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none px-4 sm:px-8 lg:px-12 pt-14 pb-20 -my-10 snap-x select-none list-none m-0"
        >
          {movies.map((movie, idx) => (
            <motion.li
              key={`${movie.type}-${movie.id}`}
              initial={{ opacity: 0, y: 35, scale: 0.94 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              animate={{
                x: getShiftX(idx),
                zIndex: expandedIdx === idx ? 80 : 1,
              }}
              transition={{
                x: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                zIndex: { duration: 0 },
                opacity: { duration: 0.5, delay: Math.min((idx % 6) * 0.06, 0.35), ease: [0.16, 1, 0.3, 1] },
                scale: { duration: 0.5, delay: Math.min((idx % 6) * 0.06, 0.35), ease: [0.16, 1, 0.3, 1] },
              }}
              className="snap-start flex-shrink-0 w-[150px] sm:w-[180px] md:w-[210px] lg:w-[240px] xl:w-[260px] relative"
            >
              <MovieCard
                movie={movie}
                onClick={() => onMovieSelect(movie.id, movie.type)}
                cardIndex={idx}
                totalCards={movies.length}
                onExpandChange={(expanded) => {
                  setExpandedIdx(expanded ? idx : null);
                }}
              />
            </motion.li>
          ))}
          {loadingMore && (
            <li className="flex-shrink-0 w-[150px] sm:w-[180px] md:w-[210px] lg:w-[240px] xl:w-[260px] aspect-[2/3] rounded-2xl skeleton-shimmer border border-white/5" />
          )}
        </ul>

        <AnimatePresence>
          {showRightArrow && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              transition={{ duration: 0.2 }}
              onClick={() => scrollByPage('right')}
              aria-label={`Scroll ${title} right`}
              className={`${arrowClasses} right-2 sm:right-4`}
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
