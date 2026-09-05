import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import FocusLock from 'react-focus-lock';
import { Filter, X } from 'lucide-react';
import { api, kitsuApi } from '../api';
import type { Movie } from '../types';
import { MovieCard } from './MovieCard';
import { HeroSpotlight } from './HeroSpotlight';
import { Breadcrumbs } from './Breadcrumbs';

interface PageShellProps {
  title: string;
  defaultType: 'movie' | 'tv' | 'anime';
  onMovieSelect: (id: string, type: string) => void;
  isSearch?: boolean;
  searchQuery?: string;
}

interface AdvancedFilters {
  minYear: string;
  maxYear: string;
  minRating: string;
  sortBy: string;
}

/* The year bounds were hardcoded to 2024: the dropdown stopped there and
 * `maxYear` defaulted to '2024', so once the filters were touched every title
 * released after 2024 was silently excluded. */
const CURRENT_YEAR = new Date().getFullYear();
const EARLIEST_YEAR = 1980;

const DEFAULT_FILTERS: AdvancedFilters = {
  minYear: '2000',
  maxYear: String(CURRENT_YEAR),
  minRating: '5',
  sortBy: 'popularity.desc',
};

const MOVIE_PILLS = [
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

const TV_PILLS = [
  { id: 'all', label: 'All' },
  { id: '18', label: 'Drama' },
  { id: '35', label: 'Comedy' },
  { id: '10765', label: 'Sci-Fi & Fantasy' },
  { id: '80', label: 'Crime' },
  { id: '99', label: 'Documentary' },
  { id: '16', label: 'Animation' },
  { id: '10764', label: 'Reality' },
];

const ANIME_PILLS = [
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

const PILLS_BY_TYPE = { movie: MOVIE_PILLS, tv: TV_PILLS, anime: ANIME_PILLS } as const;

const SEARCH_PILLS = [
  { id: 'all', label: 'All Results' },
  { id: 'anime', label: 'Anime Series & Movies' },
  { id: 'tv', label: 'TV Shows' },
  { id: 'movie', label: 'Movies' },
];

const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Most popular' },
  { value: 'vote_average.desc', label: 'Highest rated' },
  { value: 'primary_release_date.desc', label: 'Newest first' },
  { value: 'original_title.asc', label: 'Title A–Z' },
];


function filtersAreDefault(filters: AdvancedFilters): boolean {
  return (
    filters.minYear === DEFAULT_FILTERS.minYear &&
    filters.maxYear === DEFAULT_FILTERS.maxYear &&
    filters.minRating === DEFAULT_FILTERS.minRating &&
    filters.sortBy === DEFAULT_FILTERS.sortBy
  );
}

export function PageShell({
  title,
  defaultType,
  onMovieSelect,
  isSearch,
  searchQuery,
}: PageShellProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePill, setActivePill] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<AdvancedFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilters>(DEFAULT_FILTERS);

  const previousPill = useRef('all');
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  /* `defaultType` is a prop, so it was never going to change through the
   * `filters` state object it was copied into -- `setFilters` was never called
   * anywhere. Using the prop directly removes a whole layer of dead state. */
  const pills = useMemo(() => {
    if (isSearch) return SEARCH_PILLS;
    return PILLS_BY_TYPE[defaultType] ?? [];
  }, [isSearch, defaultType]);

  // Deep-link support: /movies?genre=Action or #movies?genre=Action
  useEffect(() => {
    let genreName: string | null = null;
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      genreName = searchParams.get('genre');
      if (!genreName && window.location.hash.includes('?genre=')) {
        genreName = decodeURIComponent(window.location.hash.split('?genre=')[1] ?? '');
      }
    }
    if (genreName) {
      const match = pills.find((pill) => pill.label.toLowerCase() === genreName?.toLowerCase());
      if (match) setActivePill(match.id);
    }
  }, [pills]);

  const appliedSignature = useMemo(
    () => JSON.stringify(appliedFilters),
    [appliedFilters]
  );

  // Reset paging whenever the query changes.
  useEffect(() => {
    if (activePill !== previousPill.current) {
      setMovies([]);
      previousPill.current = activePill;
    }
    setPage(1);
    setHasMore(true);
    setError(null);
  }, [defaultType, activePill, isSearch, searchQuery, appliedSignature]);

  useEffect(() => {
    let active = true;
    if (page === 1) setLoading(true);
    else setLoadingMore(true);

    const run = async () => {
      try {
        let results: Movie[] = [];
        let more = true;

        if (isSearch && searchQuery) {
          const [tmdbResponse, kitsuResponse] = await Promise.all([
            api.searchMulti(searchQuery, page).catch(() => ({ results: [], total_pages: 0 })),
            kitsuApi.search(searchQuery, 24, (page - 1) * 24).catch(() => ({ data: [], included: [] })),
          ]);

          const fromTmdb: Movie[] = (tmdbResponse.results || [])
            .filter((item) => item.media_type !== 'person' && (item.poster_path || item.backdrop_path))
            .map(api.mapToInternalMovie);

          const fromKitsu: Movie[] = (kitsuResponse.data || [])
            .map((item) => kitsuApi.mapKitsuToInternal(item, kitsuResponse.included || []));

          // Combine both catalogues
          const combined = [...fromKitsu, ...fromTmdb];

          // Intelligently sort so titles closely matching search term come first
          const cleanTerm = searchQuery.toLowerCase().trim();
          combined.sort((a, b) => {
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

          if (activePill === 'anime') {
            results = combined.filter((item) => item.type === 'anime');
          } else if (activePill === 'tv') {
            results = combined.filter((item) => item.type === 'tv');
          } else if (activePill === 'movie') {
            results = combined.filter((item) => item.type === 'movie');
          } else {
            // Deduplicate exact duplicate items by type-id
            const seen = new Set<string>();
            results = combined.filter((item) => {
              const key = `${item.type}-${item.id}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
          }

          more = page < (tmdbResponse.total_pages ?? 1) || (kitsuResponse.data?.length ?? 0) >= 24;
        } else if (defaultType === 'anime') {
          // Goes through kitsuApi so anime requests get the same caching,
          // de-duplication, timeout and retry as everything else. This used to
          // be a bare fetch() with the URL duplicated in two branches.
          const response =
            activePill === 'all'
              ? await kitsuApi.getTrending(page)
              : await kitsuApi.getByCategory(activePill, page);
          results = response.data.map((item) =>
            kitsuApi.mapKitsuToInternal(item, response.included ?? [])
          );
          more = results.length > 0;
        } else {
          const params: Record<string, string | number> = { page };
          if (activePill !== 'all') params.with_genres = activePill;

          if (!filtersAreDefault(appliedFilters)) {
            const dateField =
              defaultType === 'tv' ? 'first_air_date' : 'primary_release_date';
            params[`${dateField}.gte`] = `${appliedFilters.minYear}-01-01`;
            params[`${dateField}.lte`] = `${appliedFilters.maxYear}-12-31`;
            params['vote_average.gte'] = appliedFilters.minRating;
            params.sort_by = appliedFilters.sortBy;
          } else {
            params.sort_by = 'popularity.desc';
          }

          const response = await api.discover(defaultType, params);
          results = response.results
            .filter((item) => item.poster_path || item.backdrop_path)
            .map(api.mapToInternalMovie);
          more = page < (response.total_pages ?? 1);
        }

        if (!active) return;
        setMovies((previous) => {
          if (page === 1) return results;
          const seen = new Set(previous.map((item) => `${item.type}-${item.id}`));
          return [...previous, ...results.filter((item) => !seen.has(`${item.type}-${item.id}`))];
        });
        setHasMore(more);
        setError(null);
      } catch (cause) {
        console.error(`Failed to load ${title}:`, cause);
        // The old code only surfaced an error for anime. Every other failure
        // fell through to "No results found." -- indistinguishable from an
        // empty but successful response.
        if (active) setError('We couldn’t reach the catalogue. Check your connection and retry.');
      } finally {
        if (active) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [defaultType, activePill, isSearch, searchQuery, appliedSignature, page, title]);

  const closeDrawer = useCallback(() => {
    setIsFilterDrawerOpen(false);
    filterButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isFilterDrawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isFilterDrawerOpen, closeDrawer]);

  const yearOptions = useMemo(
    () => Array.from({ length: CURRENT_YEAR - EARLIEST_YEAR + 1 }, (_, i) => CURRENT_YEAR - i),
    []
  );

  const activeFilterCount = filtersAreDefault(appliedFilters) ? 0 : 1;

  return (
    <div className="pb-12 min-h-screen">
      {!isSearch && <HeroSpotlight type={defaultType} onMovieSelect={onMovieSelect} />}

      <div className={`max-w-[1600px] mx-auto px-4 md:px-10 ${isSearch ? 'pt-24' : 'pt-8'}`}>
        <Breadcrumbs items={[{ label: title }]} />

        <div className="mb-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <h1 className="text-3xl font-display font-bold text-foreground">
            {isSearch ? title : `Explore ${title}`}
          </h1>
        </div>

        {pills.length > 0 && (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-4 mb-8" role="tablist">
            {pills.map((pill) => (
              <button
                key={pill.id}
                type="button"
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
            {!isSearch && defaultType !== 'anime' && (
              <button
                ref={filterButtonRef}
                type="button"
                onClick={() => {
                  setDraftFilters(appliedFilters);
                  setIsFilterDrawerOpen(true);
                }}
                aria-haspopup="dialog"
                aria-expanded={isFilterDrawerOpen}
                className="px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition-all bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground border border-white/10 flex items-center gap-2 ml-auto cursor-pointer"
              >
                <Filter size={18} aria-hidden="true" /> Filters
                {activeFilterCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-brand" aria-label="Filters active" />
                )}
              </button>
            )}
          </div>
        )}

        {error ? (
          <div className="py-20 flex justify-center">
            <div
              role="alert"
              className="glass border border-red-500/30 p-8 rounded-2xl max-w-lg text-center backdrop-blur-xl"
            >
              <h2 className="text-2xl font-display text-foreground mb-4">Something went wrong</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <button
                type="button"
                onClick={() => setPage(1)}
                className="px-6 py-2.5 bg-brand text-background font-bold rounded-xl hover:bg-brand-light transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : loading && movies.length === 0 ? (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
            aria-busy="true"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={`skeleton-${i}`}
                className="aspect-[2/3] rounded-[1.25rem] double-bezel-card p-[1.5px] border border-white/5 relative overflow-hidden"
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
        ) : movies.length > 0 ? (
          <>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
              role="tabpanel"
              aria-busy={loadingMore}
            >
              {movies.map((movie, index) => (
                <div
                  key={`${activePill}-${movie.type}-${movie.id}`}
                  className="relative hover:z-30 transition-transform duration-200 hover:-translate-y-1"
                >
                  <MovieCard
                    movie={movie}
                    onClick={() => onMovieSelect(movie.id, movie.type)}
                    cardIndex={index}
                    totalCards={movies.length}
                  />
                </div>
              ))}
            </div>

            {hasMore && !isSearch && (
              <div className="mt-12 flex justify-center pb-12">
                <button
                  type="button"
                  onClick={() => setPage((value) => value + 1)}
                  disabled={loadingMore}
                  className="px-8 py-3 glass border border-brand/30 text-brand font-bold rounded-xl hover:bg-brand/10 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center py-20 text-muted-foreground text-lg">
            Nothing matched those filters.
          </p>
        )}
      </div>

      <AnimatePresence>
        {isFilterDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250]"
            />
            {/* Focus is trapped and Escape closes, matching the other overlays. */}
            <FocusLock returnFocus>
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="Advanced filters"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-full max-w-sm glass z-[260] border-l border-white/10 p-6 flex flex-col"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-display font-bold text-foreground">
                    Advanced filters
                  </h2>
                  <button
                    type="button"
                    onClick={closeDrawer}
                    aria-label="Close filters"
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-foreground cursor-pointer"
                  >
                    <X size={24} aria-hidden="true" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                  <fieldset>
                    <legend className="block text-sm font-medium text-muted-foreground mb-2">
                      Year range
                    </legend>
                    <div className="flex items-center gap-4">
                      <select
                        aria-label="Earliest year"
                        value={draftFilters.minYear}
                        onChange={(event) =>
                          setDraftFilters((previous) => ({
                            ...previous,
                            minYear: event.target.value,
                          }))
                        }
                        className="w-full bg-card border border-white/10 rounded-xl px-3 py-2 text-foreground outline-none focus:border-brand"
                      >
                        {yearOptions.map((year) => (
                          <option key={`min-${year}`} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      <span className="text-muted-foreground">to</span>
                      <select
                        aria-label="Latest year"
                        value={draftFilters.maxYear}
                        onChange={(event) =>
                          setDraftFilters((previous) => ({
                            ...previous,
                            maxYear: event.target.value,
                          }))
                        }
                        className="w-full bg-card border border-white/10 rounded-xl px-3 py-2 text-foreground outline-none focus:border-brand"
                      >
                        {yearOptions.map((year) => (
                          <option key={`max-${year}`} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </fieldset>

                  <div>
                    <label
                      htmlFor="min-rating"
                      className="flex justify-between text-sm font-medium text-muted-foreground mb-2"
                    >
                      <span>Minimum rating</span>
                      <span className="text-brand font-bold">{draftFilters.minRating}+</span>
                    </label>
                    <input
                      id="min-rating"
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={draftFilters.minRating}
                      onChange={(event) =>
                        setDraftFilters((previous) => ({
                          ...previous,
                          minRating: event.target.value,
                        }))
                      }
                      className="w-full accent-brand"
                    />
                  </div>

                  <fieldset>
                    <legend className="block text-sm font-medium text-muted-foreground mb-3">
                      Sort by
                    </legend>
                    <div className="space-y-3">
                      {SORT_OPTIONS.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          {/* The radio is visually hidden but focusable, so the
                              group is keyboard-operable. It was `hidden`
                              before, which removes it from the tab order and
                              made sorting mouse-only. */}
                          <input
                            type="radio"
                            name="sortBy"
                            value={option.value}
                            checked={draftFilters.sortBy === option.value}
                            onChange={(event) =>
                              setDraftFilters((previous) => ({
                                ...previous,
                                sortBy: event.target.value,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <span
                            aria-hidden="true"
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand ${
                              draftFilters.sortBy === option.value
                                ? 'border-brand'
                                : 'border-white/30 group-hover:border-white/60'
                            }`}
                          >
                            {draftFilters.sortBy === option.value && (
                              <span className="w-2.5 h-2.5 rounded-full bg-brand" />
                            )}
                          </span>
                          <span
                            className={`transition-colors ${
                              draftFilters.sortBy === option.value
                                ? 'text-foreground font-bold'
                                : 'text-muted-foreground group-hover:text-foreground'
                            }`}
                          >
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDraftFilters(DEFAULT_FILTERS)}
                    className="px-5 py-4 bg-white/5 hover:bg-white/10 text-foreground font-medium rounded-xl transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedFilters(draftFilters);
                      closeDrawer();
                    }}
                    className="flex-1 py-4 bg-brand text-background font-bold rounded-xl hover:bg-brand-light transition-colors shadow-card"
                  >
                    Apply filters
                  </button>
                </div>
              </motion.div>
            </FocusLock>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
