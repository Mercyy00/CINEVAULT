import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ChevronDown, Signal, ArrowLeft, Play, Download, Globe, Languages } from 'lucide-react';
import { ServerOption, Movie } from '../types';
import { api } from '../api';
import { cn } from '../lib/utils';
import { useApp } from '../store';

// @ts-ignore - loaded dynamically
const Artplayer = (window as any).Artplayer;
const Hls = (window as any).Hls;

const SERVERS: ServerOption[] = [
  { 
    id: '16', 
    name: 'ScreenScape Hindi (Ad-Free)', 
    quality: '4K' as const, 
    latency: 8, 
    status: 'working' as const, 
    url: (id: string | number, s?: number, e?: number) => s && e 
      ? `https://screenscape.me/embed?tmdb=${id}&type=tv&s=${s}&e=${e}&lan=hindi` 
      : `https://screenscape.me/embed?tmdb=${id}&type=movie&lan=hindi` 
  },
  { 
    id: '18', 
    name: 'ModiPlay Hindi (IMDb)', 
    quality: '4K' as const, 
    latency: 10, 
    status: 'working' as const, 
    url: (id: string | number, s?: number, e?: number, imdbId?: string) => s && e 
      ? `https://rozgarlelo.modiplay.xyz/embed/imdb/tv?id=${imdbId || id}&s=${s}&e=${e}` 
      : `https://rozgarlelo.modiplay.xyz/embed/imdb/movie?id=${imdbId || id}` 
  },
  { 
    id: '17', 
    name: 'ScreenScape English (Ad-Free)', 
    quality: '4K' as const, 
    latency: 9, 
    status: 'working' as const, 
    url: (id: string | number, s?: number, e?: number) => s && e 
      ? `https://screenscape.me/embed?tmdb=${id}&type=tv&s=${s}&e=${e}&lan=eng` 
      : `https://screenscape.me/embed?tmdb=${id}&type=movie&lan=eng` 
  },
  { 
    id: '13', 
    name: 'MbPly Hindi Stream', 
    quality: '4K' as const, 
    latency: 14, 
    status: 'working' as const, 
    url: (id: string | number, s?: number, e?: number) => s && e 
      ? `https://cinesrc.st/embed/tv/${id}/${s}/${e}?server=MbPly-[Multi-Lang]&lang=hi&sub=hi&disable_app_ad=true` 
      : `https://cinesrc.st/embed/movie/${id}?server=MbPly-[Multi-Lang]&lang=hi&sub=hi&disable_app_ad=true` 
  },
  { 
    id: '14', 
    name: 'CineSrc Hindi Dub', 
    quality: 'HD' as const, 
    latency: 18, 
    status: 'working' as const, 
    url: (id: string | number, s?: number, e?: number) => s && e 
      ? `https://cinesrc.st/embed/tv/${id}/${s}/${e}?lang=hi&sub=hi&disable_app_ad=true` 
      : `https://cinesrc.st/embed/movie/${id}?lang=hi&sub=hi&disable_app_ad=true` 
  },
  { 
    id: '15', 
    name: 'AutoEmbed Hindi', 
    quality: '4K' as const, 
    latency: 22, 
    status: 'working' as const, 
    url: (id: string | number, s?: number, e?: number) => s && e 
      ? `https://autoembed.co/tv/tmdb/${id}/${s}/${e}?lang=hi&sub=hi` 
      : `https://autoembed.co/movie/tmdb/${id}?lang=hi&sub=hi` 
  },
  { id: '1', name: 'ZXC Stream', quality: 'HD' as const, latency: 12, status: 'working' as const, url: (id: string | number, s?: number, e?: number) => s && e ? `https://zxcstream.xyz/player/tv/${id}/${s}/${e}` : `https://zxcstream.xyz/player/movie/${id}` },
  { id: '2', name: 'Viduki Multi', quality: 'HD' as const, latency: 24, status: 'working' as const, url: (id: string | number, s?: number, e?: number) => s && e ? `https://viduki.net/1/tv/${id}/${s}/${e}?color=%23e50914` : `https://viduki.net/1/movie/${id}?color=%23e50914` },
  { id: '3', name: 'Viduki Multi-Lang', quality: 'HD' as const, latency: 28, status: 'working' as const, url: (id: string | number, s?: number, e?: number) => s && e ? `https://viduki.net/2/tv/${id}/${s}/${e}?color=%23e50914` : `https://viduki.net/2/movie/${id}?color=%23e50914` },
  { id: '4', name: 'Viduki Premium', quality: '4K' as const, latency: 45, status: 'working' as const, url: (id: string | number, s?: number, e?: number) => s && e ? `https://viduki.net/3/tv/${id}/${s}/${e}?color=%23e50914` : `https://viduki.net/3/movie/${id}?color=%23e50914` },
  { id: '5', name: 'VidSync Cloud', quality: 'HD' as const, latency: 55, status: 'working' as const, url: (id: string | number, s?: number, e?: number) => s && e ? `https://vidsync.xyz/embed/tv/${id}/${s}/${e}?autoPlay=true` : `https://vidsync.xyz/embed/movie/${id}?autoPlay=true` },
  { id: '6', name: '111 Movies', quality: 'SD' as const, latency: 62, status: 'working' as const, url: (id: string | number, s?: number, e?: number) => s && e ? `https://111movies.com/tv/${id}/${s}/${e}` : `https://111movies.com/movie/${id}` },
  { id: '7', name: 'VidLink Pro', quality: 'HD' as const, latency: 71, status: 'working' as const, url: (id: string | number, s?: number, e?: number) => s && e ? `https://vidlink.pro/tv/${id}/${s}/${e}` : `https://vidlink.pro/movie/${id}` },
  { id: '8', name: 'Videasy Stream', quality: 'HD' as const, latency: 85, status: 'working' as const, url: (id: string | number, s?: number, e?: number) => s && e ? `https://player.videasy.net/tv/${id}/${s}/${e}?nextEpisode=true&autoplayNextEpisode=true` : `https://player.videasy.net/movie/${id}` },
  { id: '9', name: 'VidFast Pro', quality: '4K' as const, latency: 92, status: 'working' as const, url: (id: string | number, s?: number, e?: number) => s && e ? `https://vidfast.pro/tv/${id}/${s}/${e}?autoPlay=true` : `https://vidfast.pro/movie/${id}?autoPlay=true` },
  { id: '10', name: 'CineSrc HD', quality: 'HD' as const, latency: 105, status: 'working' as const, url: (id: string | number, s?: number, e?: number) => s && e ? `https://cinesrc.st/embed/tv/${id}/${s}/${e}?color=%23e50914` : `https://cinesrc.st/embed/movie/${id}?color=%23e50914` },
  { id: '11', name: 'Peachify', quality: 'HD' as const, latency: 40, status: 'working' as const, url: (id: string | number, s?: number, e?: number) => s && e ? `https://peachify.pro/embed/tv/${id}/${s}/${e}?autoNext=true&showNextBtn=true&accent=d4a853` : `https://peachify.pro/embed/movie/${id}?autoPlay=true&accent=d4a853` },
  { id: '12', name: 'ArtPlayer (Custom)', quality: '4K' as const, latency: 10, status: 'working' as const, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
];

export function PlayerPage({ type, id, season, episode }: { type: 'movie' | 'tv', id: string, season?: string, episode?: string }) {
  const { updateContinueWatching, userProfile } = useApp();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState<ServerOption>(SERVERS[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isServerLoading, setIsServerLoading] = useState(false);
  const [currentIframeSrc, setCurrentIframeSrc] = useState<string>('');
  
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<any>(null);

  const [imdbId, setImdbId] = useState<string>('');

  const [showControls, setShowControls] = useState(true);
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(5);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const updateIframeSrc = (server: ServerOption, s?: number, e?: number, resolvedImdbId?: string) => {
    setIsServerLoading(true);
    setCurrentIframeSrc('about:blank');
    
    const finalS = s !== undefined ? s : selectedSeason;
    const finalE = e !== undefined ? e : selectedEpisode?.episode_number;
    const finalImdb = resolvedImdbId || imdbId || movie?.imdbId || '';

    setTimeout(() => {
      const newSrc = typeof server.url === 'function' ? server.url(id, finalS, finalE, finalImdb) : server.url;
      setCurrentIframeSrc(newSrc || '');
      setIsServerLoading(false);
    }, 1000);
  };

  const loadSeasonAndEpisode = async (seasonNumber: number, targetEpisodeNumber?: number, resolvedImdbId?: string) => {
    setSelectedSeason(seasonNumber);
    try {
      const seasonDetails = await api.getSeasonDetails(id, seasonNumber);
      if (seasonDetails.episodes) {
        setEpisodes(seasonDetails.episodes);
        if (seasonDetails.episodes.length > 0) {
          let targetEp = seasonDetails.episodes[0];
          if (targetEpisodeNumber) {
            const found = seasonDetails.episodes.find((e: any) => e.episode_number === targetEpisodeNumber);
            if (found) targetEp = found;
          }
          setSelectedEpisode(targetEp);
          updateIframeSrc(selectedServer, seasonNumber, targetEp.episode_number, resolvedImdbId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  
  useEffect(() => {
    if (movie) document.title = `CineVault | Now Playing: ${movie.title}`;
  }, [movie]);

  useEffect(() => {
    const loadData = async () => {
      const isSameMedia = movie && movie.id.toString() === id;
      
      if (!isSameMedia) {
        setIsLoading(true);
      }
      
      try {
        if (!isSameMedia) {
          const details = await api.getDetails(type, id);
          const internalMovie = api.mapToInternalMovie({ ...details, media_type: type });
          setMovie(internalMovie);

          let fetchedImdb = details.external_ids?.imdb_id || details.imdb_id || '';
          if (!fetchedImdb) {
            const ext = await api.getExternalIds(type, id);
            if (ext.imdb_id) fetchedImdb = ext.imdb_id;
          }
          setImdbId(fetchedImdb);

          if (type === 'tv' && details.seasons) {
            const validSeasons = details.seasons.filter((s: any) => s.season_number > 0);
            setSeasons(validSeasons);
            
            let targetSeason = validSeasons.length > 0 ? validSeasons[0].season_number : 1;
            if (season) targetSeason = parseInt(season);
            await loadSeasonAndEpisode(targetSeason, episode ? parseInt(episode) : undefined, fetchedImdb);
          } else {
             updateIframeSrc(selectedServer, undefined, undefined, fetchedImdb);
          }
        } else {
           if (type === 'tv') {
              let targetSeason = selectedSeason;
              if (season) targetSeason = parseInt(season);
              let targetEpisode = episode ? parseInt(episode) : undefined;
              
              if (targetSeason !== selectedSeason) {
                await loadSeasonAndEpisode(targetSeason, targetEpisode);
              } else if (targetEpisode && targetEpisode !== selectedEpisode?.episode_number) {
                 const targetEp = episodes.find((e: any) => e.episode_number === targetEpisode) || episodes[0];
                 setSelectedEpisode(targetEp);
                 updateIframeSrc(selectedServer, targetSeason, targetEp.episode_number);
              }
           }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!isSameMedia) {
          setIsLoading(false);
        }
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, id, season, episode]);

  // Update continue watching
  useEffect(() => {
    let mockProgress = 0;
    const interval = setInterval(() => {
      if (movie) {
        mockProgress = Math.min(mockProgress + 1, 90); // cap at 90 for fallback
        updateContinueWatching({
           id: movie.id,
           media_type: type as 'movie' | 'tv',
           title: movie.title,
           poster_path: movie.posterUrl,
           backdrop_path: movie.backdropUrl,
           season_number: selectedSeason,
           episode_number: selectedEpisode?.episode_number,
           progress_percentage: mockProgress,
           timestamp: Date.now(),
           time: Date.now()
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [movie, type, selectedSeason, selectedEpisode, updateContinueWatching]);

    // Player message listener (ScreenScape & Peachify)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const payload = event.data;
      if (!payload) return;

      // 1. ScreenScape Message Handler
      if (event.origin === 'https://screenscape.me' && movie) {
        if (payload.type === 'SCREENSCAPE_WATCH_HISTORY_WITH_PROGRESS_RESPONSE' || payload.type === 'SCREENSCAPE_PROGRESS_UPDATE') {
          const progress = payload.progress ?? payload.percentage ?? (payload.watched && payload.duration ? (payload.watched / payload.duration) * 100 : undefined);
          if (progress !== undefined) {
            updateContinueWatching({
              id: movie.id,
              media_type: type as 'movie' | 'tv',
              title: movie.title,
              poster_path: movie.posterUrl,
              backdrop_path: movie.backdropUrl,
              season_number: selectedSeason,
              episode_number: selectedEpisode?.episode_number,
              progress_percentage: Math.min(100, Math.max(0, progress)),
              timestamp: Date.now(),
              time: Date.now()
            });
          }
        }
      }

      // 2. Peachify Message Handler
      if (event.origin === 'https://peachify.pro' && movie) {
        if (payload.type === 'MEDIA_DATA') {
          const { watched, duration } = payload;
          const tmdbId = payload.tmdbId || payload.id;
          
          if (tmdbId && tmdbId.toString() !== id.toString()) return;
          
          if (watched !== undefined && duration) {
             const progress = (watched / duration) * 100;
             updateContinueWatching({
                 id: movie.id,
                 media_type: type as 'movie' | 'tv',
                 title: movie.title,
                 poster_path: movie.posterUrl,
                 backdrop_path: movie.backdropUrl,
                 season_number: selectedSeason,
                 episode_number: selectedEpisode?.episode_number,
                 progress_percentage: Math.min(100, progress),
                 timestamp: Date.now(),
                 time: Date.now()
             });
          }
        }
        
        if (payload.type === 'PLAYER_EVENT') {
          const eventName = payload.data?.event || payload.event;
          if (eventName === 'ended' && type === 'tv' && userProfile.autoPlayNext) {
            setShowNextEpisode(true);
            setNextCountdown(5);
          }
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [movie, updateContinueWatching, selectedSeason, selectedEpisode, type, id]);

  // Next episode countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showNextEpisode && nextCountdown > 0) {
      timer = setTimeout(() => setNextCountdown(prev => prev - 1), 1000);
    } else if (showNextEpisode && nextCountdown === 0) {
      const currentIndex = episodes.findIndex(e => e.episode_number === selectedEpisode?.episode_number);
      if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
        handleEpisodeChange(episodes[currentIndex + 1]);
      }
      setShowNextEpisode(false);
    }
    return () => clearTimeout(timer);
  }, [showNextEpisode, nextCountdown, episodes, selectedEpisode]);

  const handleServerChange = (server: ServerOption) => {
    if (server.status === 'maintenance') return;
    setSelectedServer(server);
    updateIframeSrc(server, selectedSeason, selectedEpisode?.episode_number, imdbId);
  };

  const handleEpisodeChange = (episode: any) => {
    setShowNextEpisode(false);
    window.location.hash = `#watch/tv/${id}/${selectedSeason}/${episode.episode_number}`;
  };

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSeason = parseInt(e.target.value);
    window.location.hash = `#watch/tv/${id}/${newSeason}/1`;
  };


  // ArtPlayer Initialization
  useEffect(() => {
    let art: any = null;
    if (selectedServer.id === '12' && !isServerLoading) {
      setTimeout(() => {
        const Artplayer = (window as any).Artplayer;
        if (Artplayer && document.getElementById('artplayer-container')) {
          art = new Artplayer({
              container: '#artplayer-container',
              url: selectedServer.url,
              volume: 1.0,
              autoplay: true,
              theme: '#d4a853',
              pip: true,
              fullscreen: true,
              miniProgressBar: true,
              autoSize: true,
              setting: true,
              customType: {
                m3u8: function (video: any, url: string, art: any) {
                  const Hls = (window as any).Hls;
                  if (Hls && Hls.isSupported()) {
                    if (art.hls) art.hls.destroy();
                    const hls = new Hls();
                    hls.loadSource(url);
                    hls.attachMedia(video);
                    art.hls = hls;
                    art.on('destroy', () => hls.destroy());
                  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = url;
                  } else {
                    art.notice.show = 'Unsupported video format: m3u8';
                  }
                }
              }
          });
        }
      }, 500);
    }
    return () => {
      if (art && art.destroy) {
        art.destroy(false);
      }
    };
  }, [selectedServer, isServerLoading]);

  // Handle pointer
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


  // Player specific shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === 's' || e.key === 'S') {
        setSidebarOpen(prev => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          if (!document.fullscreenElement) {
            iframe.requestFullscreen().catch(err => console.error(err));
          } else {
            document.exitFullscreen();
          }
        }
      } else if (e.key === 'n' || e.key === 'N') {
        if (type === 'tv') {
          const currentIndex = episodes.findIndex(e => e.episode_number === selectedEpisode?.episode_number);
          if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
            handleEpisodeChange(episodes[currentIndex + 1]);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [type, movie, selectedSeason, selectedEpisode]);

  if (isLoading || !movie) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div 
      className="fixed inset-0 w-full h-full bg-black z-50 flex"
      onMouseMove={handlePointerMove}
      onTouchStart={handlePointerMove}
      onClick={() => {
        // Only toggle if it's not a top zone click to allow interacting with the top bar
        handlePointerMove();
      }}
    >
      {/* Back & Menu Buttons (Top Left) */}
      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.15, exit: { duration: 0.3 } }}
            className="absolute top-0 left-0 right-0 p-6 z-40 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-auto"
          >
            <div className="flex items-center gap-4">
              <motion.button 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                onClick={() => {
                  const current = window.location.hash;
                  if (current.includes('#watch/')) {
                    window.location.hash = `#${type}/${id}`;
                  } else {
                    window.history.back();
                  }
                }}
                className="w-12 h-12 rounded-full bg-card hover:bg-brand/20 flex items-center justify-center text-foreground transition-colors backdrop-blur-md border border-white/10 hover:border-brand/50 cursor-pointer"
              >
                <ArrowLeft className="w-6 h-6" />
              </motion.button>
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
                {type === 'tv' && selectedEpisode && (
                  <p className="text-sm text-brand tracking-wide font-medium">S{selectedSeason} E{selectedEpisode.episode_number} - {selectedEpisode.name}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Server selector trigger */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSidebarOpen(true);
                }}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 hover:bg-brand/20 border border-white/10 text-xs font-bold text-foreground backdrop-blur-md transition-colors cursor-pointer"
              >
                <Signal className="w-3.5 h-3.5 text-brand" />
                <span>{selectedServer.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand/20 text-brand uppercase font-mono">{selectedServer.quality}</span>
              </button>

              {/* Direct Download Endpoint Button */}
              <a
                href={type === 'movie' 
                  ? `https://cinesrc.st/dl/movie/${id}` 
                  : `https://cinesrc.st/dl/tv/${id}/${selectedSeason}/${selectedEpisode?.episode_number || 1}`
                }
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="h-12 px-4 rounded-full bg-card/80 hover:bg-brand/20 border border-white/10 text-xs font-bold text-foreground backdrop-blur-md transition-all hover:scale-105 flex items-center gap-2 cursor-pointer shadow-lg"
                title="Direct Media Download"
              >
                <Download className="w-4 h-4 text-brand" />
                <span className="hidden sm:inline">Download</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Video Container */}
      <div className="w-full h-full relative bg-black">
        {selectedServer.id === '12' ? (
          <div id="artplayer-container" style={{ width: '100%', height: '100vh', background: '#000' }} className={cn("transition-opacity duration-500", isServerLoading ? "opacity-0" : "opacity-100")}></div>
        ) : (
          <iframe
            id="screenscape-player"
            src={currentIframeSrc || undefined}
            className={cn("w-full h-full border-0 transition-opacity duration-500", isServerLoading ? "opacity-0" : "opacity-100")}
            allowFullScreen={true}
            webkitallowfullscreen="true"
            mozallowfullscreen="true"
            allow="autoplay; fullscreen; picture-in-picture"
          />
        )}

        
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
              <p className="text-foreground/60 text-sm mt-4 tracking-widest uppercase font-medium animate-pulse">Loading Source...</p>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Next Episode Prompt */}
        <AnimatePresence>
          {showNextEpisode && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="absolute bottom-24 right-8 z-40 bg-card backdrop-blur-xl border border-white/10 p-6 rounded-xl shadow-2xl max-w-sm pointer-events-auto"
            >
              <h3 className="text-foreground font-bold text-lg mb-2">Next Episode</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Playing Episode {episodes.findIndex(e => e.episode_number === selectedEpisode?.episode_number) + 2} in {nextCountdown}s...
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNextEpisode(false);
                    const currentIndex = episodes.findIndex(e => e.episode_number === selectedEpisode?.episode_number);
                    if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
                      handleEpisodeChange(episodes[currentIndex + 1]);
                    }
                  }}
                  className="flex-1 bg-brand hover:bg-brand-light text-background font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" /> Play Now
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNextEpisode(false);
                  }}
                  className="px-4 bg-white/10 hover:bg-white/20 text-foreground font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
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
                    {type === 'tv' && selectedEpisode && (
                      <p className="text-sm text-brand tracking-wide">S{selectedSeason} E{selectedEpisode.episode_number}</p>
                    )}
                    {type === 'movie' && (
                      <p className="text-sm text-muted-foreground">{movie.year} • {movie.duration}</p>
                    )}
                  </div>
                </div>
                <button onClick={(e) => {
                  e.stopPropagation();
                  setSidebarOpen(false);
                }} className="text-foreground/50 hover:text-foreground p-2">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Episodes Section */}
              {type === 'tv' && (
                <div className="mt-8 px-6">
                  <div className="relative mb-4">
                    <select 
                      value={selectedSeason}
                      onChange={handleSeasonChange}
                      className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-brand text-lg font-display cursor-pointer"
                    >
                      {seasons.map((s: any) => (
                        <option key={s.season_number} value={s.season_number} className="bg-background text-foreground">Season {s.season_number}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>
                  
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {episodes.map((ep: any) => (
                      <button 
                        key={ep.id}
                        onClick={() => handleEpisodeChange(ep)}
                        className={cn(
                          "w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors group cursor-pointer",
                          selectedEpisode?.id === ep.id ? "bg-brand/10 border border-brand/30" : "border border-transparent hover:bg-white/5"
                        )}
                      >
                        <div className="w-20 aspect-video rounded overflow-hidden shrink-0 relative bg-white/5">
                          {ep.still_path ? (
                            <img loading="lazy" src={ep.still_path ? api.getImageUrl(ep.still_path) : undefined} alt={ep.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                              <Play className="w-6 h-6" />
                            </div>
                          )}
                          {selectedEpisode?.id === ep.id && (
                            <div className="absolute inset-0 bg-brand/20 flex items-center justify-center backdrop-blur-[1px]">
                              <Play className="w-6 h-6 text-brand fill-current drop-shadow-md" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm truncate font-medium", selectedEpisode?.id === ep.id ? "text-brand font-bold" : "text-foreground/80 group-hover:text-foreground")}>
                            {ep.episode_number}. {ep.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{ep.runtime || 45}m</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Servers Section */}
              <div className="mt-8 px-6 pb-8 border-t border-white/10 pt-6">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const el = document.getElementById('servers-list');
                    if (el) {
                      if (el.style.maxHeight === '0px' || !el.style.maxHeight) {
                        el.style.maxHeight = '1000px';
                        el.style.opacity = '1';
                        el.style.marginTop = '1rem';
                      } else {
                        el.style.maxHeight = '0px';
                        el.style.opacity = '0';
                        el.style.marginTop = '0';
                      }
                    }
                  }}
                  className="w-full text-foreground font-bold flex items-center justify-between gap-2 group cursor-pointer"
                >
                  <span className="flex items-center gap-2"><Signal className="w-5 h-5 text-brand" /> Servers</span>
                  <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-brand transition-colors" />
                </button>
                <div id="servers-list" className="space-y-3 transition-all duration-300 overflow-hidden" style={{ maxHeight: '1000px', opacity: 1, marginTop: '1rem' }}>
                  {SERVERS.map((server) => (
                    <button
                      key={server.id}
                      onClick={() => handleServerChange(server)}
                      disabled={server.status === 'maintenance'}
                      className={cn(
                        "w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer",
                        selectedServer.id === server.id
                          ? "bg-brand/10 border-brand text-brand"
                          : server.status === 'maintenance'
                            ? "bg-white/5 border-white/5 text-muted-foreground/50 cursor-not-allowed"
                            : "bg-white/5 border-white/10 text-foreground/80 hover:bg-white/10 hover:border-white/20"
                      )}
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm leading-none">{server.name}</span>
                          {(server.name.includes('Hindi') || server.name.includes('Multi-Lang')) && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/15 border border-orange-500/30 text-orange-400 font-bold flex items-center gap-1">
                              <span>🇮🇳</span> Hindi Dub
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex gap-0.5">
                            {[1,2,3].map(i => (
                              <div key={i} className={cn("w-1 h-2 rounded-full", 
                                server.status === 'maintenance' ? "bg-gray-700" :
                                i <= (server.latency < 50 ? 3 : server.latency < 100 ? 2 : 1) ? "bg-green-500" : "bg-gray-700"
                              )} />
                            ))}
                          </div>
                          <span>{server.latency}ms</span>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0",
                        server.quality === '4K' ? "bg-purple-500/20 text-purple-400" :
                        server.quality === 'HD' ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"
                      )}>{server.quality}</span>
                    </button>
                  ))}
                </div>
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
