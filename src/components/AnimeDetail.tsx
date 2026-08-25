import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Plus, Check, ArrowLeft, Star, Clock, Calendar, Share2, Users, ChevronDown, Film } from 'lucide-react';
import { kitsuApi } from '../api';
import { cn } from '../lib/utils';
import { useApp } from '../store';
import { formatRating } from '../types';
import { Movie } from '../types';
import { MovieRow } from './MovieRow';
import { getDominantColor } from '../lib/colorThief';

export function AnimeDetail({ id }: { id: string }) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, continueWatching, setAmbientColor } = useApp();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [cast, setCast] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [selectedChunk, setSelectedChunk] = useState<number>(0);
  const [chunkOptions, setChunkOptions] = useState<{label: string, start: number, end: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const inWatchlist = movie ? isInWatchlist(movie.id) : false;
  const progressItem = continueWatching.find(i => i.id.toString() === id);
  const hasProgress = progressItem && (progressItem.progress_percentage || 0) > 0;

  useEffect(() => {
    if (movie) {
      document.title = `CineVault | ${movie.title}`;
      if (movie.backdropUrl || movie.posterUrl) {
        const imageUrl = movie.backdropUrl || movie.posterUrl;
        if (imageUrl) {
          getDominantColor(imageUrl).then(color => {
            setAmbientColor(color);
          }).catch(() => setAmbientColor(null));
        }
      }
    }
    return () => setAmbientColor(null);
  }, [movie, setAmbientColor]);

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await kitsuApi.getDetails(id);
        if (!isMounted) return;

        if (res && res.data) {
          const mappedMovie = kitsuApi.mapKitsuToInternal(res.data, res.included);
          setMovie(mappedMovie);

          // Fetch characters / cast
          try {
            const charRes = await kitsuApi.getCharacters(id);
            if (isMounted && charRes && charRes.included) {
              const charObjs = charRes.included.filter((i: any) => i.type === 'characters');
              if (charObjs.length > 0) {
                const mappedCast = charObjs.slice(0, 10).map((char: any) => ({
                  id: char.id?.toString() || Math.random().toString(),
                  name: char.attributes?.canonicalName || char.attributes?.name || 'Character',
                  character: char.attributes?.otherNames?.[0] || char.attributes?.name || 'Main Cast',
                  photoUrl: char.attributes?.image?.original || char.attributes?.image?.medium || 'https://picsum.photos/200/200'
                }));
                setCast(mappedCast);
              }
            }
          } catch (e) {
            console.error("Characters fetch failed", e);
          }

          // Fetch episodes via Anikoto or fallback count
          let episodesData: any[] = [];
          try {
            const searchRes = await fetch(`https://anikotoapi.site/api/anime/search?keyword=${encodeURIComponent(mappedMovie.title)}`);
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
                      title: ep.title || `Episode ${ep.number}`,
                      image: ep.image || '',
                      overview: ep.description || `Episode ${ep.number} of ${mappedMovie.title}`
                    }));
                  }
                }
              }
            }
          } catch (e) {
            console.error("Anikoto proxy fetch failed", e);
          }

          if (episodesData.length === 0) {
            const count = mappedMovie.episodeCount || 12;
            episodesData = Array.from({ length: count }, (_, i) => ({
              id: `ep-${i + 1}`,
              number: i + 1,
              title: `Episode ${i + 1}`,
              image: '',
              overview: `Episode ${i + 1} of ${mappedMovie.title}`
            }));
          }

          setEpisodes(episodesData);

          if (episodesData.length > 50) {
            const chunks = [];
            for (let i = 0; i < episodesData.length; i += 50) {
              chunks.push({
                label: `Episodes ${i + 1}-${Math.min(i + 50, episodesData.length)}`,
                start: i,
                end: Math.min(i + 50, episodesData.length)
              });
            }
            setChunkOptions(chunks);
            setSelectedChunk(0);
          } else {
            setChunkOptions([]);
            setSelectedChunk(0);
          }
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setError('Unable to load anime details. Please try again.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDetail();
    window.scrollTo(0, 0);
    return () => { isMounted = false; };
  }, [id]);

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    if (!movie) return;
    if (inWatchlist) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie);
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      
      for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const angle = (i * 45) * (Math.PI / 180);
        const distance = 40 + Math.random() * 20;
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 600);
      }
    }
  };

  const handleShare = async () => {
    if (!movie) return;
    const shareData = {
      title: `CineVault: ${movie.title}`,
      text: `Watch ${movie.title} on CineVault!`,
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
    }
  };

  if (isLoading) {
    return (
      <div className="pt-32 min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-32 px-6 flex justify-center items-start">
        <div className="glass border-red-500/30 p-8 rounded-2xl max-w-lg text-center backdrop-blur-xl">
          <h3 className="text-2xl font-display font-bold text-foreground mb-4">Error</h3>
          <p className="text-muted-foreground">{error || 'Anime not found.'}</p>
          <button 
            onClick={() => window.location.hash = '#anime'}
            className="mt-6 px-6 py-2.5 bg-brand text-background font-bold rounded-full hover:bg-brand/90 transition-colors"
          >
            Back to Anime
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-background pb-28 sm:pb-36 relative"
    >
      {/* Parallax Backdrop */}
      <div className="absolute top-0 inset-x-0 h-[80vh] pointer-events-none overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105"
          style={{ backgroundImage: `url(${movie.backdropUrl || movie.posterUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
      </div>

      <div className="relative z-10 w-full px-4 sm:px-8 lg:px-12 pt-[15vh]">
        {/* Back Button */}
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onClick={() => {
            const current = window.location.hash;
            window.history.back();
            setTimeout(() => {
              if (window.location.hash === current) {
                window.location.hash = '#anime';
              }
            }, 100);
          }}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-brand transition-all mb-8 group cursor-pointer"
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
              className="aspect-[2/3] rounded-xl overflow-hidden border border-white/10 relative shadow-card"
            >
              {movie.posterUrl ? (
                <img loading="lazy" src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-black/50 glass flex flex-col items-center justify-center text-muted-foreground">
                  <Film className="w-20 h-20 text-brand opacity-50 mb-4" />
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
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-4 leading-tight drop-shadow-lg">
              {movie.title}
            </h1>

            {movie.tagline && (
              <p className="text-xl md:text-2xl font-display italic text-foreground/80 mb-6">
                "{movie.tagline}"
              </p>
            )}

            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-foreground/80 mb-8">
              <div className="flex items-center gap-1.5 text-brand bg-brand/10 px-3 py-1 rounded-full border border-brand/20">
                <Star className="w-4 h-4 fill-current" />
                <span className="ml-1 font-bold tracking-wide">{formatRating(movie.rating)} <span className="text-muted-foreground text-xs font-normal">/ 10</span></span>
              </div>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-muted-foreground" /> {movie.year}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-muted-foreground" /> {movie.duration}</span>
              <span className="px-2 py-0.5 border border-white/20 rounded text-muted-foreground">{movie.ageRating}</span>
              {movie.genres?.map(g => (
                <span key={g} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-foreground/80 text-xs">
                  {g}
                </span>
              ))}
            </div>

            <p className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed max-w-4xl">
              {movie.description}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-12">
              {hasProgress ? (
                <>
                  <button 
                    onClick={() => {
                      window.location.hash = `#watch/ani/${id}/${movie.malId || '0'}/${progressItem?.episode_number || selectedEpisode}`;
                    }}
                    className="px-6 py-3 bg-brand hover:bg-brand/90 text-background font-bold rounded-full flex items-center justify-center gap-2 transition-all shadow-card hover:scale-105 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Continue Ep {progressItem?.episode_number || selectedEpisode}
                  </button>
                  <button 
                    onClick={() => {
                      window.location.hash = `#watch/ani/${id}/${movie.malId || '0'}/1`;
                    }}
                    className="px-6 py-3 glass hover:bg-white/15 text-foreground font-bold rounded-full flex items-center justify-center gap-2 transition-all border border-white/10 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    Watch From Ep 1
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => {
                    window.location.hash = `#watch/ani/${id}/${movie.malId || '0'}/${selectedEpisode}`;
                  }}
                  className="px-6 py-3 bg-brand hover:bg-brand/90 text-background font-bold rounded-full flex items-center justify-center gap-2 transition-all shadow-card hover:scale-105 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Watch Now
                </button>
              )}

              <button 
                onClick={handleWatchlistToggle}
                className={cn(
                  "px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-all border group relative overflow-hidden font-medium cursor-pointer",
                  inWatchlist 
                    ? "bg-white/10 border-white/20 text-foreground hover:bg-white/20" 
                    : "glass border-white/10 text-foreground hover:bg-white/15"
                )}
              >
                {inWatchlist ? <Check className="w-5 h-5 text-brand" /> : <Plus className="w-5 h-5" />}
                {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </button>

              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 glass border-white/10 text-foreground hover:bg-white/15 cursor-pointer"
              >
                <Share2 className="w-5 h-5" /> Share
              </button>
            </div>

            {/* Principal Cast / Characters */}
            {cast.length > 0 && (
              <div className="mb-16">
                <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand" /> Principal Characters & Cast
                </h3>
                <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-6 -mx-4 px-4 lg:mx-0 lg:px-0">
                  {cast.map((actor, idx) => (
                    <motion.div 
                      key={actor.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.08, duration: 0.4 }}
                      className="flex flex-col items-center text-center group cursor-pointer w-24 shrink-0 relative"
                    >
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-brand transition-colors mb-3">
                        <img loading="lazy" src={actor.photoUrl} alt={actor.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <span className="text-sm font-medium text-foreground mb-1 truncate w-full">{actor.name}</span>
                      
                      {/* Tooltip */}
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-card border border-white/10 px-3 py-1.5 rounded-lg text-xs text-brand whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-card">
                        {actor.character}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-b border-r border-white/10 rotate-45" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Episode Selector & Grid */}
            <div className="mb-16 glass rounded-2xl p-6 border border-white/10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground flex items-center gap-2">
                  <Play className="w-5 h-5 text-brand fill-current" /> Episodes
                </h3>
                {chunkOptions.length > 0 && (
                  <div className="relative min-w-[220px]">
                    <select
                      value={selectedChunk}
                      onChange={(e) => setSelectedChunk(parseInt(e.target.value))}
                      className="w-full appearance-none bg-black/40 border border-white/20 hover:border-brand rounded-full px-6 py-3 text-foreground focus:outline-none focus:border-brand text-base font-display transition-colors cursor-pointer"
                    >
                      {chunkOptions.map((chunk, idx) => (
                        <option key={idx} value={idx} className="bg-background text-foreground">
                          {chunk.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  </div>
                )}
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                {(chunkOptions.length > 0 ? episodes.slice(chunkOptions[selectedChunk].start, chunkOptions[selectedChunk].end) : episodes).map((ep: any) => (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setSelectedEpisode(ep.number);
                      window.location.hash = `#watch/ani/${id}/${movie.malId || '0'}/${ep.number}`;
                    }}
                    className={cn(
                      "w-full text-left flex flex-col md:flex-row gap-4 p-4 rounded-xl transition-all group cursor-pointer",
                      selectedEpisode === ep.number 
                        ? "bg-brand/10 border border-brand/40 shadow-card" 
                        : "bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10"
                    )}
                  >
                    <div className="w-full md:w-48 aspect-video rounded-xl overflow-hidden shrink-0 relative bg-black/50">
                      {ep.image ? (
                        <img loading="lazy" src={ep.image} alt={ep.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                          <Play className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs font-bold text-foreground backdrop-blur">
                        24m
                      </div>
                      {selectedEpisode === ep.number && (
                        <div className="absolute inset-0 bg-brand/20 flex items-center justify-center backdrop-blur-[1px]">
                          <Play className="w-8 h-8 text-brand fill-current drop-shadow-lg" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn("text-base sm:text-lg font-bold mb-2 truncate", selectedEpisode === ep.number ? "text-brand" : "text-foreground group-hover:text-brand transition-colors")}>
                        {ep.number}. {ep.title}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {ep.overview || `Episode ${ep.number} of ${movie.title}`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </motion.div>
        </div>

        {/* More Like This */}
        <div className="mt-12">
          <MovieRow 
            title="More Like This" 
            fetchFn={async (page) => {
              const category = movie.genres?.[0] || 'anime';
              const res = await kitsuApi.getByCategory(category.toLowerCase(), page);
              return { results: res.data ? res.data.map((item: any) => kitsuApi.mapKitsuToInternal(item, res.included)) : [] };
            }} 
            onMovieSelect={(similarId, similarType) => {
              window.location.hash = similarType === 'anime' ? `#detail/ani/${similarId}` : `#${similarType}/${similarId}`;
            }} 
          />
        </div>

      </div>
    </motion.div>
  );
}
