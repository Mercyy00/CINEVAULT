import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, ArrowLeft, ChevronDown, Menu, Play, Signal, SkipForward, SkipBack, X } from 'lucide-react';
import { api, type TmdbEpisode, type TmdbSeason } from '../api';
import { cn } from '../lib/utils';
import { useApp } from '../store';
import { watchTrackingService } from '../services/watchTracking';
import { PosterImage } from './PosterImage';
import {
  STREAM_SOURCES,
  TRUSTED_PLAYER_ORIGINS,
  findSource,
  type StreamSource,
} from '../config/servers';
import { formatDuration, type Movie } from '../types';
import { COMPLETION_THRESHOLD, MIN_RESUME_PERCENT } from '../lib/playback';
import { updateSeoMetadata } from '../lib/seo';
import { goToWatch, goToDetail } from '../lib/navigation';
import { StorageKeys, readString, writeString } from '../lib/storage';

/**
 * Embed player page.
 *
 * Behavioural fixes over the previous version:
 *
 * - **Progress is no longer invented.** A `setInterval` advanced the saved
 *   position by wall-clock seconds every 5 s, so leaving the tab open on a
 *   paused player marked titles as watched. Progress now only moves when a
 *   trusted embed reports it via `postMessage`.
 * - **`position_seconds` is seconds.** Two call sites wrote `Date.now()` into
 *   it, i.e. epoch milliseconds, which made every resume point garbage.
 * - **Loading state is real.** `setTimeout(…, 1000)` faked it; the iframe's
 * - **`postMessage` handlers verify the origin** before trusting a payload.
 */

/**
 * How long to wait for an embed's `load` event before offering the next source.
 *
 * Was 12 s. Twelve seconds of a black screen is indistinguishable from a broken
 * site, and these sources fail often enough that the wait was the common case
 * rather than the exception. At 4.5 s the failover is offered while the viewer is
 * still expecting something to happen.
 */
const EMBED_TIMEOUT_MS = 4_000;
const CONTROLS_HIDE_MS = 3_000;
const NEXT_EPISODE_SECONDS = 15;
const TOP_ZONE_RATIO = 0.15;

const serverProbeCache = new Map<string, { reachable: boolean; latencyMs: number }>();

type EmbedState = 'idle' | 'loading' | 'ready' | 'slow';

interface PlayerPageProps {
  type: 'movie' | 'tv';
  id: string;
  season?: string;
  episode?: string;
}

interface PlaybackProgress {
  positionSeconds: number;
  durationSeconds: number | null;
  percentage: number;
}

export function PlayerPage({ type, id, season, episode }: PlayerPageProps) {
  const { updateContinueWatching, continueWatching, userProfile } = useApp();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [serversOpen, setServersOpen] = useState(true);
  const [rankedSources, setRankedSources] = useState<StreamSource[]>(STREAM_SOURCES);
  const [failedSources, setFailedSources] = useState<Set<string>>(new Set());
  const [source, setSource] = useState<StreamSource>(() => {
    const pref = readString(StorageKeys.preferredServer, '');
    return findSource(pref) ?? findSource('vidlink') ?? STREAM_SOURCES[0];
  });
  const [embedState, setEmbedState] = useState<EmbedState>('idle');
  const [retryToken, setRetryToken] = useState(0);
  const [, setProbeUpdates] = useState(0);

  useEffect(() => {
    let active = true;
    const pref = readString(StorageKeys.preferredServer, '');
    
    setRankedSources(prev => [...prev].sort((a, b) => {
      if (a.id === pref && b.id !== pref) return -1;
      if (b.id === pref && a.id !== pref) return 1;
      return 0;
    }));

    const probeAll = async () => {
      const promises = STREAM_SOURCES.map(async (s) => {
        if (serverProbeCache.has(s.id)) return;
        try {
          const start = performance.now();
          const url = new URL(s.buildUrl({ id: 'probe' }));
          await fetch(url.origin, { method: 'HEAD', mode: 'no-cors', signal: AbortSignal.timeout(3000) });
          serverProbeCache.set(s.id, { reachable: true, latencyMs: Math.round(performance.now() - start) });
        } catch {
          serverProbeCache.set(s.id, { reachable: false, latencyMs: 0 });
        }
        if (active) setProbeUpdates(u => u + 1);
      });
      await Promise.all(promises);
      if (active) {
        setRankedSources(prev => [...prev].sort((a, b) => {
          if (a.id === pref && b.id !== pref) return -1;
          if (b.id === pref && a.id !== pref) return 1;
          const probeA = serverProbeCache.get(a.id);
          const probeB = serverProbeCache.get(b.id);
          if (probeA?.reachable && !probeB?.reachable) return -1;
          if (probeB?.reachable && !probeA?.reachable) return 1;
          if (probeA?.reachable && probeB?.reachable) {
            return (probeA.latencyMs || 0) - (probeB.latencyMs || 0);
          }
          return 0;
        }));
      }
    };
    probeAll();
    
    return () => { active = false; };
  }, []);

  const [seasons, setSeasons] = useState<TmdbSeason[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<TmdbEpisode[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<TmdbEpisode | null>(null);
  const [imdbId, setImdbId] = useState('');

  const [showControls, setShowControls] = useState(true);
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(NEXT_EPISODE_SECONDS);
  const hasDismissedNextPrompt = useRef(false);

  const [restartPromptDismissed, setRestartPromptDismissed] = useState(false);
  const [forceStartFromBeginning, setForceStartFromBeginning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeout = useRef<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressRef = useRef<PlaybackProgress>({
    positionSeconds: 0,
    durationSeconds: null,
    percentage: 0,
  });

  const episodeNumber = type === 'tv' ? selectedEpisode?.episode_number : undefined;
  const seasonNumber = type === 'tv' ? selectedSeason : undefined;

  const nextEpisode = useMemo(() => {
    if (type !== 'tv' || !selectedEpisode) return null;
    const index = episodes.findIndex((entry) => entry.id === selectedEpisode.id);
    return index >= 0 ? (episodes[index + 1] ?? null) : null;
  }, [type, episodes, selectedEpisode]);

  const prevEpisode = useMemo(() => {
    if (type !== 'tv' || !selectedEpisode) return null;
    const index = episodes.findIndex((entry) => entry.id === selectedEpisode.id);
    return index > 0 ? (episodes[index - 1] ?? null) : null;
  }, [type, episodes, selectedEpisode]);

  const nextEpisodeRef = useRef(nextEpisode);
  useEffect(() => {
    nextEpisodeRef.current = nextEpisode;
  }, [nextEpisode]);

  useEffect(() => {
    hasDismissedNextPrompt.current = false;
    setShowNextEpisode(false);
    setNextCountdown(NEXT_EPISODE_SECONDS);
    setRestartPromptDismissed(false);
    setForceStartFromBeginning(false);
  }, [selectedEpisode?.id, selectedSeason, id]);

  /* ---------------------------------------------------------------------- */
  /* Details                                                                */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(null);

    (async () => {
      try {
        const details = await api.getDetails(type, id);
        if (!active) return;
        setMovie(api.mapToInternalMovie({ ...details, media_type: type }));

        let resolvedImdb = details.external_ids?.imdb_id || details.imdb_id || '';
        if (!resolvedImdb) {
          const external = await api.getExternalIds(type, id);
          resolvedImdb = external.imdb_id ?? '';
        }
        if (!active) return;
        setImdbId(resolvedImdb);

        if (type === 'tv') {
          const realSeasons = (details.seasons ?? []).filter((entry) => entry.season_number > 0);
          setSeasons(realSeasons);
        }
      } catch (cause) {
        if (!active) return;
        console.error('Player details failed:', cause);
        setLoadError(cause instanceof Error ? cause.message : 'Could not load this title.');
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [type, id]);

  /* The URL is the single source of truth for which episode is playing. This
   * used to be duplicated: a hash listener *and* an in-effect branch that
   * compared the previous state, which drifted apart on back/forward. */
  const requestedSeason = season ? Number.parseInt(season, 10) : null;
  const requestedEpisode = episode ? Number.parseInt(episode, 10) : null;

  useEffect(() => {
    if (type !== 'tv') return;
    const fallback = seasons[0]?.season_number ?? 1;
    const target = Number.isFinite(requestedSeason) && requestedSeason ? requestedSeason : fallback;

    let active = true;
    setSelectedSeason(target);

    api
      .getSeasonDetails(id, target)
      .then((data) => {
        if (!active) return;
        const list = data.episodes ?? [];
        setEpisodes(list);
        const wanted =
          list.find((entry) => entry.episode_number === requestedEpisode) ?? list[0] ?? null;
        setSelectedEpisode(wanted);
      })
      .catch((cause) => {
        if (!active) return;
        console.error('Season load failed:', cause);
        setEpisodes([]);
        setSelectedEpisode(null);
      });

    return () => {
      active = false;
    };
  }, [type, id, requestedSeason, requestedEpisode, seasons]);

  useEffect(() => {
    if (!movie) return;
    updateSeoMetadata({
      title: `Watching ${movie.title}`,
      description: `Streaming ${movie.title} in high definition on CineVault.`,
      ogImage: movie.backdropUrl || movie.posterUrl || undefined,
      ogType: 'video.other',
    });
  }, [movie]);

  /* ---------------------------------------------------------------------- */
  /* Progress & Restored Position                                           */
  /* ---------------------------------------------------------------------- */

  const runtimeSeconds = movie?.runtime ? movie.runtime * 60 : null;

  /** Restore the last known position for this exact media/season/episode. */
  const restored = useMemo(() => {
    if (!movie) return null;
    return (
      continueWatching.find(
        (entry) =>
          entry.id === String(movie.id) &&
          (entry.season_number ?? undefined) === seasonNumber &&
          (entry.episode_number ?? undefined) === episodeNumber
      ) ?? null
    );
    // Only re-read when the identity of what's playing changes, not on every
    // continue-watching write (which this component causes).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie?.id, seasonNumber, episodeNumber]);

  useEffect(() => {
    progressRef.current = {
      positionSeconds: restored?.position_seconds ?? 0,
      durationSeconds: restored?.duration_seconds ?? runtimeSeconds,
      percentage: restored?.progress_percentage ?? 0,
    };
  }, [restored, runtimeSeconds]);

  /* ---------------------------------------------------------------------- */
  /* Embed URL                                                              */
  /* ---------------------------------------------------------------------- */

  const resolvedImdbId = imdbId || movie?.imdbId || '';
  const missingImdbId = Boolean(source.requiresImdbId) && !resolvedImdbId;
  const effectiveProgress = forceStartFromBeginning ? undefined : (restored?.position_seconds || undefined);

  const embedSrc = useMemo(() => {
    if (!movie || missingImdbId) return '';
    if (type === 'tv' && !episodeNumber) return '';
    return source.buildUrl({
      id,
      season: seasonNumber,
      episode: episodeNumber,
      imdbId: resolvedImdbId || undefined,
      progress: effectiveProgress,
    });
    // `retryToken` intentionally participates so "Try again" remounts the frame.
  }, [movie, missingImdbId, type, source, id, seasonNumber, episodeNumber, resolvedImdbId, effectiveProgress]);

  const [failoverMessage, setFailoverMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!embedSrc) {
      setEmbedState('idle');
      return;
    }
    setEmbedState('loading');
    const timer = window.setTimeout(() => {
      setEmbedState((state) => {
        if (state === 'loading') {
          setFailedSources(prev => new Set([...prev, source.id]));
          return 'slow';
        }
        return state;
      });
    }, EMBED_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [embedSrc, retryToken, source.id]);

  useEffect(() => {
    if (embedState === 'slow') {
      const nextSource = rankedSources.find(s => !failedSources.has(s.id) && s.id !== source.id && s.status !== 'maintenance');
      if (nextSource) {
        setFailoverMessage(`Source unavailable — trying ${nextSource.name}…`);
        setSource(nextSource);
      } else {
        setFailoverMessage('All sources failed. Please try again later.');
      }
    }
  }, [embedState, failedSources, rankedSources, source.id]);

  useEffect(() => {
    if (embedState === 'ready') {
      setFailoverMessage(null);
      writeString(StorageKeys.preferredServer, source.id);
    }
  }, [embedState, source.id]);

  const handleStartOver = useCallback(() => {
    setForceStartFromBeginning(true);
    setRestartPromptDismissed(true);
    progressRef.current = {
      positionSeconds: 0,
      durationSeconds: runtimeSeconds,
      percentage: 0,
    };
    persistRef.current(progressRef.current, true);
    setRetryToken((val) => val + 1);
  }, [runtimeSeconds]);

  useEffect(() => {
    if (restored && (restored.progress_percentage || 0) >= MIN_RESUME_PERCENT && !restartPromptDismissed && !forceStartFromBeginning) {
      const timer = window.setTimeout(() => {
        setRestartPromptDismissed(true);
      }, 10000);
      return () => window.clearTimeout(timer);
    }
  }, [restored, restartPromptDismissed, forceStartFromBeginning]);

  const persist = useCallback(
    (progress: PlaybackProgress, flush: boolean) => {
      if (!movie) return;
      const percentage = Math.min(100, Math.max(0, progress.percentage));

      updateContinueWatching({
        id: String(movie.id),
        media_type: type,
        title: movie.title,
        poster_path: movie.posterUrl,
        backdrop_path: movie.backdropUrl,
        season_number: seasonNumber,
        episode_number: episodeNumber,
        progress_percentage: percentage,
        timestamp: Date.now(),
        position_seconds: Math.max(0, Math.round(progress.positionSeconds)),
        duration_seconds: progress.durationSeconds,
      });

      /* No fabricated identity. Every guest previously shared the literal
       * 'guest_viewer' uid, so all of their sessions collided into one set of
       * documents -- and the current Firestore rules reject a `watch_sessions`
       * write whose `uid` is not the caller's own, so it would be denied anyway.
       * Guests now hold a real Firebase anonymous uid; when there is none at all
       * (Firebase unconfigured) there is nothing to attribute, so skip. */
      if (!userProfile.uid) return;
      const effectiveName = userProfile.name || (userProfile.isLoggedIn ? 'User' : 'Guest Viewer');

      void watchTrackingService.logWatchProgress(
        {
          uid: userProfile.uid,
          userName: effectiveName,
          userAvatar: userProfile.avatar ?? null,
          mediaId: String(movie.id),
          mediaType: type,
          title: movie.title,
          posterPath: movie.posterUrl,
          backdropPath: movie.backdropUrl,
          seasonNumber,
          episodeNumber,
          episodeTitle: selectedEpisode?.name,
          currentTime: Math.max(0, Math.round(progress.positionSeconds)),
          // 0 means "unknown". The previous code substituted 7200 seconds for
          // anything without a runtime, so every unrated title claimed to be
          // exactly two hours long.
          duration: progress.durationSeconds ?? 0,
          progressPercentage: percentage,
          status: percentage >= COMPLETION_THRESHOLD ? 'completed' : 'watching',
        },
        flush
      );
    },
    [
      movie,
      type,
      seasonNumber,
      episodeNumber,
      selectedEpisode?.name,
      updateContinueWatching,
      userProfile.uid,
      userProfile.name,
      userProfile.avatar,
      userProfile.isLoggedIn,
    ]
  );

  const persistRef = useRef(persist);
  useEffect(() => {
    persistRef.current = persist;
  }, [persist]);

  /* One write when playback opens (so the title lands in Continue Watching at
   * its restored position), one on leave. No wall-clock simulation between. */
  useEffect(() => {
    if (!movie) return;
    if (type === 'tv' && !episodeNumber) return;

    persistRef.current(progressRef.current, true);

    const flushNow = () => persistRef.current(progressRef.current, true);
    window.addEventListener('pagehide', flushNow);
    return () => {
      window.removeEventListener('pagehide', flushNow);
      flushNow();
    };
  }, [movie, type, episodeNumber, seasonNumber]);

  /* ---------------------------------------------------------------------- */
  /* Trusted embed messages                                                 */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!movie) return;

    const onMessage = (event: MessageEvent) => {
      // Origin check first: any page can postMessage into this window
      if (!TRUSTED_PLAYER_ORIGINS.has(event.origin)) return;

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

      // VidLink's `MEDIA_DATA` event nests progress under the media's own id
      // rather than sending flat fields: `{ type: 'MEDIA_DATA', data: { "<id>":
      // { progress: { watched, duration } } } }`. Unwrap that one extra level
      // so the generic watched/duration parsing below can find it, same as it
      // would for a flat `PLAYER_EVENT` payload.
      let inner = payload.data && typeof payload.data === 'object' ? payload.data : payload;
      if (payload.type === 'MEDIA_DATA' && inner && typeof inner === 'object') {
        const entry = inner[String(id)];
        if (entry && typeof entry === 'object') {
          inner = { ...entry, ...(entry.progress && typeof entry.progress === 'object' ? entry.progress : {}) };
        }
      }

      const claimedId = payload.tmdbId ?? payload.id ?? inner.tmdbId ?? inner.id;
      if (claimedId != null && String(claimedId) !== String(id)) return;

      const watched =
        typeof inner.watched === 'number'
          ? inner.watched
          : typeof inner.currentTime === 'number'
            ? inner.currentTime
            : typeof inner.position === 'number'
              ? inner.position
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

      let percentage: number | null = null;
      if (typeof inner.progress === 'number') {
        percentage = inner.progress <= 1 && inner.progress > 0 ? inner.progress * 100 : inner.progress;
      } else if (typeof inner.percentage === 'number') {
        percentage = inner.percentage;
      } else if (typeof payload.progress === 'number') {
        percentage = payload.progress <= 1 && payload.progress > 0 ? payload.progress * 100 : payload.progress;
      } else if (typeof payload.percentage === 'number') {
        percentage = payload.percentage;
      } else if (watched !== null && duration !== null && duration > 0) {
        percentage = (watched / duration) * 100;
      }

      if (percentage !== null || watched !== null) {
        const knownDuration = duration ?? progressRef.current.durationSeconds;
        let clamped = percentage !== null ? Math.min(100, Math.max(0, percentage)) : 0;
        const position =
          watched !== null
            ? Math.max(0, Math.round(watched))
            : knownDuration !== null
              ? Math.round((clamped / 100) * knownDuration)
              : 0;

        if (percentage === null && knownDuration !== null && knownDuration > 0) {
          clamped = Math.min(100, Math.max(0, (position / knownDuration) * 100));
        }

        progressRef.current = {
          positionSeconds: position,
          durationSeconds: knownDuration,
          percentage: clamped,
        };
        persistRef.current(progressRef.current, clamped >= COMPLETION_THRESHOLD);
      }

      const eventName = String(payload.event || payload.type || inner.event || inner.type || '');
      const isEnded =
        eventName === 'ended' ||
        eventName === 'playback_ended' ||
        eventName === 'onEnded' ||
        payload.ended === true ||
        inner.ended === true;

      const isApproachingEnd =
        (percentage !== null && percentage >= 90) ||
        (duration !== null && watched !== null && duration > 0 && duration - watched <= 75);

      if (isEnded) {
        progressRef.current = { ...progressRef.current, percentage: 100 };
        persistRef.current(progressRef.current, true);
        if (type === 'tv' && userProfile.autoPlayNext && nextEpisodeRef.current) {
          setShowNextEpisode(true);
          setNextCountdown(NEXT_EPISODE_SECONDS);
        }
      } else if (isApproachingEnd && type === 'tv' && nextEpisodeRef.current && !hasDismissedNextPrompt.current) {
        setShowNextEpisode(true);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [movie, id, type, userProfile.autoPlayNext]);

  /* ---------------------------------------------------------------------- */
  /* Navigation                                                             */
  /* ---------------------------------------------------------------------- */

  const goToEpisode = useCallback(
    (target: TmdbEpisode) => {
      setShowNextEpisode(false);
      goToWatch(id, 'tv', selectedSeason, target.episode_number);
    },
    [id, selectedSeason]
  );

  useEffect(() => {
    if (!showNextEpisode) return;
    if (nextCountdown <= 0) {
      setShowNextEpisode(false);
      if (nextEpisode) goToEpisode(nextEpisode);
      return;
    }
    const timer = window.setTimeout(() => setNextCountdown((value) => value - 1), 1_000);
    return () => window.clearTimeout(timer);
  }, [showNextEpisode, nextCountdown, nextEpisode, goToEpisode]);

  const handleSourceChange = (next: StreamSource) => {
    if (next.status === 'maintenance') return;
    setSource(next);
  };

  /* ---------------------------------------------------------------------- */
  /* Controls auto-hide                                                     */
  /* ---------------------------------------------------------------------- */

  const revealControls = useCallback((clientY?: number) => {
    setShowControls(true);
    if (controlsTimeout.current !== null) window.clearTimeout(controlsTimeout.current);
    // Keep the bar up while the pointer is in the top strip, where it lives.
    const inTopZone = clientY !== undefined && clientY < window.innerHeight * TOP_ZONE_RATIO;
    if (inTopZone) return;
    controlsTimeout.current = window.setTimeout(() => setShowControls(false), CONTROLS_HIDE_MS);
  }, []);

  useEffect(
    () => () => {
      if (controlsTimeout.current !== null) window.clearTimeout(controlsTimeout.current);
    },
    []
  );

  const handleMouseMove = (event: React.MouseEvent) => revealControls(event.clientY);
  const handleTouchStart = (event: React.TouchEvent) =>
    revealControls(event.touches[0]?.clientY);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (target?.isContentEditable) return;

      if (event.key === 's' || event.key === 'S') {
        setSidebarOpen((open) => !open);
      } else if (event.key === 'f' || event.key === 'F') {
        const rootEl = containerRef.current || iframeRef.current;
        if (!rootEl) return;
        if (document.fullscreenElement) {
          void document.exitFullscreen();
        } else {
          rootEl.requestFullscreen().catch(() => {
            iframeRef.current?.requestFullscreen().catch((cause) => console.error('Fullscreen denied:', cause));
          });
        }
      } else if ((event.key === 'n' || event.key === 'N') && nextEpisode) {
        goToEpisode(nextEpisode);
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
  }, [nextEpisode, goToEpisode, sidebarOpen, showNextEpisode, restartPromptDismissed]);

  useEffect(() => {
    if (!showNextEpisode) return;
    const handleInteraction = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target?.closest?.('.next-episode-card')) return;
      
      setShowNextEpisode(false);
      hasDismissedNextPrompt.current = true;
    };
    
    // Use capture phase to ensure it catches before bubbling is stopped
    window.addEventListener('click', handleInteraction, true);
    window.addEventListener('wheel', handleInteraction, true);
    window.addEventListener('touchstart', handleInteraction, true);
    
    return () => {
      window.removeEventListener('click', handleInteraction, true);
      window.removeEventListener('wheel', handleInteraction, true);
      window.removeEventListener('touchstart', handleInteraction, true);
    };
  }, [showNextEpisode]);

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-black flex flex-col justify-between p-4 sm:p-8 select-none"
        role="status"
        aria-label="Loading player"
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

  if (loadError || !movie) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertTriangle className="w-10 h-10 text-brand" aria-hidden="true" />
        <p className="text-foreground text-lg font-display">This title could not be loaded.</p>
        <p className="text-muted-foreground text-sm max-w-md">{loadError}</p>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2 rounded-full bg-white/5 border border-white/10 text-foreground hover:bg-white/10 transition-colors"
        >
          Go back
        </button>
      </div>
    );
  }

  const overlayVisible = embedState === 'loading' || !embedSrc;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full bg-black z-50 flex"
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
    >
      {/* Top bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.15 }}
            className="absolute top-0 left-0 right-0 p-4 sm:p-6 z-40 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-none"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  const current = window.location.pathname;
                  window.history.back();
                  setTimeout(() => {
                    if (
                      window.location.pathname === current ||
                      window.location.pathname.startsWith('/watch/') ||
                      window.location.pathname.startsWith('/player/')
                    ) {
                      goToDetail(id, type);
                    }
                  }, 100);
                }}
                aria-label="Back"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-card hover:bg-brand/20 flex items-center justify-center text-foreground transition-colors backdrop-blur-md border border-white/10 hover:border-brand/50 cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open episodes and sources"
                aria-expanded={sidebarOpen}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-card hover:bg-brand/20 flex items-center justify-center text-foreground transition-colors backdrop-blur-md border border-white/10 hover:border-brand/50 cursor-pointer shrink-0"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-card/80 hover:bg-brand/20 border border-white/10 text-[11px] sm:text-xs font-bold text-foreground backdrop-blur-md transition-colors cursor-pointer shrink-0"
                title="Change server source"
              >
                <Signal className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand" aria-hidden="true" />
                <span className="max-w-[75px] sm:max-w-[120px] truncate">{source.name}</span>
                {source.quality && (
                  <span className="text-[9px] sm:text-[10px] px-1 py-0.5 rounded bg-brand/20 text-brand uppercase font-mono">
                    {source.quality}
                  </span>
                )}
              </button>

              {type === 'tv' && prevEpisode && (
                <button
                  type="button"
                  onClick={() => goToEpisode(prevEpisode)}
                  className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full bg-card/80 hover:bg-brand/20 border border-white/10 hover:border-brand/40 text-[11px] sm:text-xs font-bold text-foreground/80 hover:text-brand backdrop-blur-md transition-all hover:scale-105 cursor-pointer shadow-md shrink-0"
                  title={`Previous: S${selectedSeason} E${prevEpisode.episode_number}`}
                >
                  <SkipBack className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
                  <span className="hidden md:inline">Prev</span>
                </button>
              )}

              {type === 'tv' && nextEpisode && (
                <button
                  type="button"
                  onClick={() => goToEpisode(nextEpisode)}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-brand/20 hover:bg-brand/30 border border-brand/40 text-[11px] sm:text-xs font-bold text-brand backdrop-blur-md transition-all hover:scale-105 cursor-pointer shadow-md shadow-brand/10 shrink-0"
                  title={`Next: S${selectedSeason} E${nextEpisode.episode_number}`}
                >
                  <SkipForward className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />
                  <span className="hidden md:inline">Next Episode</span>
                  <span className="md:hidden">Next</span>
                </button>
              )}

              <div className="hidden lg:block min-w-0 ml-1">
                <h1 className="text-sm sm:text-base font-bold text-foreground drop-shadow-md truncate max-w-[200px] xl:max-w-[320px]">
                  {movie.title}
                </h1>
                {type === 'tv' && selectedEpisode && (
                  <p className="text-[10px] sm:text-xs text-brand tracking-wide font-medium truncate max-w-[200px] xl:max-w-[320px]">
                    S{selectedSeason} E{selectedEpisode.episode_number}
                    {selectedEpisode.name ? ` — ${selectedEpisode.name}` : ''}
                  </p>
                )}
              </div>
            </div>

            {/* Right side is intentionally empty and non-interactive so player native buttons (e.g. server download buttons) remain unblocked */}
            <div className="w-12 h-6 pointer-events-none" aria-hidden="true" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video */}
      <div className="w-full h-full relative bg-black overflow-hidden">
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

        {embedSrc && (
          <iframe
            key={`${source.id}-${embedSrc}-${retryToken}`}
            ref={iframeRef}
            title={`${movie.title} player`}
            src={embedSrc}
            onLoad={() => setEmbedState('ready')}
            className={cn(
              'w-full h-full border-0 transition-opacity duration-500',
              overlayVisible ? 'opacity-0' : 'opacity-100'
            )}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          />
        )}

        {/* Resumption Prompt Overlay */}
        <AnimatePresence>
          {restored &&
            (restored.progress_percentage || 0) >= MIN_RESUME_PERCENT &&
            (restored.progress_percentage || 0) < COMPLETION_THRESHOLD &&
            !restartPromptDismissed &&
            !forceStartFromBeginning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-[#181a20]/95 backdrop-blur-xl rounded-2xl border border-white/10 p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center"
                  role="dialog"
                  aria-labelledby="resume-title"
                >
                  <div className="w-24 aspect-video rounded-lg overflow-hidden mb-4 bg-white/5 relative">
                    <img
                      src={movie.backdropUrl || movie.posterUrl || ''}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 id="resume-title" className="text-lg font-bold text-foreground mb-1">
                    Resume where you left off?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {type === 'tv' && selectedEpisode
                      ? `S${selectedSeason} E${selectedEpisode.episode_number} · ${formatDuration(restored.position_seconds)}`
                      : `at ${formatDuration(restored.position_seconds)}`}
                  </p>
                  <div className="flex flex-col gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => setRestartPromptDismissed(true)}
                      className="w-full bg-brand hover:bg-brand/90 text-background font-bold py-3 px-4 rounded-xl transition-colors"
                    >
                      Resume
                    </button>
                    <button
                      type="button"
                      onClick={handleStartOver}
                      className="w-full bg-transparent hover:bg-white/5 text-foreground font-semibold py-3 px-4 rounded-xl transition-colors"
                    >
                      Start from beginning
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
        </AnimatePresence>

        {/* Loading / unavailable overlay */}
        <AnimatePresence>
          {overlayVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-background px-6 text-center"
            >
              {missingImdbId ? (
                <>
                  <AlertTriangle className="w-10 h-10 text-brand mb-4" aria-hidden="true" />
                  <p className="text-foreground font-display text-lg mb-1">
                    {source.name} needs an IMDb id
                  </p>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    TMDB doesn’t publish one for this title. Pick another source from the menu.
                  </p>
                </>
              ) : type === 'tv' && !episodeNumber ? (
                <p className="text-muted-foreground text-sm">Select an episode to start watching.</p>
              ) : (
                <>
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-white/10 rounded-full" />
                    <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin absolute inset-0" />
                  </div>
                  <p
                    className="text-foreground/60 text-sm mt-4 tracking-widest uppercase font-medium"
                    aria-live="polite"
                  >
                    Loading {source.name}…
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Failover notification */}
        <AnimatePresence>
          {failoverMessage && embedState !== 'ready' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] sm:max-w-2xl bg-card/95 backdrop-blur-xl border border-white/15 rounded-2xl p-3 sm:p-4 shadow-2xl flex items-center gap-3"
              role="status"
            >
              <AlertTriangle className="w-4 h-4 text-brand shrink-0" aria-hidden="true" />
              <p className="text-xs sm:text-sm text-foreground font-medium">
                {failoverMessage}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next episode */}
        <AnimatePresence>
          {showNextEpisode && nextEpisode && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="next-episode-card absolute bottom-6 right-6 z-40 bg-[#181a20]/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl w-[280px]"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-foreground">
                  Up Next
                </span>
              </div>
              <div className="flex gap-3 mb-4">
                <div className="w-20 aspect-video rounded-lg overflow-hidden bg-white/5 shrink-0 relative">
                  <img
                    src={(nextEpisode.still_path ? api.getImageUrl(nextEpisode.still_path, 'w300') : (movie.backdropUrl || movie.posterUrl)) ?? undefined}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <h2 className="text-foreground font-bold text-sm line-clamp-2 leading-tight">
                    {nextEpisode.name || `S${selectedSeason} E${nextEpisode.episode_number}`}
                  </h2>
                  {nextEpisode.name && (
                    <p className="text-muted-foreground text-xs font-medium truncate mt-0.5">
                      S{selectedSeason} E{nextEpisode.episode_number}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="20" cy="20" r="18" className="stroke-white/10 fill-none" strokeWidth="3" />
                    <circle 
                      cx="20" cy="20" r="18" 
                      className="stroke-brand fill-none transition-all duration-1000 ease-linear" 
                      strokeWidth="3"
                      strokeDasharray={18 * 2 * Math.PI}
                      strokeDashoffset={(18 * 2 * Math.PI) * (1 - nextCountdown / NEXT_EPISODE_SECONDS)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-xs font-bold text-foreground relative z-10">{nextCountdown}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNextEpisode(false);
                      hasDismissedNextPrompt.current = true;
                    }}
                    className="text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => goToEpisode(nextEpisode)}
                    className="bg-brand hover:bg-brand/90 text-background font-bold py-2 px-4 rounded-xl transition-all shadow-lg shadow-brand/25 flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" /> Play Now
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 bg-background/60 z-50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              aria-label="Episodes and sources"
              className="absolute top-0 left-0 bottom-0 w-[85vw] max-w-[340px] bg-card backdrop-blur-xl z-[60] border-r border-white/10 flex flex-col overflow-y-auto custom-scrollbar"
            >
              <div className="p-6 pb-0 flex justify-between items-start gap-3">
                <div className="flex gap-4 min-w-0">
                  <div className="w-16 h-24 rounded overflow-hidden shrink-0">
                    <PosterImage
                      src={movie.posterUrl}
                      title={movie.title}
                      decorative
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-foreground leading-tight mb-1 line-clamp-2">
                      {movie.title}
                    </h2>
                    {type === 'tv' && selectedEpisode ? (
                      <p className="text-sm text-brand tracking-wide">
                        S{selectedSeason} E{selectedEpisode.episode_number}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {movie.year > 0 ? movie.year : '—'}
                        {movie.duration ? ` • ${movie.duration}` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close menu"
                  className="text-foreground/50 hover:text-foreground p-2 shrink-0"
                >
                  <X className="w-6 h-6" aria-hidden="true" />
                </button>
              </div>

              {/* Episodes */}
              {type === 'tv' && seasons.length > 0 && (
                <div className="mt-8 px-6">
                  <div className="relative mb-4">
                    <label className="sr-only" htmlFor="player-season">
                      Season
                    </label>
                    <select
                      id="player-season"
                      value={selectedSeason}
                      onChange={(event) => {
                        goToWatch(id, 'tv', Number(event.target.value), 1);
                      }}
                      className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-brand text-lg font-display cursor-pointer"
                    >
                      {seasons.map((entry) => (
                        <option
                          key={entry.season_number}
                          value={entry.season_number}
                          className="bg-background text-foreground"
                        >
                          {entry.name || `Season ${entry.season_number}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none"
                      aria-hidden="true"
                    />
                  </div>

                  <ul className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar list-none m-0 p-0">
                    {episodes.map((entry) => {
                      const current = selectedEpisode?.id === entry.id;
                      return (
                        <li key={entry.id}>
                          <button
                            type="button"
                            onClick={() => goToEpisode(entry)}
                            aria-current={current ? 'true' : undefined}
                            className={cn(
                              'w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors group cursor-pointer',
                              current
                                ? 'bg-brand/10 border border-brand/30'
                                : 'border border-transparent hover:bg-white/5'
                            )}
                          >
                            <div className="w-20 aspect-video rounded overflow-hidden shrink-0 relative bg-white/5">
                              <PosterImage
                                src={api.getImageUrl(entry.still_path, 'w300')}
                                title={entry.name || `Episode ${entry.episode_number}`}
                                decorative
                                className="w-full h-full object-cover"
                              />
                              {current && (
                                <span className="absolute inset-0 bg-brand/20 flex items-center justify-center backdrop-blur-[1px]">
                                  <Play
                                    className="w-6 h-6 text-brand fill-current drop-shadow-md"
                                    aria-hidden="true"
                                  />
                                </span>
                              )}
                            </div>
                            <span className="min-w-0 flex-1">
                              <span
                                className={cn(
                                  'block text-sm truncate font-medium',
                                  current
                                    ? 'text-brand font-bold'
                                    : 'text-foreground/80 group-hover:text-foreground'
                                )}
                              >
                                {entry.episode_number}. {entry.name || 'Untitled'}
                              </span>
                              {/* Was `{ep.runtime || 45}m` -- a made-up runtime
                                  for every episode TMDB doesn't publish one for. */}
                              {entry.runtime ? (
                                <span className="block text-xs text-muted-foreground">
                                  {entry.runtime}m
                                </span>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Sources */}
              <div className="mt-8 px-6 pb-8 border-t border-white/10 pt-6">
                <button
                  type="button"
                  onClick={() => setServersOpen((open) => !open)}
                  aria-expanded={serversOpen}
                  aria-controls="player-sources"
                  className="w-full text-foreground font-bold flex items-center justify-between gap-2 group cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Signal className="w-5 h-5 text-brand" aria-hidden="true" /> Sources
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-muted-foreground group-hover:text-brand transition-transform',
                      serversOpen ? 'rotate-180' : ''
                    )}
                    aria-hidden="true"
                  />
                </button>

                {/* State-driven, rather than reaching into
                    document.getElementById and mutating el.style.maxHeight. */}
                {serversOpen && (
                  <ul className="space-y-3 mt-4 list-none m-0 p-0">
                    {rankedSources.map((entry) => {
                      const active = source.id === entry.id;
                      const down = entry.status === 'maintenance';
                      const probe = serverProbeCache.get(entry.id);
                      const isPreferred = entry.id === readString(StorageKeys.preferredServer, '');
                      return (
                        <li key={entry.id}>
                          <button
                            type="button"
                            onClick={() => handleSourceChange(entry)}
                            disabled={down}
                            aria-current={active ? 'true' : undefined}
                            className={cn(
                              'w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2',
                              active
                                ? 'bg-brand/10 border-brand text-brand'
                                : down
                                  ? 'bg-white/5 border-white/5 text-muted-foreground/50 cursor-not-allowed'
                                  : 'bg-white/5 border-white/10 text-foreground/80 hover:bg-white/10 hover:border-white/20 cursor-pointer'
                            )}
                          >
                            <span className="flex flex-col gap-1.5 min-w-0">
                              <span className="font-medium text-sm leading-none flex items-center gap-2 truncate">
                                {entry.name}
                                {isPreferred && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand/20 text-brand uppercase font-bold tracking-wider">
                                    Last used
                                  </span>
                                )}
                              </span>
                              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                {entry.language === 'hindi' && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/15 border border-orange-500/30 text-orange-400 font-bold">
                                    Hindi
                                  </span>
                                )}
                                {entry.language === 'multi' && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 border border-white/15 font-bold">
                                    Multi-audio
                                  </span>
                                )}
                                {down ? (
                                  <span className="text-[10px]">Unavailable</span>
                                ) : (
                                  <span className="flex items-center gap-1.5 text-[10px]">
                                    {!probe ? (
                                      <span className="w-1.5 h-1.5 rounded-full border border-white/50 border-t-transparent animate-spin" />
                                    ) : probe.reachable ? (
                                      <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        <span>{probe.latencyMs}ms</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        <span>Error</span>
                                      </>
                                    )}
                                  </span>
                                )}
                              </span>
                            </span>
                            {entry.quality && (
                              <span
                                className={cn(
                                  'text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0',
                                  entry.quality === '4K'
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : entry.quality === 'HD'
                                      ? 'bg-blue-500/20 text-blue-400'
                                      : 'bg-gray-500/20 text-gray-400'
                                )}
                              >
                                {entry.quality}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Kept for callers that resolve a source id from a URL or saved preference. */
export { findSource };
