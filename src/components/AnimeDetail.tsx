import React, { useState, useEffect } from 'react';
import { Play, Plus, Check, ArrowLeft, Star, Clock, Calendar , Share2} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { kitsuApi, anikotoApi } from '../api';
import { cn } from '../lib/utils';
import { useApp } from '../store';
import { Movie } from '../types';
import { getDominantColor } from '../lib/colorThief';

export function AnimeDetail({ id }: { id: string }) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, setAmbientColor } = useApp();
  const [movie, setMovie] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jumpEpisode, setJumpEpisode] = useState<string>('');
  const [jumpError, setJumpError] = useState<string | null>(null);
  
  const inWatchlist = movie ? isInWatchlist(movie.id) : false;

  
  useEffect(() => {
    if (movie) {
      document.title = `CineVault | ${movie.title}`;
      if (movie.backdrop_path) {
        // Assume backdrop is a direct URL for Kitsu or just standard TMDB if applicable
        const imageUrl = movie.backdrop_path;
        getDominantColor(imageUrl).then(color => {
          setAmbientColor(color);
        }).catch(() => setAmbientColor(null));
      }
    }
    return () => setAmbientColor(null);
  }, [movie, setAmbientColor]);

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      setIsLoading(true);
      try {
        const res = await kitsuApi.getDetails(id);
        if (isMounted && res && res.data) {
           const mappedMovie = kitsuApi.mapKitsuToInternal(res.data, res.included);
           setMovie(mappedMovie);
           setEpisodes(mappedMovie.episodes || []);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setError('Unable to load Anime data right now. Please try again later.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchDetail();
    return () => { isMounted = false; };
  }, [id]);


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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cv-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cv-gold/30 border-t-cv-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return error ? (
      <div className="min-h-screen bg-cv-bg pt-24 pb-32 px-6 lg:px-12 flex justify-center items-start">
        <div className="glass-panel border-red-500/30 p-8 rounded-2xl max-w-lg text-center backdrop-blur-xl mt-20">
          <h3 className="text-2xl font-serif text-cv-cream mb-4">Oops!</h3>
          <p className="text-cv-slate">{error}</p>
        </div>
      </div>
    ) : null;
  }

  const handleWatchlistToggle = () => {
    if (inWatchlist) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist({
        id: movie.id,
        title: movie.title,
        posterUrl: movie.posterUrl,
        type: movie.type,
        rating: movie.rating
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-cv-bg text-cv-cream pb-24"
    >
      {/* Hero Section */}
      <div className="relative h-[70vh] min-h-[600px] w-full">
        <div className="absolute inset-0">
          <img 
            src={movie.backdropUrl || movie.posterUrl || undefined} 
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--theme-bg)] via-[var(--theme-bg)]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--theme-bg)] via-[var(--theme-bg)]/50 to-transparent" />
        </div>

        <button 
          onClick={() => window.history.back()}
          className="absolute top-8 left-8 z-20 w-12 h-12 rounded-full bg-black/40 hover:bg-cv-gold/20 flex items-center justify-center text-cv-cream transition-colors backdrop-blur-md border border-white/10 hover:border-cv-gold/50 cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-10 max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row gap-8 items-end">
            <motion.img 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              src={movie.posterUrl || undefined} 
              alt={movie.title}
              className="w-48 md:w-64 rounded-xl shadow-2xl border border-white/10 hidden md:block"
            />
            
            <div className="flex-1">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center gap-4 text-sm font-medium text-cv-cream mb-4"
              >
                {movie.rating > 0 && (
                  <span className="flex items-center gap-1 bg-cv-gold/20 text-cv-gold px-3 py-1 rounded-full border border-cv-gold/30">
                    <Star className="w-4 h-4 fill-current" />
                    {movie.rating} Rating
                  </span>
                )}
                <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                  <Calendar className="w-4 h-4" />
                  {movie.year}
                </span>
                <span className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                  <Clock className="w-4 h-4" />
                  {movie.duration}
                </span>
                <span className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                  {movie.ageRating}
                </span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-cv-cream mb-4 leading-tight shadow-black drop-shadow-lg"
              >
                {movie.title}
              </motion.h1>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-2 mb-6"
              >
                {movie.genres.map((genre: string) => (
                  <span key={genre} className="text-sm text-cv-slate bg-white/5 px-3 py-1 rounded-md border border-white/5">
                    {genre}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-16 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <p className="text-lg text-cv-slate mb-8 leading-relaxed max-w-4xl">
              {movie.description}
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <button 
                onClick={() => {
                  window.location.hash = `#watch/ani/${id}/${movie.malId || '0'}/1`;
                }}
                className="px-8 py-4 bg-cv-gold hover:bg-cv-gold-light text-cv-gold-content font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(212,168,83,0.3)] hover:shadow-[0_0_30px_rgba(212,168,83,0.5)] hover:scale-105 cursor-pointer"
              >
                <Play className="w-6 h-6 fill-current" />
                Watch Now
              </button>
              
              <button 
                onClick={handleWatchlistToggle}
                className={cn(
                  "px-8 py-4 rounded-lg flex items-center justify-center gap-2 transition-all border backdrop-blur group relative overflow-hidden cursor-pointer",
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


            {/* Episodes */}
            <div className="mb-16">
              <h3 className="text-2xl font-serif font-bold text-cv-cream mb-6 flex items-center gap-2">
                <Play className="w-6 h-6 text-cv-gold" /> Episodes
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                {episodes.map((ep: any) => (
                  <button
                    key={ep.id}
                    onClick={() => {
                      window.location.hash = `#watch/ani/${id}/${ep.number}`;
                    }}
                    className="w-full text-left flex items-center gap-4 p-4 rounded-xl transition-all group bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/20 cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-lg bg-black/50 flex items-center justify-center shrink-0 border border-white/10 group-hover:border-cv-gold/50 transition-colors">
                       <Play className="w-6 h-6 text-cv-gold/50 group-hover:text-cv-gold transition-colors fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold text-cv-cream group-hover:text-cv-gold transition-colors truncate">
                        {ep.number}. {ep.title}
                      </h4>
                      {ep.jp_title && (
                        <p className="text-sm text-cv-slate truncate">{ep.jp_title}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </motion.div>
  );
}
