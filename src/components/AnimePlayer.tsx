import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowLeft, Play, Globe, SkipForward } from 'lucide-react';
import { kitsuApi } from '../api';
import { cn } from '../lib/utils';
import { useApp } from '../store';
import { watchTrackingService } from '../services/watchTracking';
import { TRUSTED_PLAYER_ORIGINS } from '../config/servers';

export type AnimeServerId = 'vidlink' | 'megaplay' | 'anikoto' | 'vidsrc';

interface AnimeServerOption {
  id: AnimeServerId;
  name: string;
  quality: string;
  tag: string;
}

const ANIME_SERVERS: AnimeServerOption[] = [
  { id: 'vidlink', name: 'VidLink Pro (Live Sync)', quality: '1080p', tag: 'Fast • Live Progress' },
  { id: 'megaplay', name: 'MegaPlay (MAL)', quality: 'HD', tag: 'Direct MAL Streams' },
  { id: 'anikoto', name: 'Anikoto (Legacy)', quality: 'HD', tag: 'Server 13 Proxy' },
  { id: 'vidsrc', name: 'VidSrc Anime', quality: 'HD', tag: 'Multi-host Mirror' },
];

const TRUSTED_ANIME_ORIGINS = new Set([
  ...TRUSTED_PLAYER_ORIGINS,
  'https://vidlink.pro',
  'https://megaplay.buzz',
  'https://anikotoapi.site',
  'https://vidsrc.cc',
]);

interface PlaybackProgress {
  positionSeconds: number;
  durationSeconds: number | null;
  percentage: number;
}

export function AnimePlayer({ id, episode }: { id: string; episode: string; malId?: string }) {
  const { updateContinueWatching, continueWatching, userProfile } = useApp();
  const [movie, setMovie] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);

  const [jumpEpisode, setJumpEpisode] = useState<string>('');
  const [jumpError, setJumpError] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [language, setLanguage] = useState<'sub' | 'dub'>('sub');
  // Default to VidLink with real-time postMessage watch progress reporting
  const [server, setServer] = useState<AnimeServerId>('vidlink');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isServerLoading, setIsServerLoading] = useState(false);
  const [currentIframeSrc, setCurrentIframeSrc] = useState<string>('');

  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressRef = useRef<PlaybackProgress>({
    positionSeconds: 0,
    durationSeconds: null,
    percentage: 0,
  });
  
  const NEXT_EPISODE_SECONDS = 35;
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(NEXT_EPISODE_SECONDS);
  const nextEpisodeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasDismissedNextPrompt = useRef(false);

  useEffect(() => {
    hasDismissedNextPrompt.current = false;
    setShowNextEpisode(false);
    setNextCountdown(NEXT_EPISODE_SECONDS);
  }, [id, episode]);

  const updateIframeSrc = async (epNum: number, lang: 'sub' | 'dub', srv: AnimeServerId = server, malId?: string, title?: string) => {
    setIsServerLoading(true);
    setCurrentIframeSrc('about:blank');
    
    setTimeout(async () => {
      const effectiveMalId = malId && malId !== '0' ? malId : id;
      if (srv === 'vidlink') {
        setCurrentIframeSrc(`https://vidlink.pro/anime/${effectiveMalId}/${epNum}/${lang}`);
      } else if (srv === 'megaplay' && effectiveMalId) {
        setCurrentIframeSrc(`https://megaplay.buzz/stream/mal/${effectiveMalId}/${epNum}/${lang}`);
      } else if (srv === 'vidsrc') {
        setCurrentIframeSrc(`https://vidsrc.cc/v2/embed/anime/${effectiveMalId}/${epNum}/${lang}`);
      } else {
        // Anikoto fallback resolution
        try {
          const searchRes = await fetch(
            `https://anikotoapi.site/api/anime/search?keyword=${encodeURIComponent(title || movie?.title || '')}`
          );
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            const anikotoId = searchData?.results?.[0]?.id;
            if (anikotoId) {
              const seriesRes = await fetch(`https://anikotoapi.site/series/${anikotoId}`);
              if (seriesRes.ok) {
                const seriesData = await seriesRes.json();
                const ep =
                  seriesData?.episodes?.find((e: any) => e.number === epNum) ??
                  seriesData?.episodes?.[0];
                const embedId = ep?.episode_embed_id ?? ep?.id;
                if (embedId) {
                  setCurrentIframeSrc(`https://megaplay.buzz/stream/s-2/${embedId}/${lang}`);
                  setIsServerLoading(false);
                  return;
                }
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
        // Fallback to VidLink or MegaPlay
        setCurrentIframeSrc(`https://vidlink.pro/anime/${effectiveMalId}/${epNum}/${lang}`);
      }
      setIsServerLoading(false);
    }, 200);
  };

  
  useEffect(() => {
    if (movie) document.title = `CineVault | Now Playing: ${movie.title}`;
  }, [movie]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const res = await kitsuApi.getDetails(id);
        if (isMounted && res && res.data) {
          const internalMovie = kitsuApi.mapKitsuToInternal(res.data, res.included);
          setMovie(internalMovie);
          
          let episodesData: any[] = [];
          try {
             const searchRes = await fetch(`https://anikotoapi.site/api/anime/search?keyword=${encodeURIComponent(internalMovie.title)}`);
             if (searchRes.ok) {
               const searchData = await searchRes.json();
               if (searchData?.results?.length > 0) {
                 const anikotoId = searchData.results[0].id;
                 const seriesRes = await fetch(`https://anikotoapi.site/series/${anikotoId}`);
                 if (seriesRes.ok) {
                   const seriesData = await seriesRes.json();
                   if (seriesData?.episodes) {
                     episodesData = seriesData.episodes.map((ep: any) => ({
                       id: ep.id || `ep-${ep.number}`,
                       number: ep.number,
                       episode: ep.number,
                       title: ep.title || `Episode ${ep.number}`,
                       image: ep.image || '',
                       isReleased: true
                     }));
                   }
                 }
               }
             }
           } catch (e) {
             console.error("Anikoto proxy fetch failed", e);
           }
           
           if (episodesData.length === 0) {
             const count = internalMovie.episodeCount || 0;
             episodesData = Array.from({ length: count }, (_, i) => ({
               id: `ep-${i + 1}`,
               number: i + 1,
               episode: i + 1,
               title: `Episode ${i + 1}`,
               image: '',
               isReleased: true
             }));
           }
           
           setEpisodes(episodesData);

          const epNum = parseInt(episode);
          let targetEp = episodesData.find((e: any) => e.number === epNum);
          
          if (!targetEp) {
             targetEp = {
                id: `ep-${epNum}`,
                season: 1,
                episode: epNum,
                number: epNum,
                title: `Episode ${epNum}`,
                duration: '24m',
                image: '',
                description: `Episode ${epNum} of ${internalMovie.title}`
             };
          }
          
          if (targetEp) {
            setSelectedEpisode(targetEp);
            setLanguage(language);
            updateIframeSrc(targetEp.number, language, server, internalMovie.malId, internalMovie.title);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [id, episode]); // We depend on episode to reload when hash changes

  const handleEpisodeChange = (ep: any) => {
    window.location.hash = `#watch/ani/${id}/${movie?.malId || '0'}/${ep.episode}`;
  };
  
  const handleJumpEpisode = (epNumStr: string) => {
    const num = parseInt(epNumStr);
    if (num > 0 && (!movie.episodeCount || num <= movie.episodeCount)) {
      window.location.hash = `#watch/ani/${id}/${movie?.malId || '0'}/${num}`;
    } else {
      setJumpError(`Please enter a valid episode number (1 - ${movie.episodeCount || '?'})`);
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'sub' ? 'dub' : 'sub';
    if (selectedEpisode) {
      setLanguage(newLang);
      updateIframeSrc(selectedEpisode.episode, newLang, server, movie?.malId, movie?.title);
    }
  };

  const handlePointerMove = (e?: React.MouseEvent | React.TouchEvent) => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    
    let isTopZone = false;
    if (e) {
      let clientY = 0;
      if ('touches' in e && (e as React.TouchEvent).touches.length > 0) {
         clientY = (e as React.TouchEvent).touches[0].clientY;
      } else if ('clientY' in e) {
         clientY = (e as React.MouseEvent).clientY;
      }
      isTopZone = clientY < 100 || clientY < window.innerHeight * 0.15;
    }

    if (!isTopZone) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };


  // Initialize & sync progress from real watch history and postMessage telemetry
  useEffect(() => {
    if (!movie || !selectedEpisode) return;

    const defaultDuration = movie.duration ? parseInt(movie.duration) * 60 : 1440;
    let initialPosition = 0;
    let initialDuration = defaultDuration;
    let initialPercentage = 0;

    // Check existing continue watching for this anime episode
    try {
      const match = continueWatching.find((i: any) =>
        String(i.id) === String(movie.id) &&
        (i.episode_number === selectedEpisode.episode || i.episode_number === selectedEpisode.number)
      );
      if (match) {
        initialPosition = match.position_seconds || (match.progress_percentage ? Math.round((match.progress_percentage / 100) * defaultDuration) : 0);
        initialDuration = match.duration_seconds || defaultDuration;
        initialPercentage = match.progress_percentage || 0;
      }
    } catch {}

    progressRef.current = {
      positionSeconds: initialPosition,
      durationSeconds: initialDuration,
      percentage: initialPercentage,
    };

    const effectiveUid = userProfile.uid || localStorage.getItem('cv_guest_uid') || 'guest_viewer';
    const effectiveName = userProfile.name || 'Guest Viewer';

    // Initial sync write
    updateContinueWatching({
      id: movie.id,
      media_type: 'anime',
      title: movie.title,
      poster_path: movie.posterUrl || '',
      backdrop_path: movie.backdropUrl || '',
      episode_number: selectedEpisode.episode || selectedEpisode.number,
      progress_percentage: initialPercentage,
      timestamp: Date.now(),
      position_seconds: initialPosition,
      duration_seconds: initialDuration,
      mal_id: movie.malId,
    });

    watchTrackingService.logWatchProgress({
      uid: effectiveUid,
      userName: effectiveName,
      userAvatar: userProfile.avatar || null,
      mediaId: String(movie.id),
      mediaType: 'anime',
      title: movie.title,
      posterPath: movie.posterUrl || null,
      backdropPath: movie.backdropUrl || null,
      episodeNumber: selectedEpisode.episode || selectedEpisode.number,
      episodeTitle: selectedEpisode.title || `Episode ${selectedEpisode.episode || selectedEpisode.number}`,
      currentTime: initialPosition,
      duration: initialDuration,
      progressPercentage: initialPercentage,
      status: initialPercentage >= 90 ? 'completed' : 'watching',
    }, true);

    const flushProgress = () => {
      const { positionSeconds, durationSeconds, percentage } = progressRef.current;
      if (positionSeconds > 0) {
        updateContinueWatching({
          id: movie.id,
          media_type: 'anime',
          title: movie.title,
          poster_path: movie.posterUrl || '',
          backdrop_path: movie.backdropUrl || '',
          episode_number: selectedEpisode.episode || selectedEpisode.number,
          progress_percentage: percentage,
          timestamp: Date.now(),
          position_seconds: positionSeconds,
          duration_seconds: durationSeconds,
          mal_id: movie.malId,
        });

        watchTrackingService.logWatchProgress({
          uid: effectiveUid,
          userName: effectiveName,
          userAvatar: userProfile.avatar || null,
          mediaId: String(movie.id),
          mediaType: 'anime',
          title: movie.title,
          posterPath: movie.posterUrl || null,
          backdropPath: movie.backdropUrl || null,
          episodeNumber: selectedEpisode.episode || selectedEpisode.number,
          episodeTitle: selectedEpisode.title || `Episode ${selectedEpisode.episode || selectedEpisode.number}`,
          currentTime: positionSeconds,
          duration: durationSeconds || 0,
          progressPercentage: percentage,
          status: percentage >= 90 ? 'completed' : 'watching',
        }, true);
      }
    };

    window.addEventListener('beforeunload', flushProgress);
    return () => {
      window.removeEventListener('beforeunload', flushProgress);
      flushProgress();
    };
  }, [movie?.id, selectedEpisode?.episode, updateContinueWatching, userProfile.uid]);

  // PostMessage handler for live watch telemetry and auto-next prompt
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Origin verification
      if (!TRUSTED_ANIME_ORIGINS.has(event.origin)) return;

      let rawPayload = event.data;
      if (typeof rawPayload === 'string') {
        try {
          rawPayload = JSON.parse(rawPayload);
        } catch {
          return;
        }
      }
      if (!rawPayload || typeof rawPayload !== 'object') return;

      const payload = rawPayload as Record<string, any>;

      // VidLink MEDIA_DATA unwrap for anime
      let inner = payload.data && typeof payload.data === 'object' ? payload.data : payload;
      if (payload.type === 'MEDIA_DATA' && inner && typeof inner === 'object') {
        const entry =
          inner[String(id)] ??
          (movie?.malId ? inner[String(movie.malId)] : null) ??
          (selectedEpisode?.episode ? inner[String(selectedEpisode.episode)] : null) ??
          Object.values(inner)[0];
        if (entry && typeof entry === 'object') {
          inner = { ...entry, ...(entry.progress && typeof entry.progress === 'object' ? entry.progress : {}) };
        }
      }

      const claimedId = payload.tmdbId ?? payload.id ?? payload.malId ?? inner.tmdbId ?? inner.id ?? inner.malId;
      if (
        claimedId != null &&
        String(claimedId) !== String(id) &&
        String(claimedId) !== String(movie?.malId) &&
        String(claimedId) !== String(selectedEpisode?.episode)
      ) {
        return;
      }

      const watched =
        typeof inner.watched === 'number'
          ? inner.watched
          : typeof inner.currentTime === 'number'
            ? inner.currentTime
            : typeof inner.position === 'number'
              ? inner.position
              : typeof inner.time === 'number'
                ? inner.time
                : typeof payload.watched === 'number'
                  ? payload.watched
                  : typeof payload.currentTime === 'number'
                    ? payload.currentTime
                    : null;

      const duration =
        typeof inner.duration === 'number' && inner.duration > 0
          ? inner.duration
          : typeof inner.totalTime === 'number' && inner.totalTime > 0
            ? inner.totalTime
            : typeof payload.duration === 'number' && payload.duration > 0
              ? payload.duration
              : typeof payload.totalTime === 'number' && payload.totalTime > 0
                ? payload.totalTime
                : null;

      if (watched == null || watched < 0) return;

      const defaultDuration = movie?.duration ? parseInt(movie.duration) * 60 : 1440;
      const finalDuration = duration ?? progressRef.current.durationSeconds ?? defaultDuration;
      const calculatedPercentage = finalDuration > 0
        ? Math.min(100, Math.round((watched / finalDuration) * 1000) / 10)
        : 0;

      progressRef.current = {
        positionSeconds: Math.round(watched),
        durationSeconds: finalDuration ? Math.round(finalDuration) : null,
        percentage: calculatedPercentage,
      };

      const eventName = String(payload.event || payload.type || inner.event || inner.type || '');
      const isComplete =
        eventName === 'complete' ||
        eventName === 'ended' ||
        eventName === 'playback_ended' ||
        payload.ended === true ||
        inner.ended === true ||
        calculatedPercentage >= 90;

      const effectiveUid = userProfile.uid || localStorage.getItem('cv_guest_uid') || 'guest_viewer';
      const effectiveName = userProfile.name || 'Guest Viewer';

      // Update state in app store & Firestore
      if (movie && selectedEpisode) {
        updateContinueWatching({
          id: movie.id,
          media_type: 'anime',
          title: movie.title,
          poster_path: movie.posterUrl || '',
          backdrop_path: movie.backdropUrl || '',
          episode_number: selectedEpisode.episode || selectedEpisode.number,
          progress_percentage: calculatedPercentage,
          timestamp: Date.now(),
          position_seconds: Math.round(watched),
          duration_seconds: finalDuration ? Math.round(finalDuration) : null,
          mal_id: movie.malId,
        });

        watchTrackingService.logWatchProgress({
          uid: effectiveUid,
          userName: effectiveName,
          userAvatar: userProfile.avatar || null,
          mediaId: String(movie.id),
          mediaType: 'anime',
          title: movie.title,
          posterPath: movie.posterUrl || null,
          backdropPath: movie.backdropUrl || null,
          episodeNumber: selectedEpisode.episode || selectedEpisode.number,
          episodeTitle: selectedEpisode.title || `Episode ${selectedEpisode.episode || selectedEpisode.number}`,
          currentTime: Math.round(watched),
          duration: finalDuration ? Math.round(finalDuration) : 0,
          progressPercentage: calculatedPercentage,
          status: isComplete ? 'completed' : 'watching',
        }, false);
      }

      // Check for approaching end or completion to prompt next episode
      const isApproachingEnd = isComplete || (finalDuration > 0 && (finalDuration - watched) <= 75);
      const currentIndex = episodes.findIndex((e) => e.episode === selectedEpisode?.episode);
      const hasNext = currentIndex !== -1 && currentIndex < episodes.length - 1;

      if (hasNext && isApproachingEnd && !hasDismissedNextPrompt.current) {
        setShowNextEpisode(true);
        if (isComplete) setNextCountdown(NEXT_EPISODE_SECONDS);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [id, movie, selectedEpisode, episodes, updateContinueWatching, userProfile]);

  useEffect(() => {
    if (showNextEpisode && nextCountdown > 0) {
      nextEpisodeTimerRef.current = setTimeout(() => {
        setNextCountdown(prev => prev - 1);
      }, 1000);
    } else if (showNextEpisode && nextCountdown === 0) {
      // Auto play next
      const currentIndex = episodes.findIndex(e => e.episode === selectedEpisode?.episode);
      if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
        setShowNextEpisode(false);
        const nextEpNum = episodes[currentIndex + 1]?.episode || selectedEpisode.episode + 1;
window.location.hash = `#watch/ani/${id}/${movie?.malId || '0'}/${nextEpNum}`;
      }
    }
    return () => {
      if (nextEpisodeTimerRef.current) clearTimeout(nextEpisodeTimerRef.current);
    };
  }, [showNextEpisode, nextCountdown, episodes, selectedEpisode]);


  if (isLoading || !movie) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div 
      className="fixed inset-0 w-full h-full bg-black z-50 flex"
      onMouseMove={handlePointerMove}
      onTouchStart={handlePointerMove}
      onClick={() => handlePointerMove()}
    >
      {/* Top Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.15 }}
            className="absolute top-0 left-0 right-0 p-6 z-40 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-auto"
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  const current = window.location.hash;
                  window.history.back();
                  setTimeout(() => {
                    if (
                      window.location.hash === current ||
                      window.location.hash.startsWith('#watch/') ||
                      window.location.hash.startsWith('#player/')
                    ) {
                      window.location.hash = `#detail/ani/${id}`;
                    }
                  }, 100);
                }}
                aria-label="Back"
                className="w-12 h-12 rounded-full bg-card hover:bg-brand/20 flex items-center justify-center text-foreground transition-colors backdrop-blur-md border border-white/10 hover:border-brand/50 cursor-pointer"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSidebarOpen(true);
                }}
                className="w-12 h-12 rounded-full bg-card hover:bg-brand/20 flex items-center justify-center text-foreground transition-colors backdrop-blur-md border border-white/10 hover:border-brand/50 cursor-pointer"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-foreground shadow-black drop-shadow-md">{movie.title}</h1>
                {selectedEpisode && (
                  <p className="text-sm text-brand tracking-wide font-medium">Episode {selectedEpisode.episode} - {selectedEpisode.title}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(() => {
                const currentIndex = episodes.findIndex(e => e.episode === selectedEpisode?.episode);
                if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
                  const nextEpNum = episodes[currentIndex + 1]?.episode || selectedEpisode.episode + 1;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = `#watch/ani/${id}/${movie?.malId || '0'}/${nextEpNum}`;
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand/20 hover:bg-brand/30 border border-brand/40 text-xs font-bold text-brand backdrop-blur-md transition-all hover:scale-105 cursor-pointer shadow-md shadow-brand/10"
                      title={`Next: Episode ${nextEpNum}`}
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Next Episode</span>
                      <span className="sm:hidden">Next</span>
                    </button>
                  );
                }
                return null;
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Container */}
      <div className="w-full h-full relative bg-black">
        <iframe
          ref={iframeRef}
          key={`${server}-${language}-${selectedEpisode?.episode || episode}-${movie?.id}`}
          src={currentIframeSrc || undefined}
          title={movie?.title || 'Anime Player'}
          className={cn(
            "w-full h-full border-0 bg-black transition-opacity duration-300",
            isServerLoading ? "opacity-0" : "opacity-100"
          )}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setIsServerLoading(false)}
        />
        
        {/* Loading Overlay */}
        <AnimatePresence>
          {isServerLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-white/10 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-brand rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-foreground/60 text-sm mt-4 tracking-widest uppercase font-medium animate-pulse">Loading Episode...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next Episode Prompt */}
        <AnimatePresence>
          {showNextEpisode && (() => {
            const currentIndex = episodes.findIndex(e => e.episode === selectedEpisode?.episode);
            const nextEp = currentIndex !== -1 && currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;
            const nextEpNum = nextEp?.episode || (selectedEpisode?.episode ? selectedEpisode.episode + 1 : null);
            if (!nextEpNum) return null;

            return (
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="absolute bottom-24 right-4 sm:right-8 z-40 bg-card/95 backdrop-blur-2xl border border-white/15 p-4 sm:p-5 rounded-2xl shadow-2xl max-w-sm w-[calc(100vw-2rem)] sm:w-84"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-brand bg-brand/15 px-2 py-0.5 rounded-full border border-brand/30">
                    Up Next
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNextEpisode(false);
                      hasDismissedNextPrompt.current = true;
                    }}
                    className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-foreground font-bold text-sm sm:text-base line-clamp-1 mb-1">
                  Episode {nextEpNum}{nextEp?.title ? `: ${nextEp.title}` : ''}
                </h3>
                <p className="text-muted-foreground text-xs mb-3 font-mono">
                  Auto-playing in <span className="text-brand font-bold">{nextCountdown}s</span>...
                </p>

                {/* Countdown progress bar */}
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-brand transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, ((NEXT_EPISODE_SECONDS - nextCountdown) / NEXT_EPISODE_SECONDS) * 100))}%` }}
                  />
                </div>

                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowNextEpisode(false);
                      window.location.hash = `#watch/ani/${id}/${movie?.malId || '0'}/${nextEpNum}`;
                    }}
                    className="flex-1 bg-brand hover:bg-brand/90 text-background font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-brand/25 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" /> Play Now
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowNextEpisode(false);
                      hasDismissedNextPrompt.current = true;
                    }}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-foreground font-semibold rounded-xl transition-colors text-xs cursor-pointer"
                  >
                    Stay
                  </button>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* Sidebar Menu */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                 e.stopPropagation();
                 setSidebarOpen(false);
              }}
              className="absolute inset-0 bg-background/60 z-50 backdrop-blur-sm pointer-events-auto"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute top-0 left-0 bottom-0 w-[85vw] max-w-[340px] bg-card backdrop-blur-xl z-[60] border-r border-white/10 flex flex-col overflow-y-auto hide-scrollbar pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 pb-0 flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-16 h-24 rounded overflow-hidden shrink-0">
                    <img loading="lazy" src={movie.posterUrl || undefined} alt={movie.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground leading-tight mb-1">{movie.title}</h2>
                    {selectedEpisode && (
                      <p className="text-sm text-brand tracking-wide">E{selectedEpisode.episode}</p>
                    )}
                  </div>
                </div>
                <button onClick={(e) => {
                  e.stopPropagation();
                  setSidebarOpen(false);
                }} className="text-foreground/50 hover:text-foreground p-2 cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Language Toggle */}
              <div className="px-6 mt-6">
                <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex relative">
                  <div 
                    className={cn(
                      "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md bg-brand transition-all duration-300",
                      language === 'sub' ? "left-1" : "left-[calc(50%+2px)]"
                    )}
                  />
                  <button 
                    onClick={() => { if(language !== 'sub') toggleLanguage(); }}
                    className={cn(
                      "flex-1 py-2 text-sm font-bold relative z-10 transition-colors flex items-center justify-center gap-2 cursor-pointer",
                      language === 'sub' ? "text-background" : "text-foreground/70 hover:text-foreground"
                    )}
                  >
                    <Globe className="w-4 h-4" /> SUB
                  </button>
                  <button 
                    onClick={() => { if(language !== 'dub') toggleLanguage(); }}
                    className={cn(
                      "flex-1 py-2 text-sm font-bold relative z-10 transition-colors flex items-center justify-center gap-2 cursor-pointer",
                      language === 'dub' ? "text-background" : "text-foreground/70 hover:text-foreground"
                    )}
                  >
                    <Globe className="w-4 h-4" /> DUB
                  </button>
                </div>
              </div>

              {/* Server Selection */}
              <div className="px-6 mt-6">
                <h3 className="text-foreground font-bold mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-brand" /> Stream Servers
                </h3>
                <div className="flex flex-col gap-2">
                  {ANIME_SERVERS.map((srv) => (
                    <button
                      key={srv.id}
                      onClick={() => {
                        setServer(srv.id);
                        updateIframeSrc(
                          selectedEpisode?.episode || parseInt(episode) || 1,
                          language,
                          srv.id,
                          movie?.malId,
                          movie?.title
                        );
                      }}
                      className={cn(
                        "p-2.5 rounded-xl border text-sm text-left transition-all flex items-center justify-between cursor-pointer",
                        server === srv.id
                          ? "border-brand bg-brand/15 text-brand shadow-sm shadow-brand/20"
                          : "border-white/10 hover:bg-white/5 text-foreground/80"
                      )}
                    >
                      <div>
                        <div className="font-semibold text-xs sm:text-sm">{srv.name}</div>
                        <div className="text-[11px] text-muted-foreground">{srv.tag}</div>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-foreground/80">
                        {srv.quality}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Episodes Section */}
              <div className="mt-6 px-6 pb-24">
                <h3 className="text-foreground font-bold mb-4 flex items-center gap-2"><Play className="w-4 h-4 text-brand" /> Episodes</h3>
                
                <div className="mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
                  <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Jump to Episode</h4>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="number"
                      min="1"
                      max={movie.episodeCount || 9999}
                      value={jumpEpisode}
                      onChange={(e) => {
                        setJumpEpisode(e.target.value);
                        setJumpError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleJumpEpisode(jumpEpisode);
                        }
                      }}
                      placeholder={`Ep (1 - ${movie.episodeCount || '?'})`}
                      className="flex-1 min-w-[100px] bg-black/50 border border-white/10 focus:border-brand rounded-xl px-3 py-2 text-white outline-none transition-colors text-sm font-display"
                    />
                    <button
                      onClick={() => handleJumpEpisode(jumpEpisode)}
                      className="px-4 py-2 bg-brand text-background font-bold rounded-xl hover:bg-brand-light transition-all flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                  {jumpError && <p className="text-red-400 text-xs mt-2">{jumpError}</p>}
                </div>
                
                {(movie.episodeCount > 10 || movie.episodeCount === 0) && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Latest Episodes</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: Math.min(10, movie.episodeCount || 10) }, (_, i) => {
                        const epNum = movie.episodeCount ? movie.episodeCount - 9 + i : i + 1;
                        if (epNum <= 0) return null;
                        return (
                          <button
                            key={epNum}
                            onClick={() => handleJumpEpisode(epNum.toString())}
                            className={cn(
                              "px-3 py-1.5 border rounded-xl text-xs font-bold transition-all cursor-pointer",
                              selectedEpisode?.episode === epNum ? "bg-brand text-background border-brand" : "bg-black/50 hover:bg-white/10 text-white border-white/10"
                            )}
                          >
                            Ep {epNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {(movie.episodeCount && movie.episodeCount <= 100 && episodes.length > 0) && (
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {episodes.map((ep: any) => (
                      <button 
                        key={ep.id}
                        onClick={() => handleEpisodeChange(ep)}
                        className={cn(
                          "w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors group cursor-pointer",
                          selectedEpisode?.episode === ep.episode ? "bg-brand/10 border border-brand/30" : "border border-transparent hover:bg-white/5"
                        )}
                      >
                        <div className="w-16 h-12 rounded bg-background/50 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-brand/50 transition-colors relative">
                          <Play className={cn("w-5 h-5 transition-colors fill-current", selectedEpisode?.episode === ep.episode ? "text-brand" : "text-muted-foreground/50 group-hover:text-brand")} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm truncate font-medium", selectedEpisode?.episode === ep.episode ? "text-brand font-bold" : "text-foreground/80 group-hover:text-foreground")}>
                            {ep.episode}. {ep.title}
                          </p>
                          {ep.jp_title && <p className="text-xs text-muted-foreground truncate">{ep.jp_title}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--brand-rgb, 212, 168, 83), 0.5);
        }
      `}</style>
    </div>
  );
}
