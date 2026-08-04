import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowLeft, Play, Globe } from 'lucide-react';
import { kitsuApi, anikotoApi } from '../api';
import { cn } from '../lib/utils';
import { useApp } from '../store';

export function AnimePlayer({ id, episode, malId }: { id: string, episode: string, malId?: string }) {
  const { updateContinueWatching, userProfile } = useApp();
  const [movie, setMovie] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [jumpEpisode, setJumpEpisode] = useState<string>('');
  const [jumpError, setJumpError] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [language, setLanguage] = useState<'sub' | 'dub'>('sub');
  const [server, setServer] = useState<'megaplay' | 'anikoto'>('megaplay');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isServerLoading, setIsServerLoading] = useState(false);
  const [currentIframeSrc, setCurrentIframeSrc] = useState<string>('');

  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  
  const [showNextEpisode, setShowNextEpisode] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(5);
  const nextEpisodeTimerRef = useRef<NodeJS.Timeout>();

  const updateIframeSrc = async (epNum: number, lang: 'sub' | 'dub', srv: 'megaplay' | 'anikoto' = server, malId?: string, title?: string) => {
    setIsServerLoading(true);
    setCurrentIframeSrc('about:blank');
    
    setTimeout(async () => {
      if (srv === 'megaplay' && malId) {
        setCurrentIframeSrc(`https://megaplay.buzz/stream/mal/${malId}/${epNum}/${lang}`);
      } else {
        // Fallback to Anikoto
        const anikotoId = await kitsuApi.searchAnikotoByTitleFallback(title || movie?.title || '');
        if (anikotoId) {
           try {
             const aniRes = await anikotoApi.getSeries(anikotoId);
             if (aniRes && aniRes.data && aniRes.data.episodes) {
                const ep = aniRes.data.episodes.find((e: any) => e.number === epNum) || aniRes.data.episodes[0];
                if (ep && ep.episode_embed_id) {
                   setCurrentIframeSrc(`https://megaplay.buzz/stream/s-2/${ep.episode_embed_id}/${lang}`);
                   setIsServerLoading(false);
                   return;
                }
             }
           } catch (e) {
             console.error(e);
           }
        }
        // If all else fails
        setCurrentIframeSrc(`https://megaplay.buzz/stream/mal/${malId || '1'}/${epNum}/${lang}`);
      }
      setIsServerLoading(false);
    }, 1000);
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
          
          let epList = internalMovie.episodes || [];
          setEpisodes(epList);
          
          const epNum = parseInt(episode);
          let targetEp = epList.find((e: any) => e.episode === epNum);
          
          if (!targetEp) {
             targetEp = {
                id: `ep-${epNum}`,
                season: 1,
                episode: epNum,
                title: `Episode ${epNum}`,
                duration: '24m',
                thumbnail: 'https://picsum.photos/300/150',
                description: `Episode ${epNum} of ${internalMovie.title}`
             };
          }
          
          if (targetEp) {
            setSelectedEpisode(targetEp);
            setLanguage(language);
            updateIframeSrc(targetEp.episode, language, server, internalMovie.malId, internalMovie.title);
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


  // Update continue watching mock progress for anime
  useEffect(() => {
    let mockProgress = 0;
    const interval = setInterval(() => {
      if (movie && selectedEpisode) {
        mockProgress = Math.min(mockProgress + 1, 90);
        updateContinueWatching({
           id: movie.id,
           media_type: 'anime',
           title: movie.title,
           poster_path: movie.posterUrl,
           backdrop_path: movie.backdropUrl,
           episode_number: selectedEpisode?.episode,
           progress_percentage: mockProgress,
           timestamp: Date.now(),
           time: Date.now(),
           mal_id: movie.malId
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [movie, selectedEpisode, updateContinueWatching]);


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
        const currentIndex = episodes.findIndex(e => e.episode === selectedEpisode?.episode);
        if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
          const nextEpNum = episodes[currentIndex + 1]?.episode || selectedEpisode.episode + 1;
window.location.hash = `#watch/ani/${id}/${movie?.malId || '0'}/${nextEpNum}`;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [episodes, selectedEpisode]);

  // MegaPlay postMessage handler
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data && (data.channel === 'megacloud' || data.type === 'watching-log')) {
        if (data.event === 'complete' && userProfile.autoPlayNext) {
          // Trigger next episode
          const currentIndex = episodes.findIndex(e => e.episode === selectedEpisode?.episode);
          if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
            setShowNextEpisode(true);
            setNextCountdown(5);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [episodes, selectedEpisode]);

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
    return <div className="min-h-screen bg-cv-bg flex items-center justify-center"><div className="w-10 h-10 border-4 border-cv-gold border-t-transparent rounded-full animate-spin" /></div>;
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
            transition={{ duration: 0.15, exit: { duration: 0.3 } }}
            className="absolute top-0 left-0 right-0 p-6 z-40 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-auto"
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  const current = window.location.hash;
                  if (current.includes('#watch/')) {
                    window.location.hash = `#detail/ani/${id}`;
                  } else {
                    window.history.back();
                  }
                }}
                className="w-12 h-12 rounded-full bg-cv-panel hover:bg-cv-gold/20 flex items-center justify-center text-cv-cream transition-colors backdrop-blur-md border border-white/10 hover:border-cv-gold/50 cursor-pointer"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSidebarOpen(true);
                }}
                className="w-12 h-12 rounded-full bg-cv-panel hover:bg-cv-gold/20 flex items-center justify-center text-cv-cream transition-colors backdrop-blur-md border border-white/10 hover:border-cv-gold/50 cursor-pointer"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-cv-cream shadow-black drop-shadow-md">{movie.title}</h1>
                {selectedEpisode && (
                  <p className="text-sm text-cv-gold tracking-wide font-medium">Episode {selectedEpisode.episode} - {selectedEpisode.title}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Container */}
      <div className="w-full h-full relative bg-black">
        <iframe
          src={currentIframeSrc || undefined}
          className={cn("w-full h-full border-0 transition-opacity duration-500", isServerLoading ? "opacity-0" : "opacity-100")}
          allowFullScreen={true}
          webkitallowfullscreen="true"
          mozallowfullscreen="true"
          allow="autoplay; fullscreen"
          scrolling="no"
        />
        
        {/* Loading Overlay */}
        <AnimatePresence>
          {isServerLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-cv-bg"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-white/10 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-cv-gold border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-cv-gold rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-cv-cream/60 text-sm mt-4 tracking-widest uppercase font-medium animate-pulse">Loading Episode...</p>
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
              className="absolute bottom-24 right-8 z-40 bg-cv-panel backdrop-blur-xl border border-white/10 p-6 rounded-xl shadow-2xl max-w-sm"
            >
              <h3 className="text-cv-cream font-bold text-lg mb-2">Next Episode</h3>
              <p className="text-cv-slate text-sm mb-6">
                Playing Episode {episodes.findIndex(e => e.episode === selectedEpisode?.episode) + 2} in {nextCountdown}s...
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowNextEpisode(false);
                    const currentIndex = episodes.findIndex(e => e.episode === selectedEpisode?.episode);
                    if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
                      const nextEpNum = episodes[currentIndex + 1]?.episode || selectedEpisode.episode + 1;
window.location.hash = `#watch/ani/${id}/${movie?.malId || '0'}/${nextEpNum}`;
                    }
                  }}
                  className="flex-1 bg-cv-gold hover:bg-cv-gold-light text-cv-gold-content font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" /> Play Now
                </button>
                <button 
                  onClick={() => setShowNextEpisode(false)}
                  className="px-4 bg-white/10 hover:bg-white/20 text-cv-cream font-medium rounded-lg transition-colors cursor-pointer"
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
              className="absolute inset-0 bg-cv-bg/60 z-50 backdrop-blur-sm pointer-events-auto"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute top-0 left-0 bottom-0 w-[85vw] max-w-[340px] bg-cv-panel backdrop-blur-xl z-[60] border-r border-white/10 flex flex-col overflow-y-auto hide-scrollbar pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 pb-0 flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-16 h-24 rounded overflow-hidden shrink-0">
                    <img loading="lazy" src={movie.posterUrl || undefined} alt={movie.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-cv-cream leading-tight mb-1">{movie.title}</h2>
                    {selectedEpisode && (
                      <p className="text-sm text-cv-gold tracking-wide">E{selectedEpisode.episode}</p>
                    )}
                  </div>
                </div>
                <button onClick={(e) => {
                  e.stopPropagation();
                  setSidebarOpen(false);
                }} className="text-cv-cream/50 hover:text-cv-cream p-2 cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Language Toggle */}
              <div className="px-6 mt-6">
                <div className="bg-white/5 p-1 rounded-lg border border-white/10 flex relative">
                  <div 
                    className={cn(
                      "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md bg-cv-gold transition-all duration-300",
                      language === 'sub' ? "left-1" : "left-[calc(50%+2px)]"
                    )}
                  />
                  <button 
                    onClick={() => { if(language !== 'sub') toggleLanguage(); }}
                    className={cn(
                      "flex-1 py-2 text-sm font-bold relative z-10 transition-colors flex items-center justify-center gap-2 cursor-pointer",
                      language === 'sub' ? "text-cv-gold-content" : "text-cv-cream/70 hover:text-cv-cream"
                    )}
                  >
                    <Globe className="w-4 h-4" /> SUB
                  </button>
                  <button 
                    onClick={() => { if(language !== 'dub') toggleLanguage(); }}
                    className={cn(
                      "flex-1 py-2 text-sm font-bold relative z-10 transition-colors flex items-center justify-center gap-2 cursor-pointer",
                      language === 'dub' ? "text-cv-gold-content" : "text-cv-cream/70 hover:text-cv-cream"
                    )}
                  >
                    <Globe className="w-4 h-4" /> DUB
                  </button>
                </div>
              </div>

              {/* Server Selection */}
              <div className="px-6 mt-6">
                <h3 className="text-cv-cream font-bold mb-2 flex items-center gap-2"><Globe className="w-4 h-4 text-cv-gold" /> Servers</h3>
                <div className="flex flex-col gap-2">
                  <button onClick={() => { setServer('megaplay'); updateIframeSrc(selectedEpisode?.episode || 1, language, 'megaplay', movie?.malId, movie?.title); }} className={`p-2 rounded border text-sm text-left transition-colors ${server === 'megaplay' ? 'border-cv-gold bg-cv-gold/20 text-cv-gold' : 'border-white/10 hover:bg-white/5 text-cv-cream/80'}`}>MegaPlay (MAL)</button>
                  <button onClick={() => { setServer('anikoto'); updateIframeSrc(selectedEpisode?.episode || 1, language, 'anikoto', movie?.malId, movie?.title); }} className={`p-2 rounded border text-sm text-left transition-colors ${server === 'anikoto' ? 'border-cv-gold bg-cv-gold/20 text-cv-gold' : 'border-white/10 hover:bg-white/5 text-cv-cream/80'}`}>Anikoto (Legacy) - Server 13</button>
                </div>
              </div>

              {/* Episodes Section */}
              <div className="mt-6 px-6 pb-24">
                <h3 className="text-cv-cream font-bold mb-4 flex items-center gap-2"><Play className="w-4 h-4 text-cv-gold" /> Episodes</h3>
                
                <div className="mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
                  <h4 className="text-xs font-bold text-cv-slate mb-3 uppercase tracking-wider">Jump to Episode</h4>
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
                      className="flex-1 min-w-[100px] bg-black/50 border border-white/10 focus:border-cv-gold rounded-lg px-3 py-2 text-white outline-none transition-colors text-sm font-serif"
                    />
                    <button
                      onClick={() => handleJumpEpisode(jumpEpisode)}
                      className="px-4 py-2 bg-cv-gold text-cv-gold-content font-bold rounded-lg hover:bg-cv-gold-light transition-all flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                  {jumpError && <p className="text-red-400 text-xs mt-2">{jumpError}</p>}
                </div>
                
                {(movie.episodeCount > 10 || movie.episodeCount === 0) && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-cv-slate mb-3 uppercase tracking-wider">Latest Episodes</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: Math.min(10, movie.episodeCount || 10) }, (_, i) => {
                        const epNum = movie.episodeCount ? movie.episodeCount - 9 + i : i + 1;
                        if (epNum <= 0) return null;
                        return (
                          <button
                            key={epNum}
                            onClick={() => handleJumpEpisode(epNum.toString())}
                            className={cn(
                              "px-3 py-1.5 border rounded-lg text-xs font-bold transition-all cursor-pointer",
                              selectedEpisode?.episode === epNum ? "bg-cv-gold text-cv-gold-content border-cv-gold" : "bg-black/50 hover:bg-white/10 text-white border-white/10"
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
                          "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors group cursor-pointer",
                          selectedEpisode?.episode === ep.episode ? "bg-cv-gold/10 border border-cv-gold/30" : "border border-transparent hover:bg-white/5"
                        )}
                      >
                        <div className="w-16 h-12 rounded bg-cv-bg/50 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-cv-gold/50 transition-colors relative">
                          <Play className={cn("w-5 h-5 transition-colors fill-current", selectedEpisode?.episode === ep.episode ? "text-cv-gold" : "text-cv-slate/50 group-hover:text-cv-gold")} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm truncate font-medium", selectedEpisode?.episode === ep.episode ? "text-cv-gold font-bold" : "text-cv-cream/80 group-hover:text-cv-cream")}>
                            {ep.episode}. {ep.title}
                          </p>
                          {ep.jp_title && <p className="text-xs text-cv-slate truncate">{ep.jp_title}</p>}
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
          background: rgba(212, 168, 83, 0.5);
        }
      `}</style>
    </div>
  );
}
