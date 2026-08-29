import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Crown, Flame, TrendingUp, Sparkles } from 'lucide-react';
import { Movie } from '../types';
import { api } from '../api';
import { MovieCard } from './MovieCard';
import { cn } from '../lib/utils';

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

const VELOCITY_TAGS: Record<number, { text: string; icon?: React.ReactNode; color: string }> = {
  1: { text: '#1 Leader', icon: <Crown className="w-3 h-3 text-[#ffe270] fill-[#ffe270]" />, color: 'from-[#ffcf33]/25 to-[#e8852a]/20 text-[#ffe885] border-[#ffcf33]/40' },
  2: { text: '#2 Runner-up', icon: <Sparkles className="w-3 h-3 text-cyan-200" />, color: 'from-cyan-400/20 to-blue-500/20 text-cyan-100 border-cyan-300/40' },
  3: { text: '#3 Hot Pick', icon: <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />, color: 'from-orange-500/20 to-rose-500/20 text-orange-200 border-orange-400/40' },
  4: { text: '▲ Trending Up', icon: <TrendingUp className="w-3 h-3 text-emerald-400" />, color: 'from-white/10 to-white/5 text-white/80 border-white/10' },
  5: { text: '🔥 Viral', icon: <Flame className="w-3 h-3 text-rose-400" />, color: 'from-white/10 to-white/5 text-white/80 border-white/10' },
  6: { text: '▲ High Demand', icon: <TrendingUp className="w-3 h-3 text-amber-400" />, color: 'from-white/10 to-white/5 text-white/80 border-white/10' },
  7: { text: 'Top Rated', color: 'from-white/10 to-white/5 text-white/80 border-white/10' },
  8: { text: 'Fan Favorite', color: 'from-white/10 to-white/5 text-white/80 border-white/10' },
  9: { text: 'Must Watch', color: 'from-white/10 to-white/5 text-white/80 border-white/10' },
  10: { text: 'Final Cut', color: 'from-white/10 to-white/5 text-white/80 border-white/10' },
};

export function Top10Row({ onMovieSelect, region = 'US' }: Top10RowProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const rowRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Drag variables
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftState = useRef(0);

  const regionLabel = REGION_NAMES[region?.toUpperCase() || ''] || region || 'Global';

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api
      .getTrending('all', 'day', 1)
      .then((data) => {
        if (!mounted) return;
        if (data.results && data.results.length > 0) {
          const mapped = data.results.slice(0, 10).map(api.mapToInternalMovie);
          setMovies(mapped);
        }
      })
      .catch((err) => {
        console.error('Failed to load Top 10 Today:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [region]);

  const updateScrollButtons = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 20);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 20);
  };

  useEffect(() => {
    updateScrollButtons();
    const el = rowRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollButtons, { passive: true });
      window.addEventListener('resize', updateScrollButtons);
    }
    return () => {
      if (el) el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [movies, loading]);

  const scroll = (direction: 'left' | 'right') => {
    const el = rowRef.current;
    if (!el) return;
    const distance = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDown.current = true;
    if (rowRef.current) {
      startX.current = e.pageX - rowRef.current.offsetLeft;
      scrollLeftState.current = rowRef.current.scrollLeft;
    }
  };

  const handleMouseLeave = () => {
    isDown.current = false;
  };

  const handleMouseUp = () => {
    isDown.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !rowRef.current) return;
    const x = e.pageX - rowRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    rowRef.current.scrollLeft = scrollLeftState.current - walk;
  };

  const getShiftX = (idx: number) => {
    if (expandedIdx === null) return 0;
    if (idx === expandedIdx) return 0;
    const baseShift = 65;
    if (expandedIdx === 0) {
      return idx > expandedIdx ? baseShift * 1.8 : 0;
    }
    if (expandedIdx === movies.length - 1) {
      return idx < expandedIdx ? -baseShift * 1.8 : 0;
    }
    if (idx < expandedIdx) return -baseShift;
    if (idx > expandedIdx) return baseShift;
    return 0;
  };

  const heading = (
    <div className="mb-5 px-4 sm:px-8 lg:px-12 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand font-bold">
            Live Stream Velocity
          </span>
        </div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-foreground tracking-tight flex items-center gap-2">
            Top 10 in {regionLabel} Today
          </h2>
        </div>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground/70 font-mono">
        Updated hourly based on watch activity
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

  if (movies.length === 0) return null;

  const arrowClasses =
    'absolute top-1/2 -translate-y-1/2 z-[95] w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#0a0a0f]/90 hover:bg-brand text-white hover:text-background backdrop-blur-2xl border border-white/15 hover:border-brand flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(232,133,42,0.3)] hover:scale-110 active:scale-90 transition-all duration-200 cursor-pointer opacity-95 sm:opacity-0 sm:group-hover/top10:opacity-100 focus-visible:opacity-100';

  return (
    <section className="mb-12 sm:mb-16 relative group/top10 w-full" aria-label={`Top 10 in ${regionLabel} Today`}>
      {heading}

      <div className="relative w-full">
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
              transition={{ duration: 0.2 }}
              onClick={() => scroll('left')}
              aria-label="Scroll Top 10 left"
              className={`${arrowClasses} left-2 sm:left-4`}
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </motion.button>
          )}
        </AnimatePresence>

        <ul
          ref={rowRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="flex gap-3 sm:gap-6 overflow-x-auto scrollbar-none px-4 sm:px-8 lg:px-12 pt-16 pb-20 -my-10 snap-x select-none list-none m-0 items-end"
        >
          {movies.map((movie, idx) => {
            const rank = idx + 1;
            const velocity = VELOCITY_TAGS[rank];
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
              <motion.li
                key={`top10-showcase-${movie.type}-${movie.id}`}
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
                  opacity: { duration: 0.5, delay: Math.min(idx * 0.05, 0.35), ease: [0.16, 1, 0.3, 1] },
                  scale: { duration: 0.5, delay: Math.min(idx * 0.05, 0.35), ease: [0.16, 1, 0.3, 1] },
                }}
                className="snap-start flex-shrink-0 flex items-end relative group/top10-item"
              >
                {/* 1. 3D Sculpted Metallic Numeral (1-10) */}
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

                {/* 2. Elevated Double-Bezel Card Container */}
                <div className="w-[145px] sm:w-[175px] md:w-[205px] lg:w-[230px] relative z-10 flex flex-col">
                  {/* Micro Velocity Pill */}
                  {velocity && (
                    <div className="mb-2 flex items-center gap-1.5 self-start">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 bg-gradient-to-r backdrop-blur-md border shadow-sm",
                          velocity.color
                        )}
                      >
                        {velocity.icon}
                        <span>{velocity.text}</span>
                      </span>
                    </div>
                  )}

                  {/* Poster Card with Landscape Hover-To-Preview */}
                  <div className={cn("w-full rounded-[1.25rem]", podiumClass)}>
                    <MovieCard
                      movie={movie}
                      onClick={() => onMovieSelect(movie.id, movie.type)}
                      cardIndex={idx}
                      totalCards={movies.length}
                      onExpandChange={(expanded) => {
                        setExpandedIdx(expanded ? idx : null);
                      }}
                    />
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>

        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              transition={{ duration: 0.2 }}
              onClick={() => scroll('right')}
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
