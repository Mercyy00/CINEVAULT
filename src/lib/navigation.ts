import type { MediaType } from '../types';

/**
 * Path-based route helpers.
 *
 * Provides central client-side SPA routing without hash tags (#).
 * Uses window.history.pushState / replaceState and dispatches 'popstate'
 * to trigger reactive view updates without full page reloads.
 */

export function navigate(path: string, options: { replace?: boolean } = {}): void {
  let target = path;
  if (!target.startsWith('/')) {
    target = '/' + target.replace(/^#\/?/, '');
  }

  if (options.replace) {
    window.history.replaceState(null, '', target);
  } else {
    window.history.pushState(null, '', target);
  }

  window.dispatchEvent(new Event('popstate'));
}

export function detailRoute(id: string | number, type: string): string {
  if (type === 'anime' || type === 'ani') return `/ani/${id}`;
  return `/${type === 'tv' ? 'tv' : 'movie'}/${id}`;
}

/** Navigates to a title's detail page. */
export function goToDetail(id: string | number, type: string): void {
  navigate(detailRoute(id, type));
}

export function watchRoute(
  id: string | number,
  type: MediaType | 'ani' | string,
  season?: number,
  episode?: number,
  malId?: string | number
): string {
  if (type === 'anime' || type === 'ani') {
    if (malId && String(malId) !== '0') {
      return `/watch/ani/${id}/${malId}/${episode ?? 1}`;
    }
    return `/watch/ani/${id}/${episode ?? 1}`;
  }
  if (type === 'tv') {
    return `/watch/tv/${id}/${season ?? 1}/${episode ?? 1}`;
  }
  return `/watch/movie/${id}`;
}

export function goToWatch(
  id: string | number,
  type: MediaType | 'ani' | string,
  season?: number,
  episode?: number,
  malId?: string | number
): void {
  navigate(watchRoute(id, type, season, episode, malId));
}

export function goToHome(): void {
  navigate('/');
}

