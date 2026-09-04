import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { Play, Plus, Check, Star, Volume2, VolumeX, ChevronDown, ThumbsUp, Film } from 'lucide-react';
import { Movie, formatRating } from '../types';
import { useApp } from '../store';
import { cn } from '../lib/utils';
import { api } from '../api';
import { PosterImage } from './PosterImage';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
  cardIndex?: number;
  totalCards?: number;
  onExpandChange?: (expanded: boolean) => void;
}

// Delays: 600ms to reveal rich preview, 4.5s of deliberate hover to start trailer video
const HOVER_EXPAND_DELAY_MS = 600;
const TRAILER_PLAY_DELAY_MS = 4500;

export function MovieCard({
  movie,
  onClick,
  cardIndex = 0,
  totalCards = 10,
  onExpandChange,
}: MovieCardProps) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, showToast } = useApp();
  const inWatchlist = isInWatchlist(movie.id);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trailerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTrailerActive, setIsTrailerActive] = useState(false);
  const [isTrailerLoading, setIsTrailerLoading] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [alignment, setAlignment] = useState<'center' | 'left' | 'right'>('center');

  // Resting 3D tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 280, damping: 22 });
  const mouseYSpring = useSpring(y, { stiffness: 280, damping: 22 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['5deg', '-5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-5deg', '5deg']);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (trailerTimerRef.current) clearTimeout(trailerTimerRef.current);
    };
  }, []);

  const isTouchPointer = () =>
    typeof window !== 'undefined' &&
    (window.matchMedia('(hover: none) or (pointer: coarse)').matches || 'ontouchstart' in window);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isExpanded || !containerRef.current || isTouchPointer()) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / rect.width - 0.5;
    const yPct = mouseY / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const startTrailerPlayback = async () => {
    setIsTrailerLoading(true);
    try {
      let key = trailerKey;
      if (!key) {
        key = await api.getVideoTrailer(movie.id, movie.type);
        if (key) {
          setTrailerKey(key);
        }
      }
      if (key) {
        setIsTrailerActive(true);
      }
    } catch {
      // Suppress trailer loading errors gracefully
    } finally {
      setIsTrailerLoading(false);
    }
  };

  const handleMouseEnter = () => {
    if (isTouchPointer()) return;
    setIsHovered(true);

    // Calculate edge proximity so expanding card never clips outside the viewport
    let align: 'center' | 'left' | 'right' = 'center';
    if (cardIndex === 0) {
      align = 'left';
    } else if (totalCards > 0 && cardIndex >= totalCards - 1) {
      align = 'right';
    } else if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const edgeThreshold = 190;
      if (rect.left < edgeThreshold) {
        align = 'left';
      } else if (window.innerWidth - rect.right < edgeThreshold) {
        align = 'right';
      }
    }
    setAlignment(align);

    // Prefetch detail route & media data immediately so navigation is instant
    api.prefetchMovieDetails(movie.type, movie.id);

    // Clear any previous lingering timers
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (trailerTimerRef.current) clearTimeout(trailerTimerRef.current);

    // 1. Expand preview card after 600ms cursor rest
    hoverTimerRef.current = setTimeout(() => {
      setIsExpanded(true);
      onExpandChange?.(true);

      // 2. Only start trailer playback if user CONTINUES hovering for 4.5 seconds
      trailerTimerRef.current = setTimeout(() => {
        void startTrailerPlayback();
      }, TRAILER_PLAY_DELAY_MS - HOVER_EXPAND_DELAY_MS);
    }, HOVER_EXPAND_DELAY_MS);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (trailerTimerRef.current) {
      clearTimeout(trailerTimerRef.current);
      trailerTimerRef.current = null;
    }
    setIsExpanded(false);
    onExpandChange?.(false);
    setIsTrailerActive(false);
    setIsTrailerLoading(false);
    setIsVideoLoaded(false);
    setIsMuted(true);
    x.set(0);
    y.set(0);
  };

  const toggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWatchlist) {
      removeFromWatchlist(movie.id);
      showToast?.('Removed from My List');
    } else {
      addToWatchlist(movie);
      showToast?.('Added to My List');
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = rect.left + rect.width / 2;
      const clickY = rect.top + rect.height / 2;

      for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const angle = (i * 45) * (Math.PI / 180);
        const distance = 30 + Math.random() * 20;
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
        particle.style.left = `${clickX}px`;
        particle.style.top = `${clickY}px`;
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 600);
      }
    }
  };

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isLiked;
    setIsLiked(next);
    showToast?.(next ? 'Rated: I like this' : 'Rating removed');
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: nextMuted ? 'mute' : 'unMute',
          args: [],
        }),
        '*'
      );
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (movie.type === 'anime') {
      window.location.hash = `#watch/ani/${movie.id}/1`;
    } else if (movie.type === 'tv') {
      window.location.hash = `#watch/tv/${movie.id}/1/1`;
    } else {
      window.location.hash = `#watch/movie/${movie.id}`;
    }
  };

  const handleManualTrailerPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (trailerTimerRef.current) {
      clearTimeout(trailerTimerRef.current);
      trailerTimerRef.current = null;
    }
    void startTrailerPlayback();
  };

  const mediaArtwork = movie.backdropUrl || movie.posterUrl;
  const matchPercentage = movie.rating
    ? Math.min(99, Math.max(75, Math.round(movie.rating * 10 + 8)))
    : 96;

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative aspect-[2/3] w-full select-none"
    >
      {/* 1. Normal Resting Portrait Card */}
      <motion.div
        onClick={onClick}
        style={{
          rotateX: isExpanded ? 0 : rotateX,
          rotateY: isExpanded ? 0 : rotateY,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          scale: isHovered && !isExpanded ? 1.04 : 1,
          y: isHovered && !isExpanded ? -6 : 0,
          opacity: isExpanded ? 0 : 1,
        }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-full cursor-pointer relative z-0"
      >
        <div className="double-bezel-card p-[1.5px] rounded-[1.25rem] transition-all duration-300 w-full h-full hover:shadow-[0_22px_50px_-10px_var(--theme-accent-glow,rgba(232,133,42,0.45))]">
          <div className="aspect-[2/3] w-full double-bezel-inner rounded-[calc(1.25rem-1.5px)] overflow-hidden relative bg-[#0b0c11]">
            {/* Specular Sheen Layer */}
            <div className="sheen-layer" />

            {/* Progressive Blur-Up Poster Image */}
            <PosterImage
              src={movie.posterUrl}
              title={movie.title}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Quality Badge (Top-Right) */}
            <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/65 backdrop-blur-md text-white/90 border border-white/15 shadow-sm">
                {movie.type === 'anime' ? 'Anime' : movie.type === 'tv' ? 'Series' : 'Ultra HD'}
              </span>
            </div>

            {/* Rating Pill (Top-Left) */}
            <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 bg-black/65 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15 shadow-sm">
              <Star className="w-3 h-3 text-[#f5a54a] fill-[#f5a54a]" />
              <span className="text-[10px] font-bold text-white font-mono">{formatRating(movie.rating)}</span>
            </div>

            {/* Hover Scrim */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#06070a]/95 via-[#06070a]/25 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5">
              <p className="text-xs sm:text-sm font-display font-extrabold truncate text-white drop-shadow-md">
                {movie.title}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/80 mt-0.5">
                <span className="text-emerald-400 font-bold">{matchPercentage}% Match</span>
                <span>•</span>
                <span>{movie.year || '—'}</span>
                <span>•</span>
                <span className="capitalize">{movie.type}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Expanded Landscape Netflix-Tier Preview Popout Card */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 6 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              transformOrigin:
                alignment === 'left'
                  ? 'left center'
                  : alignment === 'right'
                  ? 'right center'
                  : 'center center',
            }}
            className={cn(
              "absolute z-[100] top-1/2 -translate-y-1/2 w-[290px] sm:w-[340px] md:w-[370px] lg:w-[395px] rounded-2xl overflow-hidden cursor-pointer",
              "bg-[#0e0f17]/98 backdrop-blur-2xl border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.98),0_0_35px_var(--theme-accent-glow,rgba(232,133,42,0.35))]",
              alignment === 'left'
                ? 'left-0'
                : alignment === 'right'
                ? 'right-0'
                : 'left-1/2 -translate-x-1/2'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            {/* Top: 16:9 Cinematic Backdrop View or Delayed Trailer */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="relative aspect-video w-full bg-black overflow-hidden shrink-0 cursor-pointer group/video"
              title="Click to view details"
            >
              {/* High-Res Backdrop Image Base */}
              {mediaArtwork && (
                <img
                  src={mediaArtwork}
                  alt={movie.title}
                  className={cn(
                    "w-full h-full object-cover transition-all duration-700 ease-out",
                    isTrailerActive && isVideoLoaded ? "opacity-0 scale-100" : "opacity-100 scale-105"
                  )}
                />
              )}

              {/* Autoplaying Muted Looping Video Trailer ONLY after 4.5s deliberate hover */}
              {isTrailerActive && trailerKey && (
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&playsinline=1&enablejsapi=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0`}
                  title={`${movie.title} Trailer`}
                  onLoad={() => setIsVideoLoaded(true)}
                  className={cn(
                    "absolute inset-0 w-[140%] h-[140%] -top-[20%] -left-[20%] border-0 pointer-events-none transition-opacity duration-700 object-cover",
                    isVideoLoaded ? "opacity-100" : "opacity-0"
                  )}
                  allow="autoplay; encrypted-media"
                />
              )}

              {/* Gradient Scrim for seamless bottom blend */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0f17] via-[#0e0f17]/25 to-black/30 pointer-events-none" />

              {/* Top-Left Netflix-Style Match Rating Pill */}
              <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15 shadow-md">
                <span className="text-[10px] font-extrabold text-emerald-400 font-mono tracking-tight">
                  {matchPercentage}% Match
                </span>
                <span className="text-white/40 text-[9px]">•</span>
                <span className="text-[10px] font-bold text-white/90 font-mono flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 text-[#f5a54a] fill-[#f5a54a]" />
                  {formatRating(movie.rating)}
                </span>
              </div>

              {/* Top-Right Control Tray */}
              <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                {isTrailerActive && trailerKey && (
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="w-7 h-7 rounded-full bg-black/75 hover:bg-black/95 text-white/90 hover:text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-md"
                    title={isMuted ? "Unmute Trailer" : "Mute Trailer"}
                    aria-label={isMuted ? "Unmute Trailer" : "Mute Trailer"}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-brand" />}
                  </button>
                )}

                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold uppercase tracking-wider bg-black/75 backdrop-blur-md text-white/90 border border-white/15 shadow-sm">
                  {movie.type === 'anime' ? 'Anime' : movie.type === 'tv' ? 'Series' : '4K UHD'}
                </span>
              </div>

              {/* Bottom-Right Manual Preview Button (Before 4.5s auto-play kicks in) */}
              {!isTrailerActive && (
                <button
                  type="button"
                  onClick={handleManualTrailerPlay}
                  className="absolute bottom-2.5 right-2.5 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 hover:bg-black/90 text-white/90 hover:text-brand backdrop-blur-md border border-white/20 text-[10px] font-bold transition-all active:scale-95 shadow-md cursor-pointer group/btn"
                  title="Play trailer now"
                  aria-label="Play trailer preview"
                >
                  <Film className="w-3 h-3 text-brand group-hover/btn:scale-110 transition-transform" />
                  <span>{isTrailerLoading ? 'Loading...' : 'Preview'}</span>
                </button>
              )}
            </div>

            {/* Bottom: Quick Action Tray & Netflix-Grade Metadata */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="p-3.5 sm:p-4 flex flex-col gap-2.5 bg-[#0e0f17] text-foreground cursor-pointer"
            >
              {/* Quick Action Button Row */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {/* Large Netflix-style Play Button */}
                <button
                  type="button"
                  onClick={handlePlay}
                  className="flex items-center justify-center gap-2 py-1.5 px-5 rounded-full bg-white hover:bg-white/90 text-black font-extrabold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Play Now"
                  aria-label={`Play ${movie.title}`}
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  <span>Play</span>
                </button>

                {/* Watchlist Toggle */}
                <button
                  type="button"
                  onClick={toggleWatchlist}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border backdrop-blur-md transition-all active:scale-90 cursor-pointer shrink-0",
                    inWatchlist
                      ? "bg-brand/20 border-brand text-brand shadow-sm"
                      : "bg-white/10 border-white/25 text-white hover:bg-white/20 hover:border-white/50"
                  )}
                  title={inWatchlist ? "In My List" : "Add to My List"}
                  aria-label={inWatchlist ? "Remove from My List" : "Add to My List"}
                >
                  {inWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>

                {/* Like Button */}
                <button
                  type="button"
                  onClick={toggleLike}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border backdrop-blur-md transition-all active:scale-90 cursor-pointer shrink-0",
                    isLiked
                      ? "bg-white/25 border-white text-white shadow-sm"
                      : "bg-white/10 border-white/25 text-white hover:bg-white/20 hover:border-white/50"
                  )}
                  title={isLiked ? "Liked" : "Like this"}
                  aria-label="Like"
                >
                  <ThumbsUp className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
                </button>

                {/* Chevron Down Details Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-white/25 bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90 cursor-pointer shrink-0 ml-auto"
                  title="Episode & Info Details"
                  aria-label="View movie details"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Metadata Strip */}
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-display font-extrabold truncate text-white leading-tight hover:text-brand transition-colors">
                  {movie.title}
                </h3>

                <div className="flex items-center gap-2 text-[10.5px] font-mono text-white/80">
                  <span className="font-bold text-emerald-400">{matchPercentage}% Match</span>
                  <span>•</span>
                  <span className="font-semibold text-white/90">{movie.year || '—'}</span>
                  <span>•</span>
                  <span className="px-1.5 py-px rounded text-[9px] bg-white/10 text-white uppercase font-bold border border-white/20">
                    {movie.ageRating || (movie.type === 'anime' ? '16+' : 'PG-13')}
                  </span>
                  {movie.duration && (
                    <>
                      <span>•</span>
                      <span className="truncate text-white/75">{movie.duration}</span>
                    </>
                  )}
                  <span className="px-1 py-px rounded text-[8.5px] font-bold border border-white/20 text-white/80 uppercase ml-auto">
                    HDR
                  </span>
                </div>
              </div>

              {/* Genre Chips */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {movie.genres.slice(0, 4).map((genre) => (
                    <span
                      key={genre}
                      className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/8 text-white/85 border border-white/10 backdrop-blur-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Overview Synopsis */}
              {movie.description && (
                <p className="text-[11px] text-white/70 line-clamp-2 leading-relaxed font-sans">
                  {movie.description}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
