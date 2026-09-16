import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowLeft, Play, Globe, SkipForward, SkipBack, AlertTriangle, ExternalLink, Maximize, Minimize } from 'lucide-react';
import { api, anilistApi } from '../api';
import { cn } from '../lib/utils';
import { useApp } from '../store';
import { watchTrackingService } from '../services/watchTracking';
import { TRUSTED_PLAYER_ORIGINS } from '../config/servers';
import { COMPLETION_THRESHOLD, isResumable } from '../lib/playback';
import { updateSeoMetadata } from '../lib/seo';
import { goToWatch, goToDetail } from '../lib/navigation';

export type AnimeServerId = 'videasy' | 'vidlink' | 'megaplay' | 'screenmirror' | 'gogoanime' | 'screenscape';

interface AnimeServerOption {
  id: AnimeServerId;
  name: string;
  quality: string;
  tag: string;
}

function formatSeconds(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = Math.floor(totalSec % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const ANIME_SERVERS: AnimeServerOption[] = [
  { id: 'megaplay', name: 'MegaPlay (Primary)', quality: '1080p', tag: 'Direct MAL • Sub/Dub' },
  { id: 'videasy', name: 'VIDEASY 4K', quality: '4K', tag: 'Direct AniList • 4K Sub/Dub' },
  { id: 'vidlink', name: 'VidLink Pro (Multi)', quality: '1080p', tag: 'Direct Sync • No Cloudflare Block' },
  { id: 'screenmirror', name: 'ScreenMirror (ModiPlay)', quality: '4K', tag: 'TMDB • Multi-Audio' },
  { id: 'gogoanime', name: 'GogoAnime (MAL)', quality: 'HD', tag: 'Direct Gogo Player' },
  { id: 'screenscape', name: 'ScreenScape 4K', quality: '4K', tag: 'TMDB • Hindi Dub • Ultra HD' },
];

const TRUSTED_ANIME_ORIGINS = new Set([
  ...TRUSTED_PLAYER_ORIGINS,
  'https://player.videasy.to',
  'https://videasy.to',
  'https://vidlink.pro',
  'https://megaplay.buzz',
  'https://rozgarlelo.modiplay.xyz',
  'https://gogoanime.me.uk',
  'https://screenscape.me',
]);

interface PlaybackProgress {
  positionSeconds: number;
  durationSeconds: number | null;
  percentage: number;
}

export function AnimePlayer({ id, episode }: { id: string; episode: string; malId?: string }) {
  const { updateContinueWatching, continueWatching, userProfile, isMobileView } = useApp();
  const [movie, setMovie] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Screen Wake Lock API to prevent mobile screens from dimming or turning off during playback
  useEffect(() => {
    let sentinel: any = null;
    let active = true;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') {
          sentinel = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // Silently ignore if unsupported or blocked
      }
    };

    requestWakeLock();

    const handleVisChange = () => {
      if (active && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisChange);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', handleVisChange);
      if (sentinel) {
        sentinel.release().catch(() => {});
        sentinel = null;
      }
    };
  }, []);

  const [jumpEpisode, setJumpEpisode] = useState<string>('');
  const [jumpError, setJumpError] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [language, setLanguage] = useState<'sub' | 'dub'>('sub');
  // Default to MegaPlay
  const [server, setServer] = useState<AnimeServerId>('megaplay');
  const [tmdbId, setTmdbId] = useState<string>('');
  const tmdbIdRef = useRef<string>('');
  const anilistIdRef = useRef<string>('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isServerLoading, setIsServerLoading] = useState(false);
  const [isServerSlow, setIsServerSlow] = useState(false);
  const [currentIframeSrc, setCurrentIframeSrc] = useState<string>('');

  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverSlowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressRef = useRef<PlaybackProgress>({
    positionSeconds: 0,
    durationSeconds: null,
    percentage: 0,
  });
  
  const NEXT_EPISODE_SECONDS = 35;
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(NEXT_EPISODE_SECONDS);
  const nextEpisodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasDismissedNextPrompt = useRef(false);

  const [restoredPosition, setRestoredPosition] = useState<number | null>(null);
  const [restartPromptDismissed, setRestartPromptDismissed] = useState(false);

  useEffect(() => {
    hasDismissedNextPrompt.current = false;
    setShowNextEpisode(false);
    setNextCountdown(NEXT_EPISODE_SECONDS);
    setRestartPromptDismissed(false);
  }, [id, episode]);

  const updateIframeSrc = async (
    epNum: number,
    lang: 'sub' | 'dub',
    srv: AnimeServerId = server,
    malId?: string,
    title?: string,
    resolvedTmdbId?: string,
    resolvedAnilistId?: string
  ) => {
    setIsServerLoading(true);
    setIsServerSlow(false);
    if (serverSlowTimerRef.current) clearTimeout(serverSlowTimerRef.current);
    serverSlowTimerRef.current = setTimeout(() => {
      setIsServerSlow(true);
    }, 7_000);
    setCurrentIframeSrc('about:blank');
    
    let currentTmdb = resolvedTmdbId || tmdbIdRef.current || tmdbId;
    if ((srv === 'screenmirror' || srv === 'screenscape') && !currentTmdb) {
      const queryTitle = title || movie?.title || '';
      if (queryTitle) {
        try {
          const tvRes = await api.searchTv(queryTitle);
          if (tvRes.results && tvRes.results.length > 0) {
            const bestTv = tvRes.results.find((item: any) => 
              item.name?.toLowerCase() === queryTitle.toLowerCase() ||
              item.original_name?.toLowerCase() === queryTitle.toLowerCase()
            ) || tvRes.results[0];
            if (bestTv?.id) {
              currentTmdb = String(bestTv.id);
              tmdbIdRef.current = currentTmdb;
              setTmdbId(currentTmdb);
            }
          }
        } catch {
          // Fallback to query below
        }
      }
    }

    setTimeout(async () => {
      const targetAnilist = resolvedAnilistId || anilistIdRef.current || movie?.anilistId || id;
      const effectiveMalId = malId && malId !== '0' ? malId : (movie?.malId || '');
      const targetTmdb = currentTmdb || tmdbIdRef.current || tmdbId;

      if (srv === 'megaplay') {
        if (effectiveMalId) {
          setCurrentIframeSrc(`https://megaplay.buzz/stream/mal/${effectiveMalId}/${epNum}/${lang}`);
        } else {
          setCurrentIframeSrc(`https://player.videasy.to/anime/${targetAnilist}/${epNum}?color=e8852a`);
        }
      } else if (srv === 'videasy') {
        const isAnimeMovie = (movie?.episodeCount === 1 && epNum === 1) || movie?.type === 'movie';
        const videasyUrl = isAnimeMovie
          ? `https://player.videasy.to/anime/${targetAnilist}?color=e8852a&nextEpisode=false&episodeSelector=false`
          : `https://player.videasy.to/anime/${targetAnilist}/${epNum}?color=e8852a&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true`;
        setCurrentIframeSrc(videasyUrl);
      } else if (srv === 'vidlink') {
        const streamId = effectiveMalId || targetAnilist || id;
        setCurrentIframeSrc(`https://vidlink.pro/anime/${streamId}/${epNum}/${lang}`);
      } else if (srv === 'gogoanime' && effectiveMalId) {
        setCurrentIframeSrc(`https://gogoanime.me.uk/newplayer.php?mal_id=${effectiveMalId}&ep=${epNum}&category=${lang}`);
      } else if (srv === 'screenmirror') {
        if (targetTmdb) {
          setCurrentIframeSrc(`https://rozgarlelo.modiplay.xyz/embed/tmdb/tv?id=${targetTmdb}&s=1&e=${epNum}`);
        } else {
          setCurrentIframeSrc(`https://player.videasy.to/anime/${targetAnilist}/${epNum}?color=e8852a`);
        }
      } else if (srv === 'screenscape') {
        if (targetTmdb) {
          setCurrentIframeSrc(`https://screenscape.me/embed?tmdb=${targetTmdb}&type=tv&s=1&e=${epNum}&lan=hindi`);
        } else {
          setCurrentIframeSrc(`https://player.videasy.to/anime/${targetAnilist}/${epNum}?color=e8852a`);
        }
      } else {
        // Safe default: VIDEASY
        setCurrentIframeSrc(`https://player.videasy.to/anime/${targetAnilist}/${epNum}?color=e8852a`);
      }
      setIsServerLoading(false);
    }, 200);
  };

  useEffect(() => {
    if (movie) {
      updateSeoMetadata({
        title: `Playing ${movie.title} (Ep. ${episode})`,
        description: `Streaming ${movie.title} episode ${episode} on CineVault.`,
        ogImage: movie.backdropUrl || movie.posterUrl || undefined,
        ogType: 'video.tv_show',
      });
    }
  }, [movie, episode]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setIsLoading(true);
      try {
        const { movie: internalMovie, raw } = await anilistApi.getDetails(id);
        if (!isMounted) return;

        setMovie(internalMovie);
        anilistIdRef.current = internalMovie.anilistId || id;
        
        const isOnePiece =
          String(id) === '21' ||
          internalMovie.title?.toLowerCase().includes('one piece');
        const actualCount = isOnePiece
          ? Math.max(internalMovie.episodeCount || 0, 1180)
          : (internalMovie.episodeCount || (raw.episodes as number) || 0);

        const fallbackImg = internalMovie.backdropUrl || internalMovie.posterUrl || '';
        const streaming = raw.streamingEpisodes || [];
        const seededMap = new Map<number, any>();
        streaming.forEach((item, idx) => {
          const match = item.title?.match(/Episode\s+(\d+)/i);
          const num = match ? parseInt(match[1], 10) : idx + 1;
          if (num > 0 && (isOnePiece || num <= actualCount)) {
            const cleanTitle = item.title
              ? item.title.replace(/^Episode\s+\d+\s*[-:—]\s*/i, '').trim() || item.title
              : `Episode ${num}`;
            seededMap.set(num, {
              id: `ep-${num}`,
              number: num,
              episode: num,
              title: cleanTitle,
              image: item.thumbnail || fallbackImg,
              isReleased: true,
              description: '',
              duration: '24m',
            });
          }
        });

        let episodesData: any[] = [];
        const totalBaseline = Math.max(actualCount, parseInt(episode) || 1);
        for (let i = 1; i <= totalBaseline; i++) {
          if (seededMap.has(i)) {
            episodesData.push(seededMap.get(i));
          } else {
            episodesData.push({
              id: `ep-${i}`,
              number: i,
              episode: i,
              title: `Episode ${i}`,
              image: fallbackImg,
              isReleased: true,
              description: '',
              duration: '24m',
            });
          }
        }

        setEpisodes(episodesData);

        const epNum = parseInt(episode) || 1;
        let targetEp = episodesData.find((e: any) => e.number === epNum) || {
          id: `ep-${epNum}`,
          season: 1,
          episode: epNum,
          number: epNum,
          title: `Episode ${epNum}`,
          duration: '24m',
          image: fallbackImg,
          description: `Episode ${epNum} of ${internalMovie.title}`
        };

        setSelectedEpisode(targetEp);
        setLanguage(language);

        let fetchedTmdb = '';
        try {
          // Priority 1: Search specifically in TMDB TV catalog for exact title match
          const tvRes = await api.searchTv(internalMovie.title);
          if (tvRes.results && tvRes.results.length > 0) {
            const bestTv = tvRes.results.find((item: any) => 
              item.name?.toLowerCase() === internalMovie.title?.toLowerCase() ||
              item.original_name?.toLowerCase() === internalMovie.title?.toLowerCase()
            ) || tvRes.results[0];
            if (bestTv?.id) {
              fetchedTmdb = String(bestTv.id);
              tmdbIdRef.current = fetchedTmdb;
              setTmdbId(fetchedTmdb);
            }
          }
          // Priority 2: Fallback to multi search if not found in TV
          if (!fetchedTmdb) {
            const multiRes = await api.searchMulti(internalMovie.title, 1);
            const bestMatch = multiRes.results?.find((item: any) => item.media_type === 'tv' || item.media_type === 'movie');
            if (bestMatch?.id) {
              fetchedTmdb = String(bestMatch.id);
              tmdbIdRef.current = fetchedTmdb;
              setTmdbId(fetchedTmdb);
            }
          }
        } catch {
          // Non-blocking fallback
        }

        // Start playback immediately!
        updateIframeSrc(
          targetEp.number,
          language,
          server,
          internalMovie.malId,
          internalMovie.title,
          fetchedTmdb,
          internalMovie.anilistId || id
        );

        setIsLoading(false);

        // Enrich episode titles and stills in the background without blocking playback
        anilistApi.getEpisodes(id, actualCount, raw).then((anilistEpisodes) => {
          if (!isMounted || !anilistEpisodes || anilistEpisodes.length === 0) return;
          const enriched = anilistEpisodes.map((ep) => ({
            id: `ep-${ep.episode}`,
            number: ep.episode,
            episode: ep.episode,
            title: ep.title || `Episode ${ep.episode}`,
            image: ep.thumbnail || fallbackImg,
            isReleased: true,
            description: ep.description || '',
            duration: ep.duration || '24m',
          }));

          if (isOnePiece && enriched.length < 1180) {
            const existingNums = new Set(enriched.map(e => e.number));
            for (let i = 1; i <= 1180; i++) {
              if (!existingNums.has(i)) {
                enriched.push({
                  id: `ep-${i}`,
                  number: i,
                  episode: i,
                  title: `Episode ${i}`,
                  image: fallbackImg,
                  isReleased: true,
                  description: '',
                  duration: '24m',
                });
              }
            }
            enriched.sort((a, b) => a.number - b.number);
          }

          setEpisodes(enriched);
          const updatedTarget = enriched.find((e: any) => e.number === epNum);
          if (updatedTarget) {
            setSelectedEpisode(updatedTarget);
          }
        }).catch(() => {});
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [id, episode]); // We depend on episode to reload when route changes

  const handleEpisodeChange = (ep: any) => {
    goToWatch(id, 'anime', undefined, ep.episode, movie?.malId || '0');
  };
  
  const handleJumpEpisode = (epNumStr: string) => {
    const num = parseInt(epNumStr);
    if (num > 0 && (!movie.episodeCount || num <= movie.episodeCount)) {
      goToWatch(id, 'anime', undefined, num, movie?.malId || '0');
    } else {
      setJumpError(`Please enter a valid episode number (1 - ${movie.episodeCount || '?'})`);
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'sub' ? 'dub' : 'sub';
    if (selectedEpisode) {
      setLanguage(newLang);
      updateIframeSrc(
        selectedEpisode.episode,
        newLang,
        server,
        movie?.malId,
        movie?.title,
        tmdbIdRef.current || tmdbId,
        anilistIdRef.current || movie?.anilistId
      );
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
        if (initialPosition > 30 && isResumable(initialPercentage)) {
          setRestoredPosition(initialPosition);
        }
      }
    } catch {
      // Ignore initial position restore errors
    }

    progressRef.current = {
      positionSeconds: initialPosition,
      durationSeconds: initialDuration,
      percentage: initialPercentage,
    };

    /* Real uid only. This read `localStorage.getItem('cv_guest_uid')` -- a key the
     * storage migration deletes -- and fell back to a shared 'guest_viewer'
     * literal, which the Firestore rules now reject because it is not the
     * caller's own uid. Guests hold a Firebase anonymous uid instead. */
    const effectiveUid = userProfile.uid;
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

    if (effectiveUid) {
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
        status: initialPercentage >= COMPLETION_THRESHOLD ? 'completed' : 'watching',
      }, true);
    }

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
          position_seconds: Math.round(positionSeconds),
          duration_seconds: durationSeconds,
          mal_id: movie.malId,
        });

        if (!effectiveUid) return;
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
          status: percentage >= COMPLETION_THRESHOLD ? 'completed' : 'watching',
        }, true);
      }
    };

    window.addEventListener('beforeunload', flushProgress);
    return () => {
      window.removeEventListener('beforeunload', flushProgress);
      flushProgress();
    };
  }, [movie?.id, selectedEpisode?.episode, updateContinueWatching, userProfile.uid]);

  const handleStartOver = () => {
    setRestoredPosition(null);
    setRestartPromptDismissed(true);
    progressRef.current = {
      positionSeconds: 0,
      durationSeconds: progressRef.current.durationSeconds,
      percentage: 0,
    };
    if (movie && selectedEpisode) {
      updateContinueWatching({
        id: movie.id,
        media_type: 'anime',
        title: movie.title,
        poster_path: movie.posterUrl || '',
        backdrop_path: movie.backdropUrl || '',
        episode_number: selectedEpisode.episode || selectedEpisode.number,
        progress_percentage: 0,
        timestamp: Date.now(),
        position_seconds: 0,
        duration_seconds: progressRef.current.durationSeconds,
        mal_id: movie.malId,
      });
      updateIframeSrc(
        selectedEpisode.episode || selectedEpisode.number,
        language,
        server,
        movie.malId,
        movie.title,
        tmdbIdRef.current || tmdbId,
        anilistIdRef.current || movie?.anilistId
      );
    }
  };

  useEffect(() => {
    if (restoredPosition && restoredPosition > 30 && !restartPromptDismissed) {
      const timer = window.setTimeout(() => {
        setRestartPromptDismissed(true);
      }, 9000);
      return () => window.clearTimeout(timer);
    }
  }, [restoredPosition, restartPromptDismissed]);

  const toggleFullscreen = useCallback(async () => {
    try {
      const rootEl = containerRef.current || iframeRef.current;
      if (!document.fullscreenElement) {
        if (rootEl?.requestFullscreen) {
          await rootEl.requestFullscreen();
        } else if ((rootEl as any)?.webkitRequestFullscreen) {
          await (rootEl as any).webkitRequestFullscreen();
        }
        try {
          if (screen.orientation && 'lock' in screen.orientation) {
            await (screen.orientation as any).lock('landscape').catch(() => {});
          }
        } catch {}
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        try {
          if (screen.orientation && 'unlock' in screen.orientation) {
            screen.orientation.unlock();
          }
        } catch {}
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs) {
        try {
          if (screen.orientation && 'unlock' in screen.orientation) {
            screen.orientation.unlock();
          }
        } catch {}
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (target?.isContentEditable) return;

      if (event.key === 's' || event.key === 'S') {
        setSidebarOpen((open) => !open);
      } else if (event.key === 'f' || event.key === 'F') {
        void toggleFullscreen();
      } else if (event.key === 'n' || event.key === 'N') {
        const currentIndex = episodes.findIndex((e) => e.episode === selectedEpisode?.episode);
        if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
          const nextEp = episodes[currentIndex + 1];
          if (nextEp) handleEpisodeChange(nextEp);
        }
      } else if (event.key === 'm' || event.key === 'M') {
        try {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'toggleMute' }),
            '*'
          );
        } catch {
          // Ignore cross-origin iframe postMessage dispatch failure
        }
      } else if (event.key === 'ArrowRight' || event.key === 'l' || event.key === 'L') {
        const nextPos = (progressRef.current.positionSeconds || 0) + 10;
        try {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ type: 'SEEK', data: nextPos }),
            '*'
          );
        } catch {
          // Ignore cross-origin iframe postMessage dispatch failure
        }
      } else if (event.key === 'ArrowLeft' || event.key === 'j' || event.key === 'J') {
        const prevPos = Math.max(0, (progressRef.current.positionSeconds || 0) - 10);
        try {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ type: 'SEEK', data: prevPos }),
            '*'
          );
        } catch {
          // Ignore cross-origin iframe postMessage dispatch failure
        }
      } else if (event.key === ' ' || event.key === 'k' || event.key === 'K') {
        event.preventDefault();
        try {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ type: 'TOGGLE_PLAY' }),
            '*'
          );
        } catch {
          // Ignore cross-origin iframe postMessage dispatch failure
        }
      } else if (event.key === 'Escape') {
        if (sidebarOpen) {
          setSidebarOpen(false);
        } else if (showNextEpisode) {
          setShowNextEpisode(false);
          hasDismissedNextPrompt.current = true;
        } else if (!restartPromptDismissed) {
          setRestartPromptDismissed(true);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [episodes, selectedEpisode, sidebarOpen, showNextEpisode, restartPromptDismissed]);

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
        String(claimedId) !== String(anilistIdRef.current) &&
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
                : typeof inner.timestamp === 'number' && inner.timestamp < 1000000
                  ? inner.timestamp
                  : typeof payload.watched === 'number'
                    ? payload.watched
                    : typeof payload.currentTime === 'number'
                      ? payload.currentTime
                      : typeof payload.timestamp === 'number' && payload.timestamp < 1000000
                        ? payload.timestamp
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
        calculatedPercentage >= COMPLETION_THRESHOLD;

      const effectiveUid = userProfile.uid;
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

        if (effectiveUid) {
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
        goToWatch(id, 'anime', undefined, nextEpNum, movie?.malId || '0');
      }
    }
    return () => {
      if (nextEpisodeTimerRef.current) clearTimeout(nextEpisodeTimerRef.current);
    };
  }, [showNextEpisode, nextCountdown, episodes, selectedEpisode]);


  if (isLoading || !movie) {
    return (
      <div
        className="min-h-screen bg-black flex flex-col justify-between p-4 sm:p-8 select-none"
        role="status"
        aria-label="Loading anime player"
      >
        {/* Top bar placeholder */}
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto pt-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full skeleton-shimmer bg-white/10" />
            <div className="h-6 w-48 rounded-lg skeleton-shimmer bg-white/10" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-8 rounded-full skeleton-shimmer bg-white/10" />
            <div className="w-9 h-9 rounded-full skeleton-shimmer bg-white/10" />
          </div>
        </div>

        {/* Center Stage Video Player Skeleton */}
        <div className="w-full max-w-7xl mx-auto my-auto aspect-video rounded-2xl skeleton-shimmer bg-[#0e0f16] border border-white/10 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center">
              <div className="w-0 h-0 border-y-8 border-y-transparent border-l-12 border-l-brand ml-1 opacity-70" />
            </div>
          </div>
        </div>

        {/* Bottom Server Bar Skeleton */}
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <div className="w-20 h-7 rounded-full skeleton-shimmer bg-white/10" />
            <div className="w-20 h-7 rounded-full skeleton-shimmer bg-white/10" />
            <div className="w-20 h-7 rounded-full skeleton-shimmer bg-white/10" />
          </div>
          <div className="w-28 h-7 rounded-full skeleton-shimmer bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "fixed inset-0 w-full h-full z-50 flex",
        isMobileView && !isFullscreen
          ? "flex-col bg-background overflow-y-auto custom-scrollbar select-none"
          : "bg-black overflow-hidden select-none"
      )}
      onMouseMove={handlePointerMove}
      onTouchStart={handlePointerMove}
      onClick={() => handlePointerMove()}
    >
      {/* Video Stage Container */}
      <div
        className={cn(
          "relative bg-black overflow-hidden select-none",
          isMobileView && !isFullscreen
            ? "w-full aspect-video shrink-0 sticky top-0 z-30 safe-top shadow-2xl"
            : "w-full h-full flex-1"
        )}
      >
        {/* Top Bar */}
        <AnimatePresence>
          {showControls && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-6 py-3 sm:py-5 bg-gradient-to-b from-background/95 via-background/40 to-transparent pointer-events-auto"
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <button 
                  onClick={() => {
                    const current = window.location.pathname;
                    window.history.back();
                    setTimeout(() => {
                      if (
                        window.location.pathname === current ||
                        window.location.pathname.startsWith('/watch/') ||
                        window.location.pathname.startsWith('/player/')
                      ) {
                        goToDetail(id, 'anime');
                      }
                    }, 100);
                  }}
                  aria-label="Back"
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-card hover:bg-brand/20 flex items-center justify-center text-foreground transition-colors backdrop-blur-md border border-white/10 hover:border-brand/50 cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSidebarOpen(true);
                  }}
                  aria-label="Open episodes and servers"
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-card hover:bg-brand/20 flex items-center justify-center text-foreground transition-colors backdrop-blur-md border border-white/10 hover:border-brand/50 cursor-pointer shrink-0"
                >
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSidebarOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-card/80 hover:bg-brand/20 border border-white/10 text-[11px] sm:text-xs font-bold text-foreground backdrop-blur-md transition-colors cursor-pointer shrink-0"
                  title="Change streaming server"
                >
                  <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand" />
                  <span className="max-w-[80px] sm:max-w-[120px] truncate">
                    {ANIME_SERVERS.find(s => s.id === server)?.name.split(' ')[0] || 'Server'}
                  </span>
                  <span className="text-[9px] sm:text-[10px] px-1 py-0.5 rounded bg-brand/20 text-brand uppercase font-mono">
                    {ANIME_SERVERS.find(s => s.id === server)?.quality || 'HD'}
                  </span>
                </button>

                {/* External Pop-out link for adblock/iframe-blocked bypass */}
                {currentIframeSrc && currentIframeSrc !== 'about:blank' && (
                  <a
                    href={currentIframeSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-card/80 hover:bg-brand/20 border border-white/10 hover:border-brand/40 text-[11px] sm:text-xs font-bold text-foreground/80 hover:text-brand backdrop-blur-md transition-all cursor-pointer shrink-0"
                    title="Open video player in external tab (bypasses adblock/iframe embedding restrictions)"
                  >
                    <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand" />
                    <span className="hidden sm:inline">Pop-out</span>
                  </a>
                )}

                {/* Prev & Next Episode Navigation */}
                {(() => {
                  const currentIndex = episodes.findIndex(e => e.episode === selectedEpisode?.episode);
                  const currentNum = selectedEpisode?.episode || parseInt(episode) || 1;
                  const prevEpNum = currentIndex > 0 ? (episodes[currentIndex - 1]?.episode || currentNum - 1) : (currentNum > 1 ? currentNum - 1 : null);
                  const nextEpNum = (currentIndex !== -1 && currentIndex < episodes.length - 1) ? (episodes[currentIndex + 1]?.episode || currentNum + 1) : (movie?.episodeCount && currentNum < movie.episodeCount ? currentNum + 1 : null);

                  return (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {prevEpNum && (
                        <button
                          type="button"
                          onClick={() => {
                            goToWatch(id, 'anime', undefined, prevEpNum, movie?.malId || '0');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full bg-card/80 hover:bg-brand/20 border border-white/10 hover:border-brand/40 text-[11px] sm:text-xs font-bold text-foreground/80 hover:text-brand backdrop-blur-md transition-all hover:scale-105 cursor-pointer shadow-md shrink-0"
                          title={`Previous: Episode ${prevEpNum}`}
                        >
                          <SkipBack className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Prev</span>
                        </button>
                      )}

                      {nextEpNum && (
                        <button
                          type="button"
                          onClick={() => {
                            goToWatch(id, 'anime', undefined, nextEpNum, movie?.malId || '0');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-brand/20 hover:bg-brand/30 border border-brand/40 text-[11px] sm:text-xs font-bold text-brand backdrop-blur-md transition-all hover:scale-105 cursor-pointer shadow-md shadow-brand/10 shrink-0"
                          title={`Next: Episode ${nextEpNum}`}
                        >
                          <SkipForward className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">Next Episode</span>
                          <span className="md:hidden">Next</span>
                        </button>
                      )}
                    </div>
                  );
                })()}

                <div className="hidden lg:block min-w-0 ml-1">
                  <h1 className="text-sm sm:text-base font-bold text-foreground drop-shadow-md truncate max-w-[200px] xl:max-w-[320px]">{movie.title}</h1>
                  {selectedEpisode && (
                    <p className="text-[10px] sm:text-xs text-brand tracking-wide font-medium truncate max-w-[200px] xl:max-w-[320px]">
                      Episode {selectedEpisode.episode}{selectedEpisode.title ? ` — ${selectedEpisode.title}` : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Top bar right side: Fullscreen toggle */}
              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-card/80 hover:bg-brand/20 flex items-center justify-center text-foreground transition-colors backdrop-blur-md border border-white/10 hover:border-brand/50 cursor-pointer shrink-0 shadow-md"
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Ambilight Theatre Glow */}
        {movie && (movie.backdropUrl || movie.posterUrl) && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none -z-10 opacity-30 filter blur-[95px] scale-110 select-none transition-opacity duration-1000"
            aria-hidden="true"
          >
            <img
              src={(movie.backdropUrl || movie.posterUrl) ?? undefined}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

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
          onLoad={() => {
            setIsServerLoading(false);
            setIsServerSlow(false);
            if (serverSlowTimerRef.current) clearTimeout(serverSlowTimerRef.current);
          }}
        />

        {/* Resumption Prompt Overlay */}
        <AnimatePresence>
          {restoredPosition &&
            restoredPosition > 30 &&
            !restartPromptDismissed && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-40 bg-card/95 backdrop-blur-xl border border-white/15 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3 max-w-[92vw]"
                role="status"
              >
                <div className="w-2 h-2 rounded-full bg-brand animate-pulse shrink-0" />
                <p className="text-xs sm:text-sm text-foreground font-medium">
                  Resumed at <span className="text-brand font-mono font-bold">{formatSeconds(restoredPosition)}</span>
                </p>
                <div className="h-3.5 w-px bg-white/20 shrink-0" />
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="text-xs font-bold text-brand hover:underline shrink-0 cursor-pointer"
                >
                  Start Over (0:00)
                </button>
                <button
                  type="button"
                  onClick={() => setRestartPromptDismissed(true)}
                  aria-label="Dismiss resumption alert"
                  className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
        </AnimatePresence>
        
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

        {/* Honest slow / blocked server warning with 1-click fallback pills */}
        <AnimatePresence>
          {isServerSlow && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] sm:max-w-2xl bg-card/95 backdrop-blur-xl border border-white/15 rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4"
              role="status"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <AlertTriangle className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {ANIME_SERVERS.find((s) => s.id === server)?.name || 'Server'}
                  </span>{' '}
                  slow or content blocked? Switch server or pop out:
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-auto shrink-0">
                {ANIME_SERVERS.filter((s) => s.id !== server).map((alt) => (
                  <button
                    key={alt.id}
                    type="button"
                    onClick={() => {
                      setServer(alt.id);
                      if (selectedEpisode) {
                        updateIframeSrc(
                          selectedEpisode.episode || selectedEpisode.number,
                          language,
                          alt.id,
                          movie?.malId,
                          movie?.title,
                          tmdbIdRef.current || tmdbId,
                          anilistIdRef.current || movie?.anilistId
                        );
                      }
                    }}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-brand/15 text-brand border border-brand/30 hover:bg-brand/25 transition-all cursor-pointer"
                    title={`Switch to ${alt.name}`}
                  >
                    {alt.name.split(' ')[0]}
                  </button>
                ))}
                {currentIframeSrc && currentIframeSrc !== 'about:blank' && (
                  <a
                    href={currentIframeSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-foreground border border-white/20 transition-all cursor-pointer flex items-center gap-1"
                    title="Open player directly in a new tab to bypass iframe blocks"
                  >
                    <ExternalLink className="w-3 h-3 text-brand" />
                    <span>Pop-out</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setIsServerSlow(false)}
                  className="text-xs text-muted-foreground hover:text-foreground px-1 py-1 cursor-pointer"
                  title="Dismiss warning"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
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
                      goToWatch(id, 'anime', undefined, nextEpNum, movie?.malId || '0');
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

      {/* Mobile Portrait Mode Info & Fast Episode Strip */}
      {isMobileView && !isFullscreen && (
        <div className="p-4 space-y-4 pb-20">
          {/* Title & metadata */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h1 className="text-lg font-bold text-foreground font-display line-clamp-1">
                {movie.title}
              </h1>
              {(movie.rating ?? 0) > 0 && (
                <span className="text-xs font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full shrink-0">
                  ★ {Number(movie.rating).toFixed(1)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              {selectedEpisode && (
                <span className="text-brand font-semibold">
                  Episode {selectedEpisode.episode}{selectedEpisode.title ? `: ${selectedEpisode.title}` : ''}
                </span>
              )}
              {movie.episodeCount && (
                <span>• {movie.episodeCount} Total Episodes</span>
              )}
              <span>• {ANIME_SERVERS.find(s => s.id === server)?.name}</span>
            </div>
          </div>

          {/* Quick action bar */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            {/* Chunky Touch-Friendly Sub/Dub Switch */}
            <div className="inline-flex bg-card p-1 rounded-xl border border-white/10 shrink-0 min-h-[44px]">
              <button
                type="button"
                onClick={() => { if (language !== 'sub') toggleLanguage(); }}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                  language === 'sub'
                    ? "bg-brand text-background shadow-md shadow-brand/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Globe className="w-3.5 h-3.5" /> SUB
              </button>
              <button
                type="button"
                onClick={() => { if (language !== 'dub') toggleLanguage(); }}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                  language === 'dub'
                    ? "bg-brand text-background shadow-md shadow-brand/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Globe className="w-3.5 h-3.5" /> DUB
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-white/10 text-xs font-semibold text-foreground shrink-0 hover:bg-brand/20 transition-colors cursor-pointer min-h-[44px]"
            >
              <Globe className="w-3.5 h-3.5 text-brand" />
              <span>Server: <strong className="text-brand">{ANIME_SERVERS.find(s => s.id === server)?.name.split(' ')[0]}</strong></span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-white/10 text-xs font-semibold text-foreground shrink-0 hover:bg-brand/20 transition-colors cursor-pointer min-h-[44px]"
            >
              <Maximize className="w-3.5 h-3.5 text-brand" />
              <span>Fullscreen</span>
            </button>

            {currentIframeSrc && currentIframeSrc !== 'about:blank' && (
              <a
                href={currentIframeSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-white/10 text-xs font-semibold text-foreground shrink-0 hover:bg-brand/20 transition-colors cursor-pointer min-h-[44px]"
                title="Pop out video into separate tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-brand" />
                <span>Pop-out</span>
              </a>
            )}
          </div>

          {/* Horizontal Episode Picker Row */}
          {episodes.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Episodes ({episodes.length})
                </span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="text-xs font-semibold text-brand hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              {/* Horizontal scrollable episode chips */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 -mx-4 px-4">
                {episodes.map((ep: any) => {
                  const isCurrent = selectedEpisode?.episode === ep.episode || selectedEpisode?.number === ep.number;
                  return (
                    <button
                      key={ep.id || ep.episode}
                      type="button"
                      onClick={() => handleEpisodeChange(ep)}
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs shrink-0 transition-all cursor-pointer border min-h-[40px]",
                        isCurrent
                          ? "bg-brand text-background font-bold border-brand shadow-lg shadow-brand/20"
                          : "bg-card border-white/10 text-foreground/80 hover:bg-white/10 hover:text-foreground"
                      )}
                    >
                      {isCurrent ? (
                        <Play className="w-3 h-3 fill-current" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                      )}
                      <span>EP {ep.episode || ep.number}</span>
                      {ep.title && !ep.title.toLowerCase().startsWith('episode') && (
                        <span className="max-w-[100px] truncate opacity-80 text-[11px] font-normal">{ep.title}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Overview */}
          {movie.description && (
            <div className="pt-2 border-t border-white/5 space-y-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Synopsis</h2>
              <p className="text-xs sm:text-sm text-muted-foreground/90 leading-relaxed line-clamp-4">
                {movie.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sidebar Menu / Bottom Sheet */}
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
              className="fixed inset-0 bg-background/60 z-[65] backdrop-blur-sm pointer-events-auto"
            />
            <motion.aside
              initial={isMobileView ? { y: '100%' } : { x: '-100%' }}
              animate={isMobileView ? { y: 0 } : { x: 0 }}
              exit={isMobileView ? { y: '100%' } : { x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className={cn(
                "bg-card/95 backdrop-blur-2xl z-[70] flex flex-col shadow-2xl overflow-hidden pointer-events-auto",
                isMobileView
                  ? "fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl border-t border-white/15 safe-bottom"
                  : "fixed top-0 left-0 bottom-0 w-[85vw] max-w-[340px] border-r border-white/10"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile drag handle */}
              {isMobileView && (
                <div className="w-12 h-1.5 rounded-full bg-white/25 mx-auto mt-3 mb-1 shrink-0 cursor-grab" aria-hidden="true" />
              )}
              <div className="p-5 pb-3 flex justify-between items-start border-b border-white/10 shrink-0">
                <div className="flex gap-4 min-w-0">
                  <div className="w-14 h-20 sm:w-16 sm:h-24 rounded-lg overflow-hidden shrink-0">
                    <img loading="lazy" src={movie.posterUrl || undefined} alt={movie.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-foreground leading-tight mb-1 line-clamp-2">{movie.title}</h2>
                    {selectedEpisode && (
                      <p className="text-xs sm:text-sm text-brand tracking-wide font-medium">E{selectedEpisode.episode}</p>
                    )}
                  </div>
                </div>
                <button onClick={(e) => {
                  e.stopPropagation();
                  setSidebarOpen(false);
                }} className="text-foreground/50 hover:text-foreground p-2 rounded-full hover:bg-white/5 cursor-pointer shrink-0">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain pb-12">
                {/* Quick Prev / Next Episode Navigation */}
                {(() => {
                  const currentIndex = episodes.findIndex(e => e.episode === selectedEpisode?.episode);
                  const currentNum = selectedEpisode?.episode || parseInt(episode) || 1;
                  const prevEpNum = currentIndex > 0 ? (episodes[currentIndex - 1]?.episode || currentNum - 1) : (currentNum > 1 ? currentNum - 1 : null);
                  const nextEpNum = (currentIndex !== -1 && currentIndex < episodes.length - 1) ? (episodes[currentIndex + 1]?.episode || currentNum + 1) : (movie?.episodeCount && currentNum < movie.episodeCount ? currentNum + 1 : null);

                  if (!prevEpNum && !nextEpNum) return null;

                  return (
                    <div className="px-6 mt-4 flex items-center gap-2">
                      {prevEpNum && (
                        <button
                          type="button"
                          onClick={() => {
                            setSidebarOpen(false);
                            goToWatch(id, 'anime', undefined, prevEpNum, movie?.malId || '0');
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-foreground/80 hover:text-foreground flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          title={`Previous Episode ${prevEpNum}`}
                        >
                          <SkipBack className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>Prev (Ep {prevEpNum})</span>
                        </button>
                      )}
                      {nextEpNum && (
                        <button
                          type="button"
                          onClick={() => {
                            setSidebarOpen(false);
                            goToWatch(id, 'anime', undefined, nextEpNum, movie?.malId || '0');
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-brand/15 hover:bg-brand/25 border border-brand/30 text-xs font-bold text-brand flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm group"
                          title={`Next Episode ${nextEpNum}`}
                        >
                          <SkipForward className="w-3.5 h-3.5 text-brand group-hover:translate-x-0.5 transition-transform" />
                          <span>Next (Ep {nextEpNum})</span>
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Chunky Sub/Dub Segmented Toggle in Drawer */}
                <div className="px-6 mt-4">
                  <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex relative min-h-[44px]">
                    <div 
                      className={cn(
                        "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-brand transition-all duration-300 shadow-md shadow-brand/25",
                        language === 'sub' ? "left-1" : "left-[calc(50%+2px)]"
                      )}
                    />
                    <button 
                      onClick={() => { if(language !== 'sub') toggleLanguage(); }}
                      className={cn(
                        "flex-1 py-2.5 text-sm font-bold relative z-10 transition-colors flex items-center justify-center gap-2 cursor-pointer",
                        language === 'sub' ? "text-background" : "text-foreground/70 hover:text-foreground"
                      )}
                    >
                      <Globe className="w-4 h-4" /> SUB
                    </button>
                    <button 
                      onClick={() => { if(language !== 'dub') toggleLanguage(); }}
                      className={cn(
                        "flex-1 py-2.5 text-sm font-bold relative z-10 transition-colors flex items-center justify-center gap-2 cursor-pointer",
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
                          movie?.title,
                          tmdbIdRef.current || tmdbId,
                          anilistIdRef.current || movie?.anilistId
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
                
                {episodes.length > 0 && (
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
                        <div className="w-16 h-12 rounded overflow-hidden bg-background/50 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-brand/50 transition-colors relative">
                          {(ep.image || ep.thumbnail || movie?.backdropUrl || movie?.posterUrl) ? (
                            <img
                              src={ep.image || ep.thumbnail || movie?.backdropUrl || movie?.posterUrl}
                              alt=""
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const target = e.currentTarget;
                                const fallback = movie?.backdropUrl || movie?.posterUrl;
                                if (fallback && target.src !== fallback) {
                                  target.src = fallback;
                                }
                              }}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Play className={cn("w-5 h-5 transition-colors fill-current", selectedEpisode?.episode === ep.episode ? "text-brand" : "text-muted-foreground/50 group-hover:text-brand")} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm truncate font-medium", selectedEpisode?.episode === ep.episode ? "text-brand font-bold" : "text-foreground/80 group-hover:text-foreground")}>
                            {ep.title && !ep.title.toLowerCase().startsWith('episode')
                              ? `${ep.episode}. ${ep.title}`
                              : ep.title || `Episode ${ep.episode}`}
                          </p>
                          {ep.description && <p className="text-xs text-muted-foreground line-clamp-1">{ep.description}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
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
