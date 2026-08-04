import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Plus, Check, Star, Users, Clock, Calendar, Signal, ArrowLeft, ChevronDown, Film , Share2} from 'lucide-react';
import { Movie } from '../types';
import { useApp } from '../store';
import { cn } from '../lib/utils';
import { api, kitsuApi } from '../api';
import { MovieRow } from './MovieRow';
import { getDominantColor } from '../lib/colorThief';


export function MovieDetail({ type, id }: { type: 'movie' | 'tv', id: string }) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, continueWatching, setAmbientColor } = useApp();
  const [movie, setMovie] = useState<Movie | null>(null);
        
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);

  const progressItem = continueWatching.find(i => i.id.toString() === id);
  const hasProgress = progressItem && (progressItem.progress_percentage || 0) > 0;
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  
  
  useEffect(() => {
    if (movie) {
      document.title = `CineVault | ${movie.title}`;
      if (movie.backdrop_path) {
        const imageUrl = `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`;
        getDominantColor(imageUrl).then(color => {
          setAmbientColor(color);
        }).catch(() => setAmbientColor(null));
      }
    }
    return () => setAmbientColor(null);
  }, [movie, setAmbientColor]);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const details = await api.getDetails(type, id);
        if (!mounted) return;
        
        // INTERCEPT ANIME
        if (details.original_language === 'ja' && details.genres?.some((g: any) => g.id === 16 || g.name === 'Animation')) {
          try {
            const query = details.title || details.name || details.original_name;
            const searchRes = await kitsuApi.search(query);
            if (searchRes.data && searchRes.data.length > 0) {
              window.location.hash = `#detail/ani/${searchRes.data[0].id}`;
              return;
            }
          } catch(e) {}
        }
        
        const internalMovie = api.mapToInternalMovie({ ...details, media_type: type });
        
        try {
          const credits = await api.getCredits(type, id);
          if (mounted && credits.cast) {
            internalMovie.cast = credits.cast.slice(0, 10).map((c: any) => ({
              id: c.id.toString(),
              name: c.name,
              character: c.character,
              photoUrl: c.profile_path ? api.getImageUrl(c.profile_path) : 'https://picsum.photos/200/200'
            }));
          }
        } catch (e) {}
        
        setMovie(internalMovie);

        if (type === 'tv' && details.seasons) {
          const validSeasons = details.seasons.filter((s: any) => s.season_number > 0);
          setSeasons(validSeasons);
          
          let defaultSeason = validSeasons.length > 0 ? validSeasons[0].season_number : 1;
          let defaultEpisode = 1;

          // Check continue watching
          const cwItem = continueWatching.find(i => i.id === id);
          if (cwItem && cwItem.season_number) {
            defaultSeason = cwItem.season_number;
            defaultEpisode = cwItem.episode_number || 1;
          }

          if (validSeasons.length > 0) {
            await loadSeason(defaultSeason, defaultEpisode);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
    window.scrollTo(0, 0);
    return () => { mounted = false; };
  }, [type, id]);

  const loadSeason = async (seasonNumber: number, defaultEp: number = 1) => {
    setSelectedSeason(seasonNumber);
    setIsLoadingEpisodes(true);
    try {
      const seasonDetails = await api.getSeasonDetails(id, seasonNumber);
      if (seasonDetails.episodes) {
        setEpisodes(seasonDetails.episodes);
        setSelectedEpisode(defaultEp);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingEpisodes(false);
    }
  };

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    if (inWatchlist) {
      removeFromWatchlist(movie!.id);
    } else {
      addToWatchlist(movie!);
      
      // Particle Burst
      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      
      for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const angle = (i * 45) * (Math.PI / 180);
        const distance = 40 + Math.random() * 20;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 600);
      }
    }
  };

  const inWatchlist = movie ? isInWatchlist(movie.id) : false;


  const handleShare = async () => {
    if (!movie) return;
    const shareData = {
      title: `CineVault: ${movie.title}`,
      text: `Check out ${movie.title} on CineVault!`,
      url: window.location.href
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        console.error("Share failed", e);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Fallback
    }
  };

  useEffect(() => {
    if (movie) {
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', `CineVault: ${movie.title}`);
      
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute('content', movie.backdropUrl || movie.posterUrl || '');
    }
  }, [movie]);

  if (!movie) {
    return <div className="pt-32 min-h-screen flex items-center justify-center text-cv-slate"><div className="w-8 h-8 border-4 border-cv-gold border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-cv-bg pb-24 relative"
    >
      {/* Parallax Backdrop */}
      <div className="absolute top-0 inset-x-0 h-[80vh] pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: `url(${movie.backdropUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cv-bg via-cv-bg/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-cv-bg via-cv-bg/50 to-transparent" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 md:px-10 pt-[15vh]">
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onClick={() => {
            const current = window.location.hash;
            window.history.back();
            setTimeout(() => {
              if (window.location.hash === current) {
                window.location.hash = '#home';
              }
            }, 100);
          }}
          className="inline-flex items-center gap-2 text-cv-slate hover:text-cv-gold hover:drop-shadow-[0_0_8px_rgba(212,168,83,0.8)] transition-all mb-8 group cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back
        </motion.button>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 mb-16">
          {/* Poster */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-[320px] mx-auto lg:mx-0 shrink-0 relative group"
            style={{ perspective: 1000 }}
          >
            <motion.div 
              whileHover={{ rotateX: 5, rotateY: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="aspect-[2/3] rounded-lg overflow-hidden border-2 border-cv-gold/30 relative shadow-[0_0_50px_rgba(0,0,0,0.9)]"
            >
              {movie.posterUrl ? (
                <img loading="lazy" src={movie.posterUrl || undefined} alt={movie.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-black/50 glass-panel flex flex-col items-center justify-center text-cv-slate">
                  <Film className="w-20 h-20 text-cv-gold opacity-50 mb-4" />
                  <span className="text-xl font-medium text-center px-4">{movie.title}</span>
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Details */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 pt-8 lg:pt-0"
          >
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-cv-cream mb-4 text-glow leading-tight">
              {movie.title}
            </h1>
            {movie.genres?.includes('Animation') && type === 'tv' && (
              <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-200 text-sm flex items-start gap-3 backdrop-blur-md">
                <div className="mt-0.5"><span className="text-xl">⚠️</span></div>
                <p><strong>Note:</strong> Streaming servers for Anime may vary here. Check the dedicated <strong>Anime tab</strong> for guaranteed playback.</p>
              </div>
            )}
            {movie.tagline && (
              <p className="text-xl md:text-2xl font-serif italic text-cv-gold-light/80 mb-6">
                "{movie.tagline}"
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-cv-cream/80 mb-8">
              <div className="flex items-center gap-1.5 text-cv-gold bg-cv-gold/10 px-3 py-1 rounded-full border border-cv-gold/20 shadow-[0_0_10px_rgba(212,168,83,0.2)]">
                <Star className="w-4 h-4 fill-current" />
                <span className="ml-1 font-bold tracking-wide">{movie.rating.toFixed(1)} <span className="text-cv-slate text-xs font-normal">/ 10</span></span>
              </div>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-cv-slate" /> {movie.year}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-cv-slate" /> {movie.duration}</span>
              <span className="px-2 py-0.5 border border-cv-slate/40 rounded text-cv-slate">{movie.ageRating}</span>
              {movie.genres?.map(g => (
                <span key={g} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-cv-cream/80 text-xs">
                  {g}
                </span>
              ))}
            </div>

            <p className="text-lg text-cv-slate mb-8 leading-relaxed max-w-4xl">
              {movie.description}
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              {hasProgress ? (
                <>
                  <button 
                    onClick={() => {
                      if (type === 'tv') {
                        window.location.hash = `#watch/tv/${id}/${progressItem?.season_number || selectedSeason}/${progressItem?.episode_number || selectedEpisode}`;
                      } else {
                        window.location.hash = `#watch/movie/${id}`;
                      }
                    }}
                    className="px-8 py-4 bg-cv-gold hover:bg-cv-gold-light text-cv-gold-content font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(212,168,83,0.3)] hover:shadow-[0_0_30px_rgba(212,168,83,0.5)] hover:scale-105"
                  >
                    <Play className="w-6 h-6 fill-current" />
                    Continue
                  </button>
                  <button 
                    onClick={() => {
                      if (type === 'tv') {
                        window.location.hash = `#watch/tv/${id}/1/1`;
                      } else {
                        window.location.hash = `#watch/movie/${id}`;
                      }
                    }}
                    className="px-8 py-4 bg-white/10 hover:bg-white/20 text-cv-cream font-bold rounded-lg flex items-center justify-center gap-2 transition-all border border-white/20 hover:border-white/40 backdrop-blur-md"
                  >
                    <Play className="w-5 h-5" />
                    Watch From Beginning
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => {
                    if (type === 'tv') {
                      window.location.hash = `#watch/tv/${id}/${selectedSeason}/${selectedEpisode}`;
                    } else {
                      window.location.hash = `#watch/movie/${id}`;
                    }
                  }}
                  className="px-8 py-4 bg-cv-gold hover:bg-cv-gold-light text-cv-gold-content font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(212,168,83,0.3)] hover:shadow-[0_0_30px_rgba(212,168,83,0.5)] hover:scale-105"
                >
                  <Play className="w-6 h-6 fill-current" />
                  Watch Now
                </button>
              )}
              <button 
                onClick={handleWatchlistToggle}
                className={cn(
                  "px-8 py-4 rounded-lg flex items-center justify-center gap-2 transition-all border backdrop-blur group relative overflow-hidden",
                  inWatchlist 
                    ? "bg-white/10 border-white/20 text-cv-cream hover:bg-white/20" 
                    : "glass-panel border-cv-gold/30 text-cv-gold hover:bg-cv-gold/10 hover:border-cv-gold/60"
                )}
              >
                {inWatchlist ? <Check className="w-5 h-5 text-cv-gold" /> : <Plus className="w-5 h-5" />}
                {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </button>

              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-300 glass-panel border-white/20 text-cv-cream hover:bg-white/10"
              >
                <Share2 className="w-5 h-5" /> Share
              </button>
            </div>


            {/* Cast */}
            {movie.cast && movie.cast.length > 0 && (
              <div className="mb-16">
                <h3 className="text-2xl font-serif font-bold text-cv-cream mb-6 flex items-center gap-2">
                  <Users className="w-6 h-6 text-cv-gold" /> Principal Cast
                </h3>
                <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-6 -mx-4 px-4 lg:mx-0 lg:px-0">
                  {movie.cast.map((actor, idx) => (
                    <motion.div 
                      key={actor.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.08, duration: 0.4 }}
                      className="flex flex-col items-center text-center group cursor-pointer w-24 shrink-0 relative"
                    >
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-cv-gold transition-colors mb-3">
                        <img loading="lazy" src={actor.photoUrl || undefined} alt={actor.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <span className="text-sm font-medium text-cv-cream mb-1">{actor.name}</span>
                      
                      {/* Tooltip */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-cv-panel border border-cv-gold/30 px-3 py-1.5 rounded text-xs text-cv-gold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        {actor.character}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-cv-panel border-b border-r border-cv-gold/30 rotate-45" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Episode Selector for TV Shows */}
            {type === 'tv' && seasons.length > 0 && (
              <div className="mb-16 glass-panel rounded-2xl p-6 border border-white/10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                  <h3 className="text-2xl font-serif font-bold text-cv-cream flex items-center gap-2">
                    <Play className="w-6 h-6 text-cv-gold fill-current" /> Episodes
                  </h3>
                  <div className="relative min-w-[200px]">
                    <select
                      value={selectedSeason}
                      onChange={(e) => loadSeason(parseInt(e.target.value))}
                      className="w-full appearance-none bg-black/40 border border-white/20 hover:border-cv-gold rounded-full px-6 py-3 text-cv-cream focus:outline-none focus:border-cv-gold text-lg font-serif transition-colors cursor-pointer"
                    >
                      {seasons.map((s: any) => (
                        <option key={s.season_number} value={s.season_number} className="bg-cv-bg text-cv-cream">
                          Season {s.season_number}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-cv-slate pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                  {isLoadingEpisodes ? (
                    <div className="py-12 flex justify-center">
                      <div className="w-10 h-10 border-4 border-cv-gold/30 border-t-cv-gold rounded-full animate-spin" />
                    </div>
                  ) : (
                    episodes.map((ep: any) => (
                      <button
                        key={ep.id}
                        onClick={() => {
                          setSelectedEpisode(ep.episode_number);
                          window.location.hash = `#watch/tv/${id}/${selectedSeason}/${ep.episode_number}`;
                        }}
                        className={cn(
                          "w-full text-left flex flex-col md:flex-row gap-4 p-4 rounded-xl transition-all group",
                          selectedEpisode === ep.episode_number 
                            ? "bg-cv-gold/10 border border-cv-gold/50 shadow-[0_0_15px_rgba(212,168,83,0.15)]" 
                            : "bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/20"
                        )}
                      >
                        <div className="w-full md:w-48 aspect-video rounded-lg overflow-hidden shrink-0 relative bg-black/50">
                          {ep.still_path ? (
                            <img loading="lazy" src={ep.still_path ? api.getImageUrl(ep.still_path) : undefined} alt={ep.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-cv-slate/30">
                              <Play className="w-8 h-8" />
                            </div>
                          )}
                          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs font-bold text-cv-cream backdrop-blur">
                            {ep.runtime || 45}m
                          </div>
                          {selectedEpisode === ep.episode_number && (
                            <div className="absolute inset-0 bg-cv-gold/20 flex items-center justify-center backdrop-blur-[1px]">
                              <Play className="w-8 h-8 text-cv-gold fill-current drop-shadow-lg" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={cn("text-lg font-bold mb-2 truncate", selectedEpisode === ep.episode_number ? "text-cv-gold" : "text-cv-cream group-hover:text-cv-gold transition-colors")}>
                            {ep.episode_number}. {ep.name}
                          </h4>
                          <p className="text-sm text-cv-slate line-clamp-3 leading-relaxed">
                            {ep.overview || "No description available."}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
            
          </motion.div>
        </div>
        
        {/* Related Content */}
        <div className="mt-12">
          <MovieRow 
            title="More Like This" 
            fetchFn={(page) => api.getSimilar(type, id, page)} 
            onMovieSelect={(similarId, similarType) => window.location.hash = similarType === 'anime' ? `#detail/ani/${similarId}` : `#${similarType}/${similarId}`} 
          />
        </div>

      </div>
    </motion.div>
  );
}
