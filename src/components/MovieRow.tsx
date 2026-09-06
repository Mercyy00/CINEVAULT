import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard } from './MovieCard';
import type { Movie } from '../types';
import { api } from '../api';
import { useApp } from '../store';
import { useCarousel } from '../hooks/useCarousel';

interface RowPage {
  results: unknown[];
  total_pages?: number;
}

interface MovieRowProps {
  title: string;
  /**
   * Position of this row on the page. Rows past `EAGER_ROW_COUNT` wait for the
   * viewport before spending a request, and the first row's posters are treated
   * as the largest-contentful candidates.
   */
  index?: number;
  fetchFn: (page: number) => Promise<RowPage>;
  onMovieSelect: (id: string, type: string) => void;
  /**
   * Target for the row-header affordance. When omitted the header shows the
   * loaded count instead of a link that goes nowhere.
   */
  onExploreAll?: () => void;
}

/** Kids mode drops items client-side; keep paging so the row isn't a stub. */
const MIN_ROW_ITEMS = 10;
const MAX_BACKFILL_PAGES = 4;

/** Past this length a row is DOM weight, not browsing. */
const MAX_ROW_ITEMS = 60;

/** Rows below this position wait for the viewport before spending a request. */
const EAGER_ROW_COUNT = 2;

/** Start fetching this far before the row scrolls into view. */
const OBSERVER_MARGIN = '600px 0px';

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
  return items.filter((movie) => {
    // `adult` is a real field on Movie now, so this no longer needs an `any` cast.
    if (movie.adult) return false;
    if (movie.ageRating && adultRatings.has(movie.ageRating.toUpperCase())) return false;
    if (movie.genres?.some((genre) => adultGenres.has(genre))) return false;
    return true;
  });
}

function applyKidsFilter(items: Movie[], kidsMode: boolean): Movie[] {
  return kidsMode ? filterKidsContent(items) : items;
}

/**
 * De-duplicates on `type + id`. Keying on `id` alone was wrong: TMDB and Kitsu
 * number their catalogues independently, so a film and an anime can collide.
 */
function dedupe(items: Movie[]): Movie[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type}-${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Horizontally scrolling poster row.
 *
 * Fixes carried by this version:
 *
 * - **Kids mode no longer leaves two-poster rows.** The filter runs after the
 *   fetch, so a strict row could lose most of a page; it now pages forward
 *   until it has something worth showing.
 * - **A drag is no longer also a click.** `mousemove` set `scrollLeft` with no
 *   movement threshold, so nudging a row opened whatever poster was under the
 *   cursor.
 * - **Dragging is no longer rubbery.** The container carries
 *   `scroll-behavior: smooth`, which also animates direct `scrollLeft` writes,
 *   so the row lagged behind the pointer. Smoothing is suspended mid-drag.
 * - **Arrows land on card boundaries.** `clientWidth * 0.75` stopped mid-poster
 *   and fought `snap-start`; the step is now a whole number of cards.
 * - **`loadMore` sees the current `isKidsMode`.** It was missing from the
 *   dependency array, so a row built before the toggle kept appending unfiltered
 *   pages afterwards.
 * - **Off-screen rows cost nothing.** Every row used to fire its request on
 *   mount; rows past the fold now wait for an `IntersectionObserver`.
 * - **The row is keyboard-navigable** via a roving tabindex, and `Explore All`
 *   is a real control or absent -- it used to be a `<span>` styled as a link.
 */
export function MovieRow({ title, index, fetchFn, onMovieSelect, onExploreAll }: MovieRowProps) {
  const { isKidsMode } = useApp();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  
  // Rows near the top are wanted immediately; the rest wait for the viewport.
  const [inView, setInView] = useState(() => index == null || index < EAGER_ROW_COUNT);

  const sectionRef = useRef<HTMLElement>(null);
  const loadingMoreRef = useRef(false);

  /* fetchFn is almost always an inline arrow at the call site, so its identity
   * changes on every parent render. Depending on it directly meant the row
   * refetched page 1 -- and reset the scroll position -- on every re-render.
   * The ref keeps the latest function without making it a dependency. */
  const fetchRef = useRef(fetchFn);
  useEffect(() => {
    fetchRef.current = fetchFn;
  }, [fetchFn]);

  // Defer the first request until the row is worth loading.
  useEffect(() => {
    if (inView) return;
    const element = sectionRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: OBSERVER_MARGIN }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [inView]);

  const hasMore =
    movies.length < MAX_ROW_ITEMS && (totalPages === null ? true : page < totalPages);

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
      const mapped = applyKidsFilter(normalise(results), isKidsMode);
      setMovies((previous) => dedupe([...previous, ...mapped]).slice(0, MAX_ROW_ITEMS));
      setPage(nextPage);
      if (typeof data?.total_pages === 'number') setTotalPages(data.total_pages);
    } catch (cause) {
      console.error(`Row "${title}" failed to page:`, cause);
      setTotalPages(page);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore, page, title, isKidsMode]);

  const { scrollerProps, showLeftArrow, showRightArrow, rovingIndex, resetFocus, scrollByPage } =
    useCarousel({ itemCount: movies.length, onNearEnd: loadMore });

  // Load (or reload) the first page, backfilling when kids mode thins it out.
  useEffect(() => {
    if (!inView) return;
    let active = true;
    setLoading(true);
    setError(false);

    const load = async () => {
      try {
        const first = await fetchRef.current(1);
        if (!active) return;

        const results = Array.isArray(first?.results) ? first.results : [];
        let collected = dedupe(applyKidsFilter(normalise(results), isKidsMode));
        let lastPage = 1;
        let total =
          typeof first?.total_pages === 'number' ? first.total_pages : results.length ? null : 1;

        while (
          active &&
          isKidsMode &&
          collected.length < MIN_ROW_ITEMS &&
          lastPage < MAX_BACKFILL_PAGES &&
          (total === null || lastPage < total)
        ) {
          const nextPage = lastPage + 1;
          const nextData = await fetchRef.current(nextPage);
          if (!active) return;
          const nextResults = Array.isArray(nextData?.results) ? nextData.results : [];
          if (nextResults.length === 0) {
            total = nextPage - 1;
            break;
          }
          collected = dedupe([...collected, ...filterKidsContent(normalise(nextResults))]);
          lastPage = nextPage;
          if (typeof nextData?.total_pages === 'number') total = nextData.total_pages;
        }

        if (!active) return;
        setMovies(collected);
        setPage(lastPage);
        setTotalPages(total);
        resetFocus();
        setLoading(false);
      } catch (cause) {
        if (!active) return;
        console.error(`Row "${title}" failed to load:`, cause);
        setLoading(false);
        setError(true);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [title, reloadToken, isKidsMode, inView, resetFocus]);

  const isLeadRow = index === 0;

  /* A deferred row must not claim to be loading: it has not asked for anything
   * yet. It reserves roughly a row's height so arriving posters don't shove the
   * page around, and skips the eight skeleton cards -- rendering those for every
   * row below the fold would undo the point of waiting. */
  if (!inView) {
    return (
      <section
        ref={sectionRef}
        aria-hidden="true"
        className="mb-10 sm:mb-14 w-full min-h-[260px] sm:min-h-[320px] lg:min-h-[400px]"
      />
    );
  }

  const heading = (
    <div className="flex items-center justify-between mb-4 px-3 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        {/* Category Accent Pip */}
        <span className="w-1.5 h-5 rounded-full bg-brand shadow-[0_0_10px_var(--theme-accent-glow,rgba(232,133,42,0.8))]" />

        <h2 className="font-display text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
      </div>

      {/* `Explore All →` was a <span>: it looked like a link and did nothing.
          It is now a real button when the row has somewhere to go, and the
          loaded count when it doesn't. */}
      {onExploreAll ? (
        <button
          type="button"
          onClick={onExploreAll}
          className="text-[11px] font-mono tracking-wider uppercase text-muted-foreground/70 hover:text-brand focus-visible:text-brand rounded-full px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors cursor-pointer hidden sm:inline-block"
        >
          {`Explore all ${title} →`}
        </button>
      ) : (
        movies.length > 0 && (
          <span className="text-[11px] font-mono text-muted-foreground/70 tracking-wider uppercase hidden sm:inline-block">
            {movies.length} {movies.length === 1 ? 'title' : 'titles'}
          </span>
        )
      )}
    </div>
  );

  if (loading) {
    return (
      <section
        ref={sectionRef}
        className="mb-10 sm:mb-14 w-full"
        aria-busy="true"
        aria-label={`${title}, loading`}
      >
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
      <section
        ref={sectionRef}
        aria-label={title}
        className="mb-10 sm:mb-14 w-full px-3 sm:px-6 lg:px-8"
      >
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

  // Nothing to show, but the section still has to exist: it carries the
  // observer that decides whether this row ever loads at all.
  if (movies.length === 0) {
    return <section ref={sectionRef} aria-hidden="true" className="h-px w-full" />;
  }

  const arrowClasses =
    'absolute top-1/2 -translate-y-1/2 z-[90] w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#0a0a0f]/90 hover:bg-brand text-white hover:text-background backdrop-blur-2xl border border-white/15 hover:border-brand flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(232,133,42,0.3)] hover:scale-110 active:scale-90 transition-all duration-200 cursor-pointer opacity-95 sm:opacity-0 sm:group-hover/row:opacity-100 focus-visible:opacity-100';

  return (
    <section ref={sectionRef} className="mb-8 sm:mb-10 relative group/row w-full" aria-label={title}>
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

        {/* Touch scrolling is left to the browser: the JS drag handler fought
            momentum scrolling and disabled the platform's own click suppression.
            Vertical padding is only as deep as the hover lift needs -- it used to
            be pt-14/pb-20 pulled back by -my-10, which overlapped the rows above
            and below and swallowed clicks meant for them. */}
        <ul
          {...scrollerProps}
          className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth overscroll-x-contain scrollbar-none px-4 sm:px-8 lg:px-12 pt-8 pb-12 -my-8 snap-x select-none list-none m-0 will-change-scroll"
        >
          {movies.map((movie, idx) => (
            <li
              key={`${movie.type}-${movie.id}`}
              className="snap-start flex-shrink-0 w-[150px] sm:w-[180px] md:w-[210px] lg:w-[240px] xl:w-[260px] relative"
            >
              <MovieCard
                movie={movie}
                onClick={() => onMovieSelect(movie.id, movie.type)}
                tabIndex={idx === rovingIndex ? 0 : -1}
                priority={isLeadRow && idx < 5}
              />
            </li>
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
