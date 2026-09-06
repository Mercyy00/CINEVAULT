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
    <div className="mb-5 px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand font-bold">
            Streaming now
          </span>
        </div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-foreground tracking-tight flex items-center gap-2">
            Top 10 in {regionLabel} Today
          </h2>
        </div>
      </div>
      {/* Was "Updated hourly based on watch activity". There is no watch
          activity, and TMDB's popularity score is recomputed daily. */}
      <p className="text-xs sm:text-sm text-muted-foreground/70 font-mono">
        By TMDB popularity, refreshed daily
      </p>
    </div>
  );

  if (loading) {
    return (
      <section className="mb-12 sm:mb-16 w-full select-none" aria-busy="true" aria-label="Loading Top 10 Today">
        {heading}
        <div className="flex gap-4 sm:gap-6 overflow-hidden px-4 sm:px-8 lg:px-12 py-6">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={`top10-skeleton-${i}`} className="flex items-end shrink-0">
              <div className="top10-numeral-3d text-[110px] sm:text-[160px] md:text-[195px] opacity-20 -mr-6 sm:-mr-10 z-0">
                {i + 1}
              </div>
              <div className="w-[145px] sm:w-[175px] md:w-[205px] lg:w-[230px] aspect-[2/3] rounded-[1.25rem] double-bezel-card p-[1.5px] border border-white/5 relative z-10 overflow-hidden">
                <div className="w-full h-full skeleton-shimmer bg-[#12131b] rounded-[calc(1.25rem-1.5px)] p-3 flex flex-col justify-between" />
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
      <section className="mb-12 sm:mb-16 w-full px-4 sm:px-8 lg:px-12" aria-label="Top 10 Today">
        {heading}
        <div
          role="alert"
          className="w-full py-12 glass border border-red-500/20 rounded-2xl flex flex-col items-center justify-center text-muted-foreground backdrop-blur gap-4 shadow-card"
        >
          <p className="text-sm sm:text-base font-medium">
            Couldn’t load the top ten for {regionLabel}.
          </p>
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
    'absolute top-1/2 -translate-y-1/2 z-[95] w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#0a0a0f]/90 hover:bg-brand text-white hover:text-background backdrop-blur-2xl border border-white/15 hover:border-brand flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(232,133,42,0.3)] hover:scale-110 active:scale-90 transition-all duration-200 cursor-pointer opacity-95 sm:opacity-0 sm:group-hover/top10:opacity-100 focus-visible:opacity-100';

  return (
    <section className="mb-12 sm:mb-16 relative group/top10 w-full" aria-label={`Top 10 in ${regionLabel} Today`}>
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
              aria-label="Scroll Top 10 left"
              className={`${arrowClasses} left-2 sm:left-4`}
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* The oversized numerals need real headroom, but `pt-16 pb-20 -my-10`
            pulled the row into its neighbours, where the padding swallowed
            clicks meant for the rows above and below. */}
        <ul
          {...scrollerProps}
          className="flex gap-3 sm:gap-6 overflow-x-auto scroll-smooth overscroll-x-contain scrollbar-none px-4 sm:px-8 lg:px-12 pt-10 pb-14 -my-8 snap-x select-none list-none m-0 items-end will-change-scroll"
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
                    "top10-numeral-3d -mr-7 sm:-mr-10 md:-mr-12 lg:-mr-14 z-0 relative",
                    "text-[130px] sm:text-[170px] md:text-[205px] lg:text-[240px]",
                    rankNumeralClass,
                    rank === 10 && "-mr-9 sm:-mr-13 md:-mr-16 lg:-mr-20 tracking-tighter"
                  )}
                >
                  {rank}
                </div>

                <div className="w-[145px] sm:w-[175px] md:w-[205px] lg:w-[230px] relative z-10 flex flex-col">
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
