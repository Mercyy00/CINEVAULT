import type { MediaType } from '../types';

/**
 * Hash-route helpers.
 *
 * The expression
 *
 * ```ts
 * (id, type) => { window.location.hash = type === 'anime' ? `#detail/ani/${id}` : `#${type}/${id}`; }
 * ```
 *
 * was pasted into ten `onMovieSelect` props in `App.tsx` alone, plus more in
 * `PageShell`, `MyList` and `SearchOverlay`. Ten copies of one rule is ten
 * places to forget when the rule changes -- which had already happened: the
 * anime rows passed `type` through but some call sites ignored it and produced
 * `#undefined/123`.
 */

export function detailRoute(id: string | number, type: string): string {
  if (type === 'anime' || type === 'ani') return `#detail/ani/${id}`;
  return `#${type === 'tv' ? 'tv' : 'movie'}/${id}`;
}

/** Navigates to a title's detail page. */
export function goToDetail(id: string | number, type: string): void {
  window.location.hash = detailRoute(id, type);
}

export function watchRoute(
  id: string | number,
  type: MediaType,
  season?: number,
  episode?: number
): string {
  if (type === 'anime') return `#watch/ani/${id}/${episode ?? 1}`;
  if (type === 'tv') return `#watch/tv/${id}/${season ?? 1}/${episode ?? 1}`;
  return `#watch/movie/${id}`;
}

export function goToWatch(
  id: string | number,
  type: MediaType,
  season?: number,
  episode?: number
): void {
  window.location.hash = watchRoute(id, type, season, episode);
}
