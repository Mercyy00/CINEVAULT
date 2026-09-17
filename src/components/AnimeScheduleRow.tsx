import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { anilistApi, POSTER_SIZES } from '../api';
import type { Movie } from '../types';
import { PosterImage } from './PosterImage';
import { useCarousel } from '../hooks/useCarousel';
import { cn } from '../lib/utils';
import { triggerHaptic } from '../lib/mobile';

interface AnimeScheduleRowProps {
  onMovieSelect: (id: string, type: string) => void;
}

function formatAiringTime(airingAt: number): { label: string; isToday: boolean } {
  const date = new Date(airingAt * 1000);
  const now = Date.now();
  const diffMs = date.getTime() - now;

  if (diffMs <= 0) {
    return { label: 'Airing now', isToday: true };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  // Less than 24 hours: Show relative countdown
  if (hours < 24) {
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return {
      label: hours === 0 ? `In ${mins}m` : `In ${hours}h ${mins}m`,
      isToday: true,
    };
  }

  // Format in user's local timezone
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (days === 1) {
    return { label: `Tomorrow at ${timeStr}`, isToday: false };
  }

  const weekday = date.toLocaleDateString([], { weekday: 'short' });
  return { label: `${weekday} at ${timeStr}`, isToday: false };
}

export function AnimeScheduleRow({ onMovieSelect }: AnimeScheduleRowProps) {
  const [schedule, setSchedule] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { scrollerProps, showLeftArrow, showRightArrow, scrollByPage } = useCarousel({
    itemCount: schedule.length,
  });

  useEffect(() => {
    let active = true;
    setLoading(true);

    anilistApi
      .getSchedule(1, 24)
      .then((res) => {
        if (!active) return;
        setSchedule(res.results);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        console.error('Failed to load anime schedule:', err);
        setError('Could not load airing schedule');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!loading && schedule.length === 0 && !error) {
    return null;
  }

  return (
    <section className="mb-8 sm:mb-12 relative group/row w-full select-none" aria-label="Airing Schedule">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-5 rounded-full bg-brand shadow-[0_0_10px_var(--theme-accent-glow,rgba(232,133,42,0.8))]" />
          <h2 className="font-display text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Airing Schedule</span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-brand bg-brand/15 px-2 py-0.5 rounded-full border border-brand/30 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Live
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <Clock className="w-3.5 h-3.5 text-brand" />
          <span className="hidden sm:inline">Local Timezone</span>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="flex gap-4 sm:gap-5 overflow-hidden px-4 sm:px-8 lg:px-12">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={`sched-skel-${i}`}
              className="flex-shrink-0 w-[150px] sm:w-[180px] md:w-[210px] aspect-[2/3] rounded-2xl bg-[#12131b] border border-white/5 relative overflow-hidden skeleton-shimmer"
            />
          ))}
        </div>
      ) : error ? (
        <div className="px-4 sm:px-8">
          <div className="p-4 rounded-xl glass border border-white/10 text-xs text-muted-foreground text-center">
            {error}
          </div>
        </div>
      ) : (
        <div className="relative w-full">
          {/* Navigation Arrows */}
          <AnimatePresence>
            {showLeftArrow && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  triggerHaptic('light');
                  scrollByPage('left');
                }}
                aria-label="Scroll schedule left"
                className="hidden sm:flex absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-[90] w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#0a0a0f]/90 hover:bg-brand text-white hover:text-background backdrop-blur-2xl border border-white/15 hover:border-brand items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all cursor-pointer opacity-0 group-hover/row:opacity-100"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showRightArrow && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  triggerHaptic('light');
                  scrollByPage('right');
                }}
                aria-label="Scroll schedule right"
                className="hidden sm:flex absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-[90] w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#0a0a0f]/90 hover:bg-brand text-white hover:text-background backdrop-blur-2xl border border-white/15 hover:border-brand items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all cursor-pointer opacity-0 group-hover/row:opacity-100"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Carousel Track */}
          <ul
            {...scrollerProps}
            className="flex gap-3.5 sm:gap-5 overflow-x-auto scroll-smooth overscroll-x-contain scrollbar-none px-3 sm:px-8 lg:px-12 pt-3 pb-8 -my-2 snap-x select-none list-none m-0 will-change-scroll"
          >
            {schedule.map((anime) => {
              const airingInfo = anime.nextAiringEpisode
                ? formatAiringTime(anime.nextAiringEpisode.airingAt)
                : null;

              return (
                <li
                  key={`sched-${anime.id}`}
                  className="flex-shrink-0 w-[145px] sm:w-[175px] md:w-[200px] snap-start"
                >
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      onMovieSelect(anime.id, 'anime');
                    }}
                    className="w-full text-left group/card cursor-pointer focus:outline-none"
                  >
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 group-hover/card:border-brand/50 transition-all duration-300 shadow-card group-hover/card:shadow-brand/20 group-hover/card:-translate-y-1 bg-[#101118]">
                      <PosterImage
                        src={anime.posterUrl}
                        sizes={POSTER_SIZES}
                        title={anime.title}
                        decorative
                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
                      />

                      {/* Airing Schedule Badge */}
                      {airingInfo && anime.nextAiringEpisode && (
                        <div className="absolute top-2.5 inset-x-2 z-20 flex flex-col gap-1">
                          <div
                            className={cn(
                              'px-2.5 py-1 rounded-lg backdrop-blur-md border text-[10px] font-mono font-bold tracking-wide shadow-lg flex items-center justify-between',
                              airingInfo.isToday
                                ? 'bg-brand/90 text-background border-brand/50 animate-pulse'
                                : 'bg-black/75 text-white/95 border-white/20'
                            )}
                          >
                            <span className="font-extrabold uppercase">
                              EP {anime.nextAiringEpisode.episode}
                            </span>
                            <span className="text-[9px] opacity-90 truncate max-w-[95px]">
                              {airingInfo.label}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 z-20">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-brand bg-brand/10 border border-brand/30 px-3 py-1.5 rounded-xl backdrop-blur-md mx-auto">
                          <Play className="w-3.5 h-3.5 fill-current" /> View Anime
                        </span>
                      </div>
                    </div>

                    {/* Meta info below poster */}
                    <div className="mt-2.5 px-0.5">
                      <h3 className="font-display font-semibold text-xs sm:text-sm text-foreground group-hover/card:text-brand transition-colors line-clamp-1">
                        {anime.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground font-mono">
                        {anime.rating !== null && (
                          <span className="text-brand font-bold">★ {Number(anime.rating).toFixed(1)}</span>
                        )}
                        {anime.genres?.[0] && (
                          <>
                            <span>•</span>
                            <span className="truncate">{anime.genres[0]}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
