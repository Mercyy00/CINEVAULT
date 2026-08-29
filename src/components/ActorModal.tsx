import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, User, Sparkles } from 'lucide-react';
import { api } from '../api';
import { Movie, formatRating } from '../types';
import { PosterImage } from './PosterImage';
import { cn } from '../lib/utils';

interface ActorModalProps {
  actorId: string | null;
  actorName: string;
  actorPhoto?: string;
  isOpen: boolean;
  onClose: () => void;
  onMovieSelect: (id: string, type: string) => void;
}

export function ActorModal({
  actorId,
  actorName,
  actorPhoto,
  isOpen,
  onClose,
  onMovieSelect,
}: ActorModalProps) {
  const [details, setDetails] = useState<any | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFullBio, setShowFullBio] = useState(false);

  useEffect(() => {
    if (!isOpen || !actorId) return;

    let mounted = true;
    setLoading(true);
    setShowFullBio(false);

    Promise.allSettled([
      api.getPersonDetails(actorId),
      api.getPersonCombinedCredits(actorId),
    ]).then(([detailsRes, creditsRes]) => {
      if (!mounted) return;

      if (detailsRes.status === 'fulfilled') {
        setDetails(detailsRes.value);
      } else {
        setDetails(null);
      }

      if (creditsRes.status === 'fulfilled' && creditsRes.value?.cast) {
        // Deduplicate, sort by vote count / popularity, map to internal Movie shape
        const unique = new Map<string, Movie>();
        creditsRes.value.cast
          .filter((item: any) => item.poster_path && (item.vote_count ?? 0) > 5)
          .sort((a: any, b: any) => (b.popularity ?? 0) - (a.popularity ?? 0))
          .forEach((item: any) => {
            const mapped = api.mapToInternalMovie(item);
            if (!unique.has(mapped.id)) {
              unique.set(mapped.id, mapped);
            }
          });
        setMovies(Array.from(unique.values()));
      } else {
        setMovies([]);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [actorId, isOpen]);

  // ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-[#0d0e14] border border-white/15 rounded-3xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.95)] z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center text-brand">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold font-display text-foreground">
                  {actorName}
                </h3>
                <p className="text-xs text-brand font-mono uppercase tracking-wider">
                  {details?.known_for_department || 'Featured Actor'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close modal"
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scroll Content */}
          <div className="overflow-y-auto p-5 sm:p-8 space-y-8 custom-scrollbar">
            {/* Actor Bio Header */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-24 sm:w-32 aspect-[2/3] rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-card relative">
                <PosterImage
                  src={details?.profile_path ? api.getImageUrl(details.profile_path, 'w185') : actorPhoto}
                  title={actorName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                  {details?.place_of_birth && (
                    <span>📍 {details.place_of_birth}</span>
                  )}
                  {details?.birthday && (
                    <span>🎂 Born {details.birthday}</span>
                  )}
                  <span className="text-brand">🎬 {movies.length} Known Works</span>
                </div>

                {details?.biography ? (
                  <div>
                    <p className={cn("text-sm sm:text-base text-muted-foreground leading-relaxed", !showFullBio && "line-clamp-4")}>
                      {details.biography}
                    </p>
                    {details.biography.length > 280 && (
                      <button
                        onClick={() => setShowFullBio(!showFullBio)}
                        className="mt-1.5 text-xs text-brand hover:underline font-semibold cursor-pointer"
                      >
                        {showFullBio ? 'Show Less' : 'Read Full Biography'}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Celebrated actor known for powerful cinematic performances.
                  </p>
                )}
              </div>
            </div>

            {/* Filmography Section */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Sparkles className="w-5 h-5 text-brand" />
                <h4 className="text-lg sm:text-xl font-bold font-display text-foreground">
                  Filmography & Known Roles
                </h4>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div
                      key={`actor-skel-${i}`}
                      className="aspect-[2/3] rounded-2xl skeleton-shimmer bg-[#12131b] border border-white/5"
                    />
                  ))}
                </div>
              ) : movies.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No titles found for this actor.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {movies.map((movie) => (
                    <div
                      key={`actor-movie-${movie.id}`}
                      onClick={() => {
                        onClose();
                        onMovieSelect(movie.id, movie.type);
                      }}
                      className="group cursor-pointer flex flex-col"
                    >
                      <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 group-hover:border-brand transition-all relative shadow-card mb-2">
                        <PosterImage
                          src={movie.posterUrl}
                          title={movie.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono font-bold text-white flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 text-[#f5a54a] fill-[#f5a54a]" />
                          <span>{formatRating(movie.rating)}</span>
                        </div>
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[9px] font-mono uppercase font-bold text-white/90">
                          {movie.type}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-brand transition-colors line-clamp-1">
                        {movie.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {movie.year || 'Released'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
