import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, useSpring } from 'motion/react';
import { Play, Plus, Check, Info, Star, VolumeX, RotateCcw } from 'lucide-react';
import { Movie, formatRating } from '../types';
import { api, anilistApi, BACKDROP_SIZES } from '../api';
import { useApp } from '../store';
import { getDominantColor } from '../lib/colorThief';
import { goToWatch } from '../lib/navigation';
import { cn } from '../lib/utils';

export type HeroType = 'all' | 'movie' | 'tv' | 'anime';

interface HeroProps {
  /** Catalogue the spotlight is drawn from. `all` is the home page. */
  type?: HeroType;
  onMovieSelect: (id: string, type: string) => void;
}

const SLIDE_COUNT = 5;
const SLIDE_MS = 7_000;

/** How long a slide holds while its trailer plays before rotating on. */
const TRAILER_HOLD_MS = 30_000;

/** Delay before a trailer replaces the still, so a glance isn't ambushed. */
const TRAILER_DELAY_MS = 2_600;

/** Spotlights are editorial, not live data. Ten minutes is plenty. */
const CACHE_TTL_MS = 10 * 60 * 1000;

const heroCache = new Map<HeroType, { movies: Movie[]; at: number }>();

async function loadHero(type: HeroType): Promise<Movie[]> {
  if (type === 'anime') {
    const payload = await anilistApi.getTrending(1, 20);
    return (payload.results ?? [])
      .filter((movie) => Boolean(movie.backdropUrl))
      .slice(0, SLIDE_COUNT);
  }

  const payload = await api.getTrending(type, 'day');
  const results = Array.isArray(payload?.results) ? payload.results : [];
  return results
    // `/trending/all` also returns people, which map to a Movie with no title.
    .filter((item) => item.media_type !== 'person')
    // A spotlight with no backdrop is a black rectangle.
    .filter((item) => Boolean(item.backdrop_path))
    .slice(0, SLIDE_COUNT)
    .map((item) => api.mapToInternalMovie(item));
}

/** Muted, chrome-free trailer preview. `youtube-nocookie` is CSP-allowlisted. */
function trailerSrc(key: string): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    modestbranding: '1',
    rel: '0',
    playsinline: '1',
    loop: '1',
    playlist: key,
    iv_load_policy: '3',
    disablekb: '1',
  });
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(key)}?${params.toString()}`;
}

function burstParticles(origin: DOMRect): void {
  for (let i = 0; i < 8; i += 1) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const angle = i * 45 * (Math.PI / 180);
    const distance = 40 + Math.random() * 20;
    particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
    particle.style.left = `${origin.left + origin.width / 2}px`;
    particle.style.top = `${origin.top + origin.height / 2}px`;
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 600);
  }
}

function HeroSkeleton({ label }: { label: string }) {
  return (
    <div
      className="w-full min-h-[100dvh] h-[100dvh] relative overflow-hidden bg-[#0a0a0f] border-b border-white/5 select-none"
      role="status"
      aria-label={label}
    >
      <div className="absolute inset-0 skeleton-shimmer bg-[#12131c] opacity-40">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
      </div>
      <div className="relative z-10 w-full h-full flex flex-col justify-end px-4 sm:px-8 lg:px-12 pb-24 sm:pb-32 max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-20 h-6 rounded-full skeleton-shimmer bg-white/10" />
          <div className="w-16 h-6 rounded-full skeleton-shimmer bg-white/10" />
        </div>
        <div className="w-3/4 max-w-lg h-12 sm:h-16 rounded-2xl skeleton-shimmer bg-white/15" />
        <div className="space-y-2 max-w-xl">
          <div className="w-full h-4 rounded skeleton-shimmer bg-white/5" />
          <div className="w-5/6 h-4 rounded skeleton-shimmer bg-white/5" />
        </div>
        <div className="flex items-center gap-4 pt-2">
          <div className="w-36 h-12 rounded-full skeleton-shimmer bg-brand/40" />
          <div className="w-32 h-12 rounded-full skeleton-shimmer bg-white/10" />
        </div>
      </div>
    </div>
  );
}

/**
 * Billboard spotlight.
 *
 * This is the merge of `Hero` and `HeroSpotlight`, which were 280 near-identical
 * lines apiece -- the same markup, the same carousel, the same parallax, with
 * only the fetch and one badge label differing. Every fix below had to be made
 * twice before, so in practice it was made once and the other copy drifted.
 *
 * Behaviour that changed with the merge:
 *
 * - **The play button plays.** `Watch Now` and the info button both called
 *   `onMovieSelect`, so the primary action on the page opened a details panel.
 * - **Autoplay yields.** The 7-second rotation now stops on hover, on focus,
 *   while the tab is hidden, and entirely under `prefers-reduced-motion` -- it
 *   used to keep cycling in a background tab and move the target out from under
 *   the pointer mid-click.
 * - **Parallax costs nothing.** `onMouseMove` set React state, re-rendering the
 *   whole billboard on every pointer sample. It now drives motion values.
 * - **The backdrop is a real LCP image**: `srcSet`, eager, high priority, and
 *   the next slide is prefetched so the crossfade isn't a flash of empty.
 * - **`alt` is empty.** It repeated the `<h1>`, so screen readers heard the
 *   title twice.
 * - **Failures are visible.** `HeroSpotlight` showed its skeleton forever when
 *   the fetch threw, because "no data yet" and "no data ever" were one branch.
 * - **Title logo art** is used when the catalogue publishes it, with the text
 *   heading kept for assistive tech.
 * - **A muted trailer** fades in after a beat, holding the slide while it plays.
 */
export function Hero({ type = 'all', onMovieSelect }: HeroProps) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, setAmbientColor } = useApp();
  const reduceMotion = useReducedMotion();

  const cached = heroCache.get(type);
  const fresh = cached && Date.now() - cached.at < CACHE_TTL_MS ? cached.movies : null;

  const [movies, setMovies] = useState<Movie[]>(fresh ?? []);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(fresh ? 'ready' : 'loading');
  const [index, setIndex] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);

  // Autoplay yields to the viewer and to the platform.
  const [interacting, setInteracting] = useState(false);
  const [tabHidden, setTabHidden] = useState(
    () => typeof document !== 'undefined' && document.hidden
  );

  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [trailerDismissed, setTrailerDismissed] = useState(false);

  /* Parallax through motion values: `.set()` mutates the transform directly, so
   * the pointer no longer re-renders this component (and its children) once per
   * mouse sample. */
  const parallaxX = useSpring(0, { stiffness: 50, damping: 20 });
  const parallaxY = useSpring(0, { stiffness: 50, damping: 20 });

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (reduceMotion) return;
      parallaxX.set((event.clientX / window.innerWidth - 0.5) * 15);
      parallaxY.set((event.clientY / window.innerHeight - 0.5) * 15);
    },
    [parallaxX, parallaxY, reduceMotion]
  );

  // Fetch the spotlight set.
  useEffect(() => {
    let active = true;
    const remembered = heroCache.get(type);
    if (remembered && Date.now() - remembered.at < CACHE_TTL_MS && reloadToken === 0) {
      setMovies(remembered.movies);
      setStatus('ready');
      setIndex(0);
      return;
    }

    setStatus('loading');
    loadHero(type)
      .then((results) => {
        if (!active) return;
        if (results.length === 0) {
          setStatus('error');
          return;
        }
        heroCache.set(type, { movies: results, at: Date.now() });
        setMovies(results);
        setIndex(0);
        setStatus('ready');
      })
      .catch((cause) => {
        if (!active) return;
        console.error('Hero spotlight failed to load:', cause);
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [type, reloadToken]);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const safeIndex = movies.length > 0 ? Math.min(index, movies.length - 1) : 0;
  const current = movies.length > 0 ? movies[safeIndex] : null;
  const backdrop = current?.backdropUrl ?? null;
  const trailerPlaying = Boolean(trailerKey) && !trailerDismissed && !tabHidden;

  // Ambient theme colour. Previously skipped entirely for a single-item
  // spotlight, and could resolve after unmount and paint the next page.
  useEffect(() => {
    if (!backdrop) return;
    let active = true;
    getDominantColor(backdrop)
      .then((color) => {
        if (active) setAmbientColor(color);
      })
      .catch(() => {
        if (active) setAmbientColor(null);
      });
    return () => {
      active = false;
    };
  }, [backdrop, setAmbientColor]);

  // Trailer for the visible slide, fetched lazily and reset when it changes.
  const currentId = current?.id;
  const currentType = current?.type;
  useEffect(() => {
    setTrailerKey(null);
    setTrailerDismissed(false);
    if (!currentId || !currentType || reduceMotion || tabHidden) return;
    let active = true;
    const timer = setTimeout(() => {
      api
        .getVideoTrailer(currentId, currentType)
        .then((key) => {
          if (active && key) setTrailerKey(key);
        })
        .catch(() => {
          /* No trailer is a normal outcome, not an error worth surfacing. */
        });
    }, TRAILER_DELAY_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [currentId, currentType, reduceMotion, tabHidden]);

  // Warm the next backdrop so the crossfade isn't a flash of empty frame.
  const nextBackdrop = movies.length > 1 ? movies[(safeIndex + 1) % movies.length]?.backdropUrl : null;
  useEffect(() => {
    if (!nextBackdrop) return;
    const image = new Image();
    image.src = nextBackdrop;
  }, [nextBackdrop]);

  const autoplay = movies.length > 1 && !reduceMotion && !interacting && !tabHidden;
  useEffect(() => {
    if (!autoplay) return;
    const timer = setTimeout(
      () => setIndex((previous) => (previous + 1) % movies.length),
      trailerPlaying ? TRAILER_HOLD_MS : SLIDE_MS
    );
    return () => clearTimeout(timer);
  }, [autoplay, safeIndex, movies.length, trailerPlaying]);

  const inWatchlist = current ? isInWatchlist(current.id) : false;

  const handleWatchlistToggle = (event: React.MouseEvent) => {
    if (!current) return;
    if (inWatchlist) {
      removeFromWatchlist(current.id);
      return;
    }
    addToWatchlist(current);
    // The confetti burst is decoration; reduced-motion users opted out of it.
    if (!reduceMotion) burstParticles(event.currentTarget.getBoundingClientRect());
  };

  const handlePlay = () => {
    if (!current) return;
    // This used to open the details panel -- the same thing the info button
    // does -- so the page's primary action never actually started playback.
    if (current.type === 'anime') goToWatch(current.id, 'anime', 1);
    else if (current.type === 'tv') goToWatch(current.id, 'tv', 1, 1);
    else goToWatch(current.id, 'movie');
  };

  const typeLabel = useMemo(() => {
    if (type === 'anime') return 'Anime Spotlight';
    if (type === 'tv') return 'TV Spotlight';
    if (type === 'movie') return 'Movie Spotlight';
    return current?.type === 'tv' ? 'Series' : 'Featured';
  }, [type, current?.type]);

  if (status === 'loading') return <HeroSkeleton label="Loading featured content" />;

  if (status === 'error' || !current) {
    // A failed spotlight used to sit on the shimmer forever. The page below it
    // still works, so this stays small and offers a way out.
    return (
      <div className="w-full min-h-[60vh] relative overflow-hidden bg-[#0a0a0f] border-b border-white/5 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="ambient-glow-orb -top-20 -left-20 w-[450px] h-[450px] bg-brand/20 z-0" />
        <p className="relative z-10 font-display text-xl sm:text-2xl font-bold text-foreground">
          The spotlight couldn’t load
        </p>
        <p className="relative z-10 text-sm text-muted-foreground max-w-md">
          Everything below still works. This is usually a dropped request to the
          catalogue.
        </p>
        <button
          type="button"
          onClick={() => setReloadToken((value) => value + 1)}
          className="relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div
      className="w-full min-h-[100dvh] h-[100dvh] relative overflow-hidden flex items-end select-none pb-24 sm:pb-32"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={() => setInteracting(false)}
      aria-roledescription="carousel"
      aria-label={`${typeLabel}: ${current.title}`}
    >
      {/* Dynamic Ambient Mesh Glow Orbs */}
      <div className="ambient-glow-orb -top-20 -left-20 w-[450px] h-[450px] bg-brand/30 z-0" />
      <div className="ambient-glow-orb top-1/3 right-0 w-[500px] h-[500px] bg-[#ffd066]/20 z-0" />

      {/* Backdrop. The LCP element on both the home page and every catalogue
          page, so it is eager, high priority, and width-appropriate; `alt` is
          empty because the <h1> below already names the title. */}
      <AnimatePresence initial={false}>
        <motion.div
          key={`${current.type}-${current.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0 overflow-hidden"
        >
          <motion.img
            src={current.backdropUrl ?? undefined}
            srcSet={current.backdropSrcSet}
            sizes={BACKDROP_SIZES}
            alt=""
            aria-hidden="true"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover"
            style={reduceMotion ? undefined : { x: parallaxX, y: parallaxY }}
            initial={{ scale: 1 }}
            animate={{ scale: reduceMotion ? 1 : 1.15 }}
            transition={{ duration: reduceMotion ? 0 : 8, ease: 'easeOut' }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Muted trailer preview, layered over the still it replaces. */}
      {trailerPlaying && trailerKey && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 z-[5] overflow-hidden pointer-events-none"
        >
          <iframe
            key={trailerKey}
            src={trailerSrc(trailerKey)}
            title={`${current.title} trailer`}
            allow="autoplay; encrypted-media; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.78vh] h-[56.25vw] min-w-full min-h-full border-0"
          />
        </motion.div>
      )}

      {/* Cinema Gradient Scrims & Shading */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/50 to-transparent" />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 z-10 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      {/* Floating Particles Overlay */}
      <div
        className="absolute inset-0 z-10 pointer-events-none opacity-20 mix-blend-screen"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--theme-accent) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Main Hero Content */}
      <div className="relative z-20 max-w-5xl w-full pb-24 sm:pb-28 px-4 sm:px-10 lg:px-14">
        <motion.div
          key={`content-${current.type}-${current.id}`}
          initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 mb-3 sm:mb-4">
            <span className="bg-brand/20 text-brand border border-brand/40 rounded-full px-3 py-1 text-[11px] sm:text-xs uppercase tracking-widest font-mono font-bold shadow-sm backdrop-blur-md">
              {typeLabel}
            </span>

            <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs sm:text-sm text-foreground font-bold shadow-sm">
              <Star className="w-3.5 h-3.5 text-[#ffd066] fill-[#ffd066]" aria-hidden="true" />
              <span>{formatRating(current.rating)}</span>
              <span className="text-muted-foreground text-[10px] sm:text-xs font-normal">/ 10</span>
            </div>

            <span className="bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-foreground/90 text-xs sm:text-sm font-semibold">
              {current.year || '—'}
            </span>

            {current.ageRating && (
              <span className="px-2 py-1 rounded-full border border-white/25 text-[11px] font-mono text-foreground/80">
                {current.ageRating}
              </span>
            )}

            {current.genres && current.genres.length > 0 && (
              <div className="hidden xs:flex flex-wrap items-center gap-1.5">
                {current.genres.slice(0, 2).map((genre: string) => (
                  <span
                    key={genre}
                    className="bg-white/5 backdrop-blur-md border border-white/5 rounded-full px-2.5 py-0.5 text-[11px] text-foreground/80 font-medium"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Title. Logo artwork when the catalogue publishes it, which is what
              a premium billboard shows; the heading stays for assistive tech. */}
          {current.logoUrl ? (
            <>
              <h1 className="sr-only">{current.title}</h1>
              <img
                src={current.logoUrl}
                alt=""
                aria-hidden="true"
                loading="eager"
                decoding="async"
                className="max-w-[min(90vw,34rem)] max-h-24 sm:max-h-32 lg:max-h-40 object-contain object-left mb-3 sm:mb-4 drop-shadow-2xl"
              />
            </>
          ) : (
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-display font-black text-foreground mb-3 sm:mb-4 leading-[1.08] tracking-tight drop-shadow-2xl line-clamp-2">
              {current.title}
            </h1>
          )}

          {/* Description */}
          <p className="text-xs sm:text-base lg:text-lg text-foreground/85 mb-6 sm:mb-8 line-clamp-2 sm:line-clamp-3 max-w-2xl font-normal leading-relaxed drop-shadow-md">
            {current.tagline || current.description}
          </p>

          {/* Double-Bezel Island Actions */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handlePlay}
              className="group relative flex items-center gap-3 bg-brand text-brand-foreground rounded-full pl-5 pr-2 py-2 text-xs sm:text-base font-bold shadow-[0_10px_30px_-5px_var(--theme-accent-glow,rgba(232,133,42,0.5))] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <span>Watch Now</span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/15 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" aria-hidden="true" />
              </div>
            </button>

            <button
              type="button"
              onClick={handleWatchlistToggle}
              aria-pressed={inWatchlist}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-foreground rounded-full px-5 py-3 text-xs sm:text-sm font-semibold backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md cursor-pointer"
            >
              {inWatchlist ? (
                <Check className="w-4 h-4 text-brand" aria-hidden="true" />
              ) : (
                <Plus className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{inWatchlist ? 'In Watchlist' : 'My List'}</span>
            </button>

            <button
              type="button"
              onClick={() => onMovieSelect(current.id, current.type)}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 flex items-center justify-center text-foreground backdrop-blur-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
              aria-label={`More info about ${current.title}`}
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
            </button>

            {trailerPlaying && (
              <button
                type="button"
                onClick={() => setTrailerDismissed(true)}
                className="flex items-center gap-2 bg-black/50 hover:bg-black/70 border border-white/15 text-foreground/80 rounded-full px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider backdrop-blur-xl transition-all cursor-pointer"
              >
                <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Stop preview</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Slide switcher. Now announces which slide is current, and the group is
          labelled -- it was five unlabelled thumbnails before. */}
      {movies.length > 1 && (
        <div
          role="group"
          aria-label="Choose a featured title"
          className="absolute bottom-24 sm:bottom-28 right-4 sm:right-10 z-30 hidden sm:flex items-center gap-2 bg-black/50 backdrop-blur-xl border border-white/10 p-1.5 rounded-full shadow-2xl"
        >
          {movies.map((movie, idx) => (
            <button
              key={`${movie.type}-${movie.id}`}
              type="button"
              onClick={() => setIndex(idx)}
              aria-label={`Show ${movie.title}`}
              aria-current={idx === safeIndex}
              className={cn(
                'relative rounded-full transition-all duration-300 cursor-pointer overflow-hidden flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-brand',
                idx === safeIndex
                  ? 'w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-brand shadow-lg'
                  : 'w-6 h-6 sm:w-8 sm:h-8 opacity-60 hover:opacity-100'
              )}
            >
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/20" />
              )}
              {idx === safeIndex && (
                <div className="absolute inset-0 bg-brand/20 backdrop-blur-[0.5px]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
