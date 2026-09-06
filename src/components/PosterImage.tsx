import { useState, useEffect, useRef } from 'react';
import { Film } from 'lucide-react';
import { cn } from '../lib/utils';

interface PosterImageProps {
  src: string | null | undefined;
  /**
   * Candidate widths for `src`. Without this, `sizes` below is inert -- which is
   * what it was before: every surface, including a 150px phone card, downloaded
   * the same w500 poster.
   */
  srcSet?: string;
  /** Tiny ~w92 thumbnail for instant blur-up loading */
  thumbSrc?: string | null;
  /** The title being depicted. Used to build meaningful alt text. */
  title: string;
  className?: string;
  containerClassName?: string;
  /** Poster art is decorative when the title is already rendered as text. */
  decorative?: boolean;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  /**
   * Intrinsic aspect ratio, applied to the wrapper so the box is reserved
   * before the image arrives. Defaults to a 2:3 poster.
   */
  aspect?: string;
}

/**
 * Progressive Image Loader
 *
 * Renders a skeleton shimmer while loading, then transitions to crisp artwork
 * as soon as the image loads (or immediately if the browser already has it
 * cached), avoiding permanent blur.
 *
 * The wrapper carries an explicit aspect ratio: the skeleton and the loaded
 * image used to be sized by different rules, which is where the layout shift on
 * row render came from.
 */
export function PosterImage({
  src,
  srcSet,
  thumbSrc,
  title,
  className = '',
  containerClassName = '',
  decorative = false,
  sizes,
  loading = 'lazy',
  fetchPriority,
  aspect = '2 / 3',
}: PosterImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check if image is already cached/loaded by the browser immediately on mount or src change
  useEffect(() => {
    if (!src) return;
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "w-full h-full flex flex-col items-center justify-center gap-2 bg-[#121318] text-muted-foreground p-4 text-center select-none",
          containerClassName || className
        )}
        style={{ aspectRatio: containerClassName || className ? undefined : aspect }}
        role={decorative ? 'presentation' : 'img'}
        aria-label={decorative ? undefined : `${title} — no artwork available`}
      >
        <Film className="w-8 h-8 text-brand/60 mb-1 opacity-70" aria-hidden="true" />
        <span className="px-2 text-center text-[10px] uppercase font-semibold tracking-wider text-foreground/70 line-clamp-2">
          {title}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-[#0c0d12]", containerClassName)}>
      {/* 1. Base Shimmer Placeholder while loading */}
      {!loaded && !thumbSrc && (
        <div className="absolute inset-0 skeleton-shimmer bg-[#14151d] pointer-events-none z-0" />
      )}

      {/* 1.5. LQIP Blur-up if we have a thumbSrc */}
      {!loaded && thumbSrc && (
        <img
          src={thumbSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover filter blur-[8px] scale-[1.1] pointer-events-none z-0 opacity-50"
        />
      )}

      {/* 2. Artwork: Unblurs into full crisp resolution immediately upon loading */}
      <img
        ref={imgRef}
        src={src}
        srcSet={srcSet}
        alt={decorative ? '' : `${title} poster`}
        className={cn(
          "w-full h-full object-cover transition-all duration-300 ease-out relative z-10",
          loaded
            ? "opacity-100 filter-none blur-0 scale-100"
            : "opacity-0 filter blur-sm scale-105",
          className
        )}
        loading={loading}
        decoding="async"
        sizes={sizes}
        fetchPriority={fetchPriority}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
