import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Crown } from 'lucide-react';
import { Movie } from '../types';
import { api } from '../api';
import { MovieCard } from './MovieCard';
import { cn } from '../lib/utils';
import { useCarousel } from '../hooks/useCarousel';

interface Top10RowProps {
  onMovieSelect: (id: string, type: string) => void;
  region?: string;
}

const REGION_NAMES: Record<string, string> = {
  US: 'the US',
  GB: 'the UK',
  CA: 'Canada',
  AU: 'Australia',
  IN: 'India',
  DE: 'Germany',
  FR: 'France',
  JP: 'Japan',
  KR: 'South Korea',
  BR: 'Brazil',
  MX: 'Mexico',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'the Netherlands',
};

const RANK_COUNT = 10;

/**
 * `VELOCITY_TAGS` used to live here: a rank-keyed table that stamped
 * "🔥 Viral" on whatever landed 5th and "▲ High Demand" on whatever landed 6th.
 * It looked like telemetry and was nothing but the array index restyled, in the
 * same family as the "96% Match" that came off `MovieCard`. Rank is real, so the
 * numeral and the #1 crown stay; the invented signals are gone.
 */

/**
 * Region-ranked top ten.
 *
 * The previous version called `/trending/all` -- a single global list -- and
 * then titled it "Top 10 in India Today", so the region picker changed the
 * heading and nothing else. TMDB has no regional trending endpoint, but
 * `discover` does accept `watch_region`, which genuinely restricts results to
 * titles streamable in that country. Movies and shows are fetched separately
 * (discover has no combined mode) and interleaved.
 */
async function loadRegionalTop(region: string): Promise<Movie[]> {
  const params = {
    watch_region: region,
    with_watch_monetization_types: 'flatrate',
    sort_by: 'popularity.desc',
    'vote_count.gte': 50,
    page: 1,
  };

  const [movies, shows] = await Promise.all([
    api.discover('movie', params),
    api.discover('tv', params),
  ]);

  const usable = (results: unknown) =>
    (Array.isArray(results) ? results : [])
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .filter((item) => item.media_type !== 'person' && Boolean(item.poster_path))
      .map((item) => api.mapToInternalMovie(item as never));

  const films = usable(movies?.results);
  const series = usable(shows?.results);

  // Alternate so a region dominated by one medium doesn't fill all ten slots.
  const interleaved: Movie[] = [];
  for (let i = 0; interleaved.length < RANK_COUNT && (films[i] || series[i]); i += 1) {
    if (films[i]) interleaved.push(films[i]);
    if (interleaved.length < RANK_COUNT && series[i]) interleaved.push(series[i]);
  }
  return interleaved.slice(0, RANK_COUNT);
}

export function Top10Row({ onMovieSelect, region = 'US' }: Top10RowProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const { scrollerProps, showLeftArrow, showRightArrow, rovingIndex, resetFocus, scrollByPage } =
    useCarousel({ itemCount: movies.length });

  const regionCode = (region || 'US').toUpperCase();
  const regionLabel = REGION_NAMES[regionCode] || region || 'Global';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    loadRegionalTop(regionCode)
      .then((ranked) => {
        if (!active) return;
        setMovies(ranked);
        resetFocus();
        // An empty list is a failure here: the row promises ten titles.
        setError(ranked.length === 0);
      })
      .catch((cause) => {
        if (!active) return;
        console.error('Failed to load the regional top ten:', cause);
        setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [regionCode, reloadToken, resetFocus]);

  const heading = (
    <div className="rail-heading flex items-end justify-between mb-3 px-3 sm:px-8 lg:px-12">
      <div>
        <p className="eyebrow">The week&apos;s most watched</p>
        <h3 className="font-display font-medium text-base sm:text-lg lg:text-xl tracking-tight text-[#f3f0ea] m-0">
          Top 10 in {regionLabel} Today
        </h3>
      </div>
      <p className="text-[10px] font-mono text-[#77737a] tracking-wider uppercase hidden sm:block">
        Refreshed daily
      </p>
    </div>
  );

  if (loading) {
    return (
      <section className="rail top10-rail mb-12 sm:mb-16 w-full select-none" aria-busy="true" aria-label="Loading Top 10 Today">
        {heading}
        <div className="flex gap-3 sm:gap-4 overflow-hidden px-4 sm:px-8 lg:px-12 py-6">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={`top10-skeleton-${i}`} className="flex items-end shrink-0">
              <div className="w-[120px] sm:w-[140px] md:w-[160px] aspect-[2/3] rounded-[12px] bg-[#141417] border border-white/5 relative z-10 overflow-hidden">
                <div className="w-full h-full skeleton-shimmer bg-[#1b191c] rounded-[12px]" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Silence was the old failure mode: a rejected request just left the row out
  // of the page with nothing said and no way to retry.
  if (error) {
    return (
      <section className="rail top10-rail mb-12 sm:mb-16 w-full px-4 sm:px-8 lg:px-12" aria-label="Top 10 Today">
        {heading}
        <div
          role="alert"
          className="w-full py-12 bg-[#141417] border border-white/10 rounded-2xl flex flex-col items-center justify-center text-muted-foreground backdrop-blur gap-4"
        >
          <p className="text-sm sm:text-base font-medium text-[#f3f0ea]">
            Couldn’t load the top ten for {regionLabel}.
          </p>
          <button
            type="button"
            onClick={() => setReloadToken((value) => value + 1)}
            className="secondary-btn text-xs"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (movies.length === 0) return null;

  return (
    <section className="rail top10-rail mb-12 sm:mb-16 relative group/top10 w-full" aria-label={`Top 10 in ${regionLabel} Today`}>
      {heading}

      <div className="relative w-full">
        <AnimatePresence>
          {showLeftArrow && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={() => scrollByPage('left')}
              aria-label="Scroll Top 10 left"
              className="rail-arrow rail-arrow-left left-2 sm:left-4"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </motion.button>
          )}
        </AnimatePresence>

        <ul
          {...scrollerProps}
          className="card-row flex gap-2 sm:gap-4 overflow-x-auto scroll-smooth overscroll-x-contain scrollbar-none px-3 sm:px-8 lg:px-12 pt-2 pb-6 snap-x select-none list-none m-0 items-end will-change-scroll"
        >
          {movies.map((movie, idx) => {
            const rank = idx + 1;
            const podiumClass =
              rank === 1
                ? 'top10-podium-1'
                : rank === 2
                ? 'top10-podium-2'
                : rank === 3
                ? 'top10-podium-3'
                : '';

            const rankNumeralClass =
              rank === 1
                ? 'top10-rank-1'
                : rank === 2
                ? 'top10-rank-2'
                : rank === 3
                ? 'top10-rank-3'
                : '';

            return (
              <li
                key={`top10-showcase-${movie.type}-${movie.id}`}
                className="snap-start flex-shrink-0 flex items-end relative group/top10-item transition-transform duration-200 hover:-translate-y-1"
              >
                {/* 3D sculpted numeral. Decorative: the rank is announced as part
                    of each card's accessible name instead, so screen readers get
                    "1. Dune" rather than a stray digit. */}
                <div
                  aria-hidden="true"
                  className={cn(
                    "top10-numeral-3d -mr-6 sm:-mr-8 md:-mr-10 lg:-mr-11 xl:-mr-12 z-0 relative",
                    "text-[95px] sm:text-[115px] md:text-[135px] lg:text-[155px] xl:text-[170px] 2xl:text-[180px]",
                    rankNumeralClass,
                    rank === 10 && "-mr-8 sm:-mr-10 md:-mr-12 lg:-mr-14 xl:-mr-15 tracking-tighter"
                  )}
                >
                  {rank}
                </div>

                <div className="w-[115px] sm:w-[135px] md:w-[155px] lg:w-[170px] xl:w-[180px] 2xl:w-[185px] relative z-10 flex flex-col">
                  {rank === 1 && (
                    <div className="mb-2 flex items-center gap-1.5 self-start">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 bg-gradient-to-r from-[#ffcf33]/25 to-[#e8852a]/20 text-[#ffe885] border border-[#ffcf33]/40 backdrop-blur-md shadow-sm">
                        <Crown className="w-3 h-3 text-[#ffe270] fill-[#ffe270]" aria-hidden="true" />
                        <span>#1 in {regionLabel}</span>
                      </span>
                    </div>
                  )}

                  <div className={cn('w-full rounded-[1.25rem]', podiumClass)}>
                    <MovieCard
                      movie={movie}
                      onClick={() => onMovieSelect(movie.id, movie.type)}
                      rankLabel={`${rank}`}
                      tabIndex={idx === rovingIndex ? 0 : -1}
                    />
                  </div>
                </div>
              </li>
            );
          })}
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
              aria-label="Scroll Top 10 right"
              className="rail-arrow rail-arrow-right right-2 sm:right-4"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
