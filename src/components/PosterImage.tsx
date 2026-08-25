import { useState } from 'react';
import { Film } from 'lucide-react';

interface PosterImageProps {
  src: string | null | undefined;
  /** The title being depicted. Used to build meaningful alt text. */
  title: string;
  className?: string;
  /** Poster art is decorative when the title is already rendered as text. */
  decorative?: boolean;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
}

/**
 * Renders artwork, or a real placeholder when there is none.
 *
 * This exists because `<img src={movie.posterUrl || undefined}>` was repeated
 * across the app. With no `src`, browsers render a broken-image glyph, and 11
 * of the 24 `<img>` tags in the codebase had no `alt` at all. Both problems are
 * fixed once, here.
 */
export function PosterImage({
  src,
  title,
  className = '',
  decorative = false,
  sizes,
  loading = 'lazy',
  fetchPriority,
}: PosterImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-white/5 text-muted-foreground ${className}`}
        role={decorative ? 'presentation' : 'img'}
        aria-label={decorative ? undefined : `${title} — no artwork available`}
      >
        <Film className="w-8 h-8 opacity-40" aria-hidden="true" />
        <span className="px-2 text-center text-[10px] uppercase tracking-widest opacity-60 line-clamp-2">
          {title}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      // Empty alt marks the image as decorative, which is correct when the
      // title sits next to it in text. Otherwise describe it.
      alt={decorative ? '' : `${title} poster`}
      className={className}
      loading={loading}
      decoding="async"
      sizes={sizes}
      fetchPriority={fetchPriority}
      onError={() => setFailed(true)}
    />
  );
}
