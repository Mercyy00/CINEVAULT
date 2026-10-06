import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Plus,
  Check,
  Star,
  Users,
  Clock,
  Calendar,
  ArrowLeft,
  Share2,
  Download,
  X,
  Clapperboard,
  AlertTriangle,
} from 'lucide-react';
import { Movie, formatRating } from '../types';
import { useApp } from '../store';
import { cn } from '../lib/utils';
import { api, anilistApi, fetchExternalRatings } from '../api';
import { MovieRow } from './MovieRow';
import { getDominantColor } from '../lib/colorThief';
import { PosterImage } from './PosterImage';
import { ActorModal } from './ActorModal';
import { Breadcrumbs } from './Breadcrumbs';
import { LemniscateBloom } from './LemniscateBloom';
import { updateSeoMetadata, generateMediaStructuredData } from '../lib/seo';
import { navigate, goToWatch, goToDetail, goToDownload } from '../lib/navigation';
import { triggerHaptic } from '../lib/mobile';

export function MovieDetail({ type, id }: { type: 'movie' | 'tv'; id: string }) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, continueWatching, setAmbientColor, showToast } = useApp();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [imdbId, setImdbId] = useState<string>('');

  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [seasonCache, setSeasonCache] = useState<Map<number, any[]>>(new Map());
  const [collection, setCollection] = useState<{ name: string; parts: Movie[] } | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);

  // Cast & Actor Modal
  const [selectedActor, setSelectedActor] = useState<{ id: string; name: string; photo?: string } | null>(null);

  // Trailers & Videos
  const [videos, setVideos] = useState<Array<{ id: string; key: string; name: string; type: string }>>([]);
  const [activeTrailer, setActiveTrailer] = useState<string | null>(null);

  const progressItem = continueWatching.find((i) => i.id.toString() === id);
  const hasProgress = progressItem && (progressItem.progress_percentage || 0) > 0;
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    if (movie) {
      updateSeoMetadata({
        title: `${movie.title} (${movie.year || 'Film'})`,
        description: movie.description || `Watch ${movie.title} on CineVault. Stream with full cast info, ratings, and trailers.`,
        ogImage: movie.backdropUrl || movie.posterUrl || undefined,
        ogType: type === 'movie' ? 'video.movie' : 'video.tv_show',
        structuredData: generateMediaStructuredData({
          title: movie.title,
          overview: movie.description,
          posterUrl: movie.posterUrl,
          backdropUrl: movie.backdropUrl,
          releaseDate: movie.year ? String(movie.year) : undefined,
          rating: movie.rating,
          voteCount: movie.voteCount,
          genres: movie.genres,
          actors: movie.cast?.map((c) => c.name),
          mediaType: type,
        }),
      });

      if (movie.backdropUrl) {
        getDominantColor(movie.backdropUrl)
          .then((color) => {
            setAmbientColor(color);
          })
          .catch(() => setAmbientColor(null));
      }
    }
    return () => setAmbientColor(null);
  }, [movie, setAmbientColor, type]);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const details = await api.getDetails(type, id);
        if (!mounted) return;

        // Intercept Anime
        if (
          details.original_language === 'ja' &&
          details.genres?.some((g: any) => g.id === 16 || g.name === 'Animation')
        ) {
          try {
            const query = details.title || details.name || details.original_name || '';
            const searchRes = await anilistApi.search(query);
            if (searchRes.results && searchRes.results.length > 0) {
              goToDetail(searchRes.results[0].id, 'anime');
              return;
            }
          } catch (err) {
            console.warn('Anime search fallback error:', err);
          }
        }

        const internalMovie = api.mapToInternalMovie({ ...details, media_type: type });

        let resolvedImdb = details.external_ids?.imdb_id || details.imdb_id || '';
        if (!resolvedImdb) {
          try {
            const external = await api.getExternalIds(type, id);
            resolvedImdb = external.imdb_id ?? '';
          } catch {
            // Optional external IMDb lookup
          }
        }
        if (mounted) {
          setImdbId(resolvedImdb);
        }

        if (resolvedImdb) {
          fetchExternalRatings(resolvedImdb).then((ratings) => {
            if (mounted && (ratings.imdbRating || ratings.rtRating || ratings.metacriticRating)) {
              setMovie((prev: any) =>
                prev
                  ? {
                      ...prev,
                      imdbRating: ratings.imdbRating,
                      rtRating: ratings.rtRating,
                      metacriticRating: ratings.metacriticRating,
                    }
                  : prev
              );
            }
          }).catch(() => {});
        }

        // Fetch Credits
        try {
          const credits = await api.getCredits(type, id);
          if (mounted && credits.cast) {
            internalMovie.cast = credits.cast.slice(0, 16).map((c: any) => ({
              id: c.id.toString(),
              name: c.name,
              character: c.character,
              photoUrl: api.getImageUrl(c.profile_path) ?? '',
            }));
          }
        } catch (err) {
          console.warn('Credits load error:', err);
        }

        // Fetch Trailers & Videos
        try {
          const vids = await api.getVideos(type, id);
          if (mounted && vids.results) {
            const yt = vids.results.filter((v) => v.site === 'YouTube' && v.key);
            setVideos(yt);
          }
        } catch (err) {
          console.warn('Videos load error:', err);
        }

        if (internalMovie.collectionId) {
          api.getCollection(internalMovie.collectionId).then(col => {
            if (mounted && col.parts) {
              setCollection({
                name: col.name,
                parts: col.parts.map((p: any) => api.mapToInternalMovie(p)).filter((p: Movie) => p.id !== id)
              });
            }
          }).catch(console.error);
        }

        try {
          const rev = await api.getReviews(type, id);
          if (mounted && rev.results) {
            setReviews(api.mapReviews(rev));
          }
        } catch (err) {
          console.warn('Reviews load error:', err);
        }

        setMovie(internalMovie);

        if (!internalMovie.logoUrl) {
          const mediaType = type === 'tv' ? 'tv' : 'movie';
          api.resolveTmdbLogo(mediaType, id).then(async (logo) => {
            const finalLogo = logo || (await api.resolveTitleLogo(internalMovie.title, mediaType));
            if (finalLogo && mounted) {
              setMovie((prev: any) => (prev ? { ...prev, logoUrl: finalLogo } : prev));
            }
          });
        }

        if (type === 'tv' && details.seasons) {
          const validSeasons = details.seasons.filter((s: any) => s.season_number > 0);
          setSeasons(validSeasons);

          let defaultSeason = validSeasons.length > 0 ? validSeasons[0].season_number : 1;
          let defaultEpisode = 1;

          const cwItem = continueWatching.find((i) => i.id === id);
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
    return () => {
      mounted = false;
    };
  }, [type, id]);

  const loadSeason = async (seasonNumber: number, defaultEp: number = 1) => {
    setSelectedSeason(seasonNumber);
    if (seasonCache.has(seasonNumber)) {
      setEpisodes(seasonCache.get(seasonNumber)!);
      setSelectedEpisode(defaultEp);
      return;
    }
    setIsLoadingEpisodes(true);
    try {
      const seasonDetails = await api.getSeasonDetails(id, seasonNumber);
      if (seasonDetails.episodes) {
        setEpisodes(seasonDetails.episodes);
        setSeasonCache(prev => new Map(prev).set(seasonNumber, seasonDetails.episodes!));
        setSelectedEpisode(defaultEp);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingEpisodes(false);
    }
  };

  const handleDownload = (targetSeason?: number, targetEp?: number) => {
    const finalImdb = imdbId || movie?.imdbId || id;
    const s = targetSeason !== undefined ? targetSeason : selectedSeason;
    const e = targetEp !== undefined ? targetEp : selectedEpisode;

    goToDownload(id, type, s, e, finalImdb);
  };

  if (!movie) {
    return (
      <div className="min-h-screen bg-background text-foreground animate-pulse" aria-busy="true">
        <div className="w-full h-[50vh] sm:h-[65vh] skeleton-shimmer bg-[#0f1016]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 -mt-32 sm:-mt-48 relative z-10">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-16 mb-12">
            <div className="w-48 sm:w-72 aspect-[2/3] rounded-2xl skeleton-shimmer bg-[#14151f] mx-auto lg:mx-0 shrink-0 border border-white/10" />
            <div className="flex-1 space-y-4 pt-4">
              <div className="h-10 w-3/4 rounded-xl skeleton-shimmer bg-[#181926]" />
              <div className="h-5 w-1/3 rounded-lg skeleton-shimmer bg-[#14151f]" />
              <div className="h-24 w-full rounded-xl skeleton-shimmer bg-[#14151f]" />
              <div className="h-12 w-48 rounded-full skeleton-shimmer bg-[#181926]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inWatchlist = isInWatchlist(movie.id);

  const handleWatchlistToggle = () => {
    triggerHaptic('medium');
    if (inWatchlist) {
      removeFromWatchlist(movie.id);
    } else {
      addToWatchlist(movie);
    }
  };

  const handleShare = () => {
    triggerHaptic('selection');
    if (navigator.share) {
      navigator
        .share({
          title: `Watch ${movie.title} on CineVault`,
          text: `Check out ${movie.title} (${movie.year}) on CineVault!`,
          url: window.location.href,
        })
        .then(() => triggerHaptic('success'))
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!');
      triggerHaptic('success');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background text-foreground pb-24 relative overflow-hidden"
    >
      {/* 7movies Cinematic Backdrop with Multi-Stage Shading */}
      <div className="absolute top-0 left-0 right-0 h-[65vh] sm:h-[82vh] overflow-hidden -z-10 select-none">
        <PosterImage
          src={movie.backdropUrl || movie.posterUrl}
          title={movie.title}
          className="w-full h-full object-cover opacity-35 filter brightness-95 scale-105"
        />
        <div className="dp-hero-shade" />
        <div className="hero-fade" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28">
        {/* Breadcrumb navigation */}
        <Breadcrumbs
          items={[
            { label: type === 'movie' ? 'Movies' : 'TV Shows', href: type === 'movie' ? '#movies' : '#tvshows' },
            { label: movie.title },
          ]}
        />

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => {
            const current = window.location.pathname;
            window.history.back();
            setTimeout(() => {
              if (window.location.pathname === current) {
                navigate('/');
              }
            }, 100);
          }}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-brand transition-all mb-6 sm:mb-8 group cursor-pointer text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" /> Back
        </motion.button>

        {/* ═══ HERO HEADER: POSTER + SYNOPSIS & ACTIONS ═══ */}
        {/* Mobile Header: Side-by-side poster + primary metadata */}
        <div className="flex sm:hidden items-start gap-4 mb-5">
          <div className="w-28 aspect-[2/3] rounded-2xl overflow-hidden border border-white/15 relative shadow-card shrink-0">
            <PosterImage
              src={movie.posterUrl}
              title={movie.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            {movie.logoUrl ? (
              <div className="mb-2 max-w-[190px]">
                <h1 className="sr-only">{movie.title}</h1>
                <img
                  src={movie.logoUrl}
                  alt={movie.title}
                  className="max-h-12 w-auto object-contain object-left drop-shadow-md"
                />
              </div>
            ) : (
              <h1 className="text-2xl font-display font-black text-foreground mb-2 leading-tight drop-shadow-md">
                {movie.title}
              </h1>
            )}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-foreground/80 mb-2.5">
              <div className="flex items-center gap-1 text-brand bg-brand/10 px-2 py-0.5 rounded-lg border border-brand/20 font-mono font-bold">
                <Star className="w-3 h-3 fill-current" />
                <span>{formatRating(movie.rating)}</span>
              </div>
              {movie.imdbRating && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-[#f5c518]/15 border border-[#f5c518]/30 text-[#f5c518] font-bold text-[10px] font-mono">
                  <span className="bg-[#f5c518] text-black text-[8px] font-black px-0.5 rounded leading-none">IMDb</span>
                  <span>{movie.imdbRating}</span>
                </div>
              )}
              {movie.rtRating && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold text-[10px] font-mono">
                  <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                  <span>{movie.rtRating}</span>
                </div>
              )}
              <span className="font-mono">{movie.year || '—'}</span>
              {movie.duration && (
                <>
                  <span>•</span>
                  <span>{movie.duration}</span>
                </>
              )}
              {movie.ageRating && (
                <span className="px-1.5 py-0.5 border border-white/20 rounded text-[10px] font-mono">
                  {movie.ageRating}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {movie.genres?.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-foreground/70 text-[10px] font-mono"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-14 mb-14 items-start">
          {/* Desktop Poster */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden sm:block w-full max-w-[220px] sm:max-w-[280px] lg:max-w-[320px] mx-auto lg:mx-0 shrink-0 relative group"
          >
            <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/15 relative shadow-card">
              <PosterImage
                src={movie.posterUrl}
                title={movie.title}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* Details Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex-1 min-w-0 w-full"
          >
            <p className="eyebrow">{type === 'tv' ? 'Television Series' : 'Feature Film'}</p>

            {movie.logoUrl ? (
              <div className="hidden sm:block mb-4 max-w-[min(90vw,28rem)] lg:max-w-[min(80vw,38rem)]">
                <h1 className="sr-only">{movie.title}</h1>
                <img
                  src={movie.logoUrl}
                  alt={movie.title}
                  className="max-h-20 sm:max-h-24 lg:max-h-32 w-auto object-contain object-left drop-shadow-2xl mb-3"
                />
              </div>
            ) : (
              <h1 className="hidden sm:block dp-title mb-3">
                {movie.title}
              </h1>
            )}

            {movie.genres?.includes('Animation') && type === 'tv' && (
              <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-200 text-xs sm:text-sm flex items-start gap-2.5 backdrop-blur-md">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-purple-200" aria-hidden="true" />
                <p>
                  <strong>Note:</strong> Streaming servers for Anime may vary here. Check the dedicated{' '}
                  <strong>Anime tab</strong> for guaranteed playback.
                </p>
              </div>
            )}

            {movie.tagline && (
              <p className="text-sm sm:text-lg font-display italic text-[#929093] mb-4">
                "{movie.tagline}"
              </p>
            )}

            {/* 7movies Slash-separated Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="dp-genres mb-4">
                {movie.genres.map((g) => (
                  <span key={g}>{g}</span>
                ))}
              </div>
            )}

            {/* 7movies Metadata Line in DM Mono */}
            <div className="hidden sm:flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-medium text-[#f3f0ea] mb-6 font-mono">
              <div className="flex items-center gap-1.5 text-[#f3f0ea] bg-white/[0.04] px-3 py-1 rounded-full border border-white/10">
                <Star className="w-3.5 h-3.5 fill-[#f5c518] text-[#f5c518]" />
                <span className="font-bold tracking-wide">
                  {formatRating(movie.rating)}{' '}
                  <span className="text-[#929093] text-[10px] sm:text-xs font-normal">/ 10</span>
                </span>
              </div>

              {movie.imdbRating && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[#f3f0ea] font-bold text-xs">
                  <span className="bg-[#f5c518] text-[#0b0b0d] text-[9px] font-black px-1 py-0.5 rounded leading-none tracking-wide">IMDb</span>
                  <span>{movie.imdbRating}</span>
                </div>
              )}

              {movie.rtRating && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[#f3f0ea] font-bold text-xs">
                  <Star className="w-3.5 h-3.5 fill-current text-rose-400" aria-hidden="true" />
                  <span>{movie.rtRating}</span>
                </div>
              )}

              {movie.metacriticRating && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[#f3f0ea] font-bold text-xs">
                  <span className="bg-white/15 text-[#f3f0ea] text-[9px] font-black px-1 py-0.5 rounded leading-none tracking-wide">META</span>
                  <span>{movie.metacriticRating}</span>
                </div>
              )}

              <span className="flex items-center gap-1.5 text-[#929093]">
                <Calendar className="w-3.5 h-3.5" /> {movie.year}
              </span>
              <span className="flex items-center gap-1.5 text-[#929093]">
                <Clock className="w-3.5 h-3.5" /> {movie.duration}
              </span>
              {movie.ageRating && (
                <span className="px-2 py-0.5 border border-white/20 rounded-full text-[#929093] text-[10px] sm:text-xs">
                  {movie.ageRating}
                </span>
              )}
            </div>

            {/* Description with Mobile Read More */}
            <div className="mb-8">
              <p className={cn(
                "dp-overview text-sm sm:text-base leading-relaxed max-w-3xl",
                !showFullDesc && "line-clamp-3 sm:line-clamp-none"
              )}>
                {movie.description}
              </p>
              {movie.description && movie.description.length > 180 && (
                <button
                  type="button"
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="sm:hidden text-xs text-[#f3f0ea] underline font-mono mt-1.5 cursor-pointer block"
                >
                  {showFullDesc ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>

            {/* 7movies Action Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3.5">
              {hasProgress ? (
                <>
                  <button
                    onClick={() => {
                      goToWatch(
                        id,
                        type as any,
                        progressItem?.season_number || selectedSeason,
                        progressItem?.episode_number || selectedEpisode
                      );
                    }}
                    className="w-full sm:w-auto primary-btn flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Continue Playing
                  </button>
                  <button
                    onClick={() => {
                      goToWatch(id, type as any, 1, 1);
                    }}
                    className="w-full sm:w-auto secondary-btn flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Watch From Beginning
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    goToWatch(id, type as any, selectedSeason, selectedEpisode);
                  }}
                  className="w-full sm:w-auto primary-btn flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Watch Now
                </button>
              )}

              {/* Secondary Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleDownload()}
                  className="flex-1 sm:flex-none secondary-btn flex items-center justify-center gap-2 cursor-pointer"
                  title={
                    type === 'tv'
                      ? `Download S${selectedSeason} E${selectedEpisode} (4K / 1080p / Multi-Server)`
                      : 'Download High-Speed (4K / 1080p / Multi-Server)'
                  }
                >
                  <Download className="w-4 h-4" />
                  <span>{type === 'tv' ? `Download S${selectedSeason}` : 'Download'}</span>
                </button>

                <button
                  onClick={handleWatchlistToggle}
                  className={cn(
                    'flex-1 sm:flex-none secondary-btn flex items-center justify-center gap-2 cursor-pointer',
                    inWatchlist && 'bg-white/[0.14] border-white/30 text-white'
                  )}
                >
                  {inWatchlist ? <Check className="w-4 h-4 text-[#f3f0ea]" /> : <Plus className="w-4 h-4" />}
                  {inWatchlist ? 'In Watchlist' : 'Watchlist'}
                </button>

                <button
                  onClick={handleShare}
                  className="secondary-btn !px-3.5 cursor-pointer flex items-center justify-center"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══ FULL-WIDTH SECTION: WHERE TO WATCH ═══ */}
        {movie.providers && movie.providers.length > 0 && (
          <div className="mb-14 w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground">Where to Watch</h3>
              <span className="text-xs text-muted-foreground font-mono">Powered by JustWatch</span>
            </div>
            <div className="flex gap-6 overflow-x-auto scrollbar-none pb-2">
              {(['flatrate', 'rent', 'buy'] as const).map(kind => {
                const providers = movie.providers!.filter(p => p.kind === kind);
                if (providers.length === 0) return null;
                return (
                  <div key={kind} className="flex flex-col gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      {kind === 'flatrate' ? 'Stream' : kind === 'rent' ? 'Rent' : 'Buy'}
                    </span>
                    <div className="flex gap-3">
                      {providers.map(p => (
                        <div key={p.id} className="group relative w-10 h-10 rounded-xl overflow-hidden bg-white/10 border border-white/10 shadow-sm cursor-pointer">
                          {p.logoUrl && <img src={p.logoUrl} alt={p.name} className="w-full h-full object-cover" />}
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 font-bold border border-white/10 text-white">
                            {p.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ FULL-WIDTH SECTION 1: TV EPISODE SELECTOR ═══ */}
        {type === 'tv' && seasons.length > 0 && (
          <div className="mb-14 bg-[#111215] rounded-[22px] p-6 sm:p-8 border border-white/[0.08] w-full shadow-2xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <h3 className="text-xl sm:text-2xl font-display font-bold text-[#f3f0ea] flex items-center gap-2">
                <Play className="w-5 h-5 fill-current text-[#f3f0ea]" /> Episodes
              </h3>
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 max-w-full">
                {seasons.map((s: any) => (
                  <button
                    key={s.season_number}
                    onClick={() => loadSeason(s.season_number)}
                    className={cn(
                      'px-4 sm:px-5 py-2 sm:py-2.5 rounded-full whitespace-nowrap text-xs sm:text-sm font-mono transition-all border cursor-pointer',
                      selectedSeason === s.season_number
                        ? 'bg-[#f3f0ea] text-[#0b0b0d] border-[#f3f0ea] font-bold shadow-md'
                        : 'bg-white/[0.03] text-[#929093] hover:text-[#f3f0ea] border-white/[0.08] hover:border-white/20'
                    )}
                  >
                    Season {s.season_number}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3.5 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
              {isLoadingEpisodes ? (
                <div className="py-12 flex justify-center">
                  <LemniscateBloom size={56} className="text-[#f3f0ea]" ariaLabel="Loading episodes" />
                </div>
              ) : (
                episodes.map((ep: any) => (
                  <div
                    key={ep.id}
                    onClick={() => {
                      setSelectedEpisode(ep.episode_number);
                      goToWatch(id, 'tv', selectedSeason, ep.episode_number);
                    }}
                    className={cn(
                      'w-full text-left flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-[16px] transition-all group cursor-pointer border',
                      selectedEpisode === ep.episode_number
                        ? 'bg-[#18191f] border-white/25 shadow-lg'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/15'
                    )}
                  >
                    <div className="w-full md:w-48 aspect-video rounded-xl overflow-hidden shrink-0 relative bg-black/50">
                      {ep.still_path ? (
                        <img
                          loading="lazy"
                          src={api.getImageUrl(ep.still_path) ?? undefined}
                          alt={ep.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                          <Play className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs font-bold text-foreground backdrop-blur z-10">
                        {ep.runtime || 45}m
                      </div>
                      {selectedEpisode === ep.episode_number && (
                        <div className="absolute inset-0 bg-brand/20 flex items-center justify-center backdrop-blur-[1px] z-10">
                          <Play className="w-8 h-8 text-brand fill-current drop-shadow-lg" />
                        </div>
                      )}
                      {progressItem?.season_number === selectedSeason && progressItem?.episode_number === ep.episode_number && progressItem?.progress_percentage > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
                          <div className="h-full bg-brand" style={{ width: `${progressItem.progress_percentage}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4
                          className={cn(
                            'text-base sm:text-lg font-bold mb-1 truncate',
                            selectedEpisode === ep.episode_number
                              ? 'text-brand'
                              : 'text-foreground group-hover:text-brand transition-colors'
                          )}
                        >
                          {ep.episode_number}. {ep.name}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {ep.overview || 'No description available.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(selectedSeason, ep.episode_number);
                        }}
                        title={`Download S${selectedSeason} E${ep.episode_number} (Multi-Server Hub)`}
                        className="self-start sm:self-center px-3 py-2 rounded-xl bg-white/5 hover:bg-brand/20 border border-white/10 hover:border-brand/40 text-foreground hover:text-brand transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5 text-brand" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ═══ FULL-WIDTH SECTION: FRANCHISE COLLECTION ═══ */}
        {collection && collection.parts.length > 0 && (
          <div className="mb-14 w-full">
            <h3 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-5 px-3 sm:px-6 lg:px-8">
              <span className="w-1.5 h-5 rounded-full bg-brand shadow-[0_0_10px_var(--theme-accent-glow,rgba(232,133,42,0.8))] inline-block mr-3 align-middle" />
              {collection.name}
            </h3>
            <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
              {collection.parts.map(part => (
                <div
                  key={part.id}
                  onClick={() => goToDetail(part.id, part.type)}
                  className="w-32 sm:w-40 shrink-0 cursor-pointer group flex flex-col"
                >
                  <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 group-hover:border-brand transition-all relative shadow-card mb-2">
                    <PosterImage src={part.posterUrl} title={part.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-brand line-clamp-1">{part.title}</p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{part.year || 'Released'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ FULL-WIDTH SECTION 2: PRINCIPAL CAST (CLICKABLE) ═══ */}
        {movie.cast && movie.cast.length > 0 && (
          <div className="mb-14 w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl sm:text-2xl font-display font-bold text-[#f3f0ea] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#929093]" /> Principal Cast
              </h3>
              <span className="text-xs text-[#929093] font-mono">Filmography</span>
            </div>
            <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
              {movie.cast.map((actor, idx) => (
                <motion.div
                  key={actor.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                  onClick={() =>
                    setSelectedActor({
                      id: actor.id,
                      name: actor.name,
                      photo: actor.photoUrl,
                    })
                  }
                  className="flex flex-col items-center text-center group cursor-pointer w-24 sm:w-28 shrink-0 relative"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-white/10 group-hover:border-white/30 transition-all mb-2.5 relative">
                    <PosterImage
                      src={actor.photoUrl}
                      title={actor.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-[#f3f0ea] group-hover:text-white transition-colors line-clamp-1 w-full font-display">
                    {actor.name}
                  </span>
                  <span className="text-[11px] text-[#929093] line-clamp-1 font-mono w-full">
                    {actor.character || 'Cast'}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ FULL-WIDTH SECTION 3: TRAILERS & EXTRAS ═══ */}
        {videos.length > 0 && (
          <div className="mb-14 w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl sm:text-2xl font-display font-bold text-[#f3f0ea] flex items-center gap-2">
                <Clapperboard className="w-5 h-5 text-[#929093]" /> Trailers & Extras
              </h3>
              <span className="text-xs text-[#929093] font-mono">{videos.length} Clips</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {videos.slice(0, 8).map((vid) => (
                <div
                  key={`trailer-${vid.id}`}
                  onClick={() => setActiveTrailer(vid.key)}
                  className="group cursor-pointer rounded-[14px] overflow-hidden border border-white/[0.08] hover:border-white/20 bg-[#141417] transition-all relative flex flex-col shadow-card"
                >
                  <div className="aspect-video relative overflow-hidden bg-black/60">
                    <img
                      loading="lazy"
                      src={`https://img.youtube.com/vi/${vid.key}/hqdefault.jpg`}
                      alt={vid.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#f3f0ea] text-[#0b0b0d] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold uppercase text-white/90 border border-white/10">
                      {vid.type || 'Trailer'}
                    </span>
                  </div>
                  <div className="p-3.5">
                    <h4 className="text-sm font-semibold text-[#f3f0ea] group-hover:text-white transition-colors line-clamp-1 font-display">
                      {vid.name}
                    </h4>
                    <p className="text-[11px] text-[#929093] font-mono mt-0.5">Watch Preview</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ FULL-WIDTH SECTION: REVIEWS ═══ */}
        {reviews && reviews.length > 0 && (
          <div className="mb-14 w-full">
            <h3 className="text-xl sm:text-2xl font-display font-bold text-[#f3f0ea] mb-5">
              Reviews
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {reviews.slice(0, 3).map(review => (
                <div key={review.id} className="p-5 bg-[#141417] border border-white/[0.08] rounded-[16px] flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/[0.06] overflow-hidden flex items-center justify-center shrink-0 border border-white/10">
                      {review.avatarUrl ? (
                        <img src={review.avatarUrl} alt={review.user} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[#f3f0ea] font-bold text-sm uppercase">{review.user.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#f3f0ea] line-clamp-1 font-display">{review.user}</h4>
                      <div className="flex items-center gap-2 text-xs text-[#929093] font-mono">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-[#f5c518] fill-[#f5c518]" />
                          {review.rating ? `${review.rating}/10` : '—'}
                        </span>
                        {review.createdAt && <span>• {new Date(review.createdAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-[#929093] line-clamp-3 hover:line-clamp-none transition-all cursor-pointer flex-1 leading-relaxed">
                    {review.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ FULL-WIDTH SECTION 4: RELATED & RECOMMENDED ═══ */}
        <div className="mt-8 space-y-10 w-full">
          {movie.recommendations && movie.recommendations.length > 0 ? (
            <div className="mb-14 w-full">
              <h3 className="text-xl sm:text-2xl font-display font-bold text-[#f3f0ea] mb-5 px-3 sm:px-6 lg:px-8">
                More Like This
              </h3>
              <div className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none pb-8 px-4 sm:px-8 lg:px-12 -mx-4 lg:-mx-8">
                {movie.recommendations.map(rec => (
                  <div
                    key={rec.id}
                    onClick={() => goToDetail(rec.id, rec.type)}
                    className="w-[150px] sm:w-[180px] md:w-[200px] shrink-0 cursor-pointer group flex flex-col"
                  >
                    <div className="aspect-[2/3] rounded-[12px] overflow-hidden border border-white/[0.08] group-hover:border-white/25 transition-all relative shadow-lg mb-2.5 bg-[#141417]">
                      <PosterImage src={rec.posterUrl} title={rec.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white flex items-center gap-1">
                         <Star className="w-2.5 h-2.5 text-[#f5c518] fill-[#f5c518]" />
                         <span>{formatRating(rec.rating)}</span>
                      </div>
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[9px] font-mono uppercase font-bold text-[#929093]">
                         {rec.type}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-[#f3f0ea] group-hover:text-white line-clamp-1 font-display">{rec.title}</p>
                    <p className="text-[11px] text-[#929093] font-mono mt-0.5">{rec.year || 'Released'}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <MovieRow
              title="More Like This"
              fetchFn={(page) => api.getSimilar(type, id, page)}
              onMovieSelect={(similarId, similarType) => {
                goToDetail(similarId, similarType);
              }}
            />
          )}

          <MovieRow
            title="Recommended For You"
            fetchFn={(page) => api.getRecommendations(type, id, page)}
            onMovieSelect={(recId, recType) => {
              goToDetail(recId, recType);
            }}
          />
        </div>
      </div>

      {/* Actor Filmography Modal */}
      <ActorModal
        isOpen={selectedActor !== null}
        actorId={selectedActor?.id || null}
        actorName={selectedActor?.name || ''}
        actorPhoto={selectedActor?.photo}
        onClose={() => setSelectedActor(null)}
        onMovieSelect={(movId, movType) => {
          goToDetail(movId, movType);
        }}
      />

      {/* YouTube Video Player Modal */}
      <AnimatePresence>
        {activeTrailer && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-5xl aspect-video rounded-3xl overflow-hidden bg-black border border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.95)]"
            >
              <button
                onClick={() => setActiveTrailer(null)}
                aria-label="Close trailer"
                className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/70 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md cursor-pointer border border-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeTrailer}?autoplay=1&rel=0`}
                title="Movie Trailer"
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
