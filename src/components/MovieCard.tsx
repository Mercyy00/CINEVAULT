import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { Play, Plus, Check, Star, Volume2, VolumeX, ChevronDown } from 'lucide-react';
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

export function MovieCard({
  movie,
  onClick,
  cardIndex = 0,
  totalCards = 10,
  onExpandChange,
}: MovieCardProps) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useApp();
  const inWatchlist = isInWatchlist(movie.id);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [alignment, setAlignment] = useState<'center' | 'left' | 'right'>('center');

  // Resting 3D tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 280, damping: 22 });
  const mouseYSpring = useSpring(y, { stiffness: 280, damping: 22 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['6deg', '-6deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-6deg', '6deg']);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isExpanded || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / rect.width - 0.5;
    const yPct = mouseY / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);

    // Calculate edge proximity so expanding card never clips outside the viewport
    let align: 'center' | 'left' | 'right' = 'center';
    if (cardIndex === 0) {
      align = 'left';
    } else if (totalCards > 0 && cardIndex >= totalCards - 1) {
      align = 'right';
    } else if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const edgeThreshold = 180;
      if (rect.left < edgeThreshold) {
        align = 'left';
      } else if (window.innerWidth - rect.right < edgeThreshold) {
        align = 'right';
      }
    }
    setAlignment(align);

    // Prefetch detail route & media data immediately so click/navigation is instant
    api.prefetchMovieDetails(movie.type, movie.id);

    // Prefetch trailer immediately in background during debounce
    if (trailerKey === null) {
      api.getVideoTrailer(movie.id, movie.type).then((key) => {
        if (key) setTrailerKey(key);
      }).catch(() => {});
    }

    // 500ms debounce: only expand if cursor lingers
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setIsExpanded(true);
      onExpandChange?.(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setIsExpanded(false);
    onExpandChange?.(false);
    setIsVideoLoaded(false);
    setIsMuted(true);
    x.set(0);
    y.set(0);
  };

  const toggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWatchlist) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie);
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

  const mediaArtwork = movie.backdropUrl || movie.posterUrl;
  const matchPercentage = movie.rating ? Math.min(99, Math.round(movie.rating * 10 + 6)) : null;

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
          y: isHovered && !isExpanded ? -4 : 0,
          opacity: isExpanded ? 0 : 1,
        }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full h-full cursor-pointer relative z-0"
      >
        <div className="double-bezel-card p-[1.5px] rounded-[1.25rem] transition-all duration-300 w-full h-full hover:shadow-[0_20px_45px_-12px_var(--theme-accent-glow,rgba(232,133,42,0.4))]">
          <div className="aspect-[2/3] w-full double-bezel-inner rounded-[calc(1.25rem-1.5px)] overflow-hidden relative bg-[#0d0e12]">
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
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white/90 border border-white/10 shadow-sm">
                {movie.type === 'anime' ? 'Anime' : movie.type === 'tv' ? 'Series' : 'HD'}
              </span>
            </div>

            {/* Rating Pill (Top-Left) */}
            <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 shadow-sm">
              <Star className="w-3 h-3 text-[#f5a54a] fill-[#f5a54a]" />
              <span className="text-[10px] font-bold text-white font-mono">{formatRating(movie.rating)}</span>
            </div>

            {/* Quick hover scrim before 500ms expansion */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#06070a]/90 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
              <p className="text-xs font-display font-bold truncate text-white drop-shadow-md">
                {movie.title}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/70 mt-0.5">
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
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 6 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{
              transformOrigin:
                alignment === 'left'
                  ? 'left center'
                  : alignment === 'right'
                  ? 'right center'
                  : 'center center',
            }}
            className={cn(
              "absolute z-[100] top-1/2 -translate-y-1/2 w-[280px] sm:w-[330px] md:w-[360px] lg:w-[380px] rounded-2xl overflow-hidden cursor-pointer",
              "bg-[#0e0f16] border border-white/25 shadow-[0_30px_70px_rgba(0,0,0,0.98),0_0_40px_var(--theme-accent-glow,rgba(232,133,42,0.45))]",
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
            {/* Top: 16:9 Looping Video Trailer / Backdrop View */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="relative aspect-video w-full bg-black overflow-hidden shrink-0 cursor-pointer group/video"
              title="Click to view details"
            >
              {/* High-Res Backdrop Image base */}
              {mediaArtwork && (
                <img
                  src={mediaArtwork}
                  alt={movie.title}
                  className={cn(
                    "w-full h-full object-cover transition-opacity duration-500 scale-105",
                    trailerKey && isVideoLoaded ? "opacity-0" : "opacity-100"
                  )}
                />
              )}

              {/* Autoplaying Muted Looping Video Trailer */}
              {trailerKey && (
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&playsinline=1&enablejsapi=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0`}
                  title={`${movie.title} Trailer`}
                  onLoad={() => setIsVideoLoaded(true)}
                  className={cn(
                    "absolute inset-0 w-[140%] h-[140%] -top-[20%] -left-[20%] border-0 pointer-events-none transition-opacity duration-500 object-cover",
                    isVideoLoaded ? "opacity-100" : "opacity-0"
                  )}
                  allow="autoplay; encrypted-media"
                />
              )}

              {/* Gradient Scrim for seamless bottom blend */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0f16] via-[#0e0f16]/30 to-black/30 pointer-events-none" />

              {/* Top-Left Rating Pill */}
              <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/15 shadow-md">
                <Star className="w-3 h-3 text-[#f5a54a] fill-[#f5a54a]" />
                <span className="text-[10px] font-bold text-white font-mono">{formatRating(movie.rating)}</span>
                {matchPercentage && (
                  <span className="text-[9px] font-bold text-emerald-400 font-mono ml-0.5">
                    {matchPercentage}% Match
                  </span>
                )}
              </div>

              {/* Top-Right Control Tray (Mute Toggle & Quality) */}
              <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                {trailerKey && (
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="w-6 h-6 rounded-full bg-black/70 hover:bg-black/90 text-white/90 hover:text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform active:scale-90 cursor-pointer shadow-md"
                    title={isMuted ? "Unmute Trailer" : "Mute Trailer"}
                  >
                    {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3 text-brand" />}
                  </button>
                )}
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-white/90 border border-white/15 shadow-sm">
                  {movie.type === 'anime' ? 'Anime' : movie.type === 'tv' ? 'Series' : 'HD'}
                </span>
              </div>
            </div>

            {/* Bottom: Quick Action Tray & Comprehensive Metadata */}
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="p-3.5 sm:p-4 flex flex-col gap-2.5 bg-[#0e0f16] text-foreground cursor-pointer"
            >
              {/* Quick Action Button Row */}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={handlePlay}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-full bg-brand text-brand-foreground font-bold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Play Now"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play</span>
                </button>

                <button
                  type="button"
                  onClick={toggleWatchlist}
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center border backdrop-blur-md transition-all active:scale-90 cursor-pointer shrink-0",
                    inWatchlist
                      ? "bg-brand/20 border-brand text-brand shadow-sm"
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40"
                  )}
                  title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                >
                  {inWatchlist ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center border border-white/20 bg-white/10 hover:bg-white/20 text-white transition-all active:scale-90 cursor-pointer shrink-0 ml-auto"
                  title="View Full Details"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Title & Metadata Strip */}
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-display font-bold truncate text-white leading-tight hover:text-brand transition-colors">
                  {movie.title}
                </h3>

                <div className="flex items-center gap-2 text-[10.5px] font-mono text-white/80">
                  <span className="font-semibold text-white">{movie.year || '—'}</span>
                  <span>•</span>
                  <span className="px-1.5 py-px rounded text-[9px] bg-white/10 text-white/90 uppercase font-semibold border border-white/10">
                    {movie.ageRating || (movie.type === 'anime' ? '16+' : 'PG-13')}
                  </span>
                  {movie.duration && (
                    <>
                      <span>•</span>
                      <span className="truncate">{movie.duration}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Genre Chips */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {movie.genres.slice(0, 4).map((genre) => (
                    <span
                      key={genre}
                      className="px-2 py-0.5 rounded-full text-[9.5px] font-medium bg-white/10 text-white/90 border border-white/10 backdrop-blur-sm"
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

