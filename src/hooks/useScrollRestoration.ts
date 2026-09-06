import { useCallback, useEffect, useRef } from 'react';

/**
 * Remembers how far each URL was scrolled and puts the user back there on Back
 * or Forward.
 *
 * The router's location handler used to call `window.scrollTo(0, 0)` on every
 * change, including history pops -- so returning from a title you opened halfway
 * down `Top rated movies` dropped you at the top of the page and made you scroll
 * the whole way again. Forward navigation still starts at the top, which is what
 * opening a new page should do.
 *
 * Restoration is best-effort by necessity. Routes are code-split and their
 * contents arrive from the network, so on the first frame after a pop the
 * document is usually far too short to hold the saved offset. The offset is
 * re-applied every frame until it sticks or the deadline passes.
 *
 * Both the pop and the push paths scroll with `behavior: 'instant'`: the app
 * sets `scroll-behavior: smooth` on `html`, which turns a plain `scrollTo` into
 * an animation -- restoring a position by visibly scrolling there is not
 * restoring it, and the animation also kept the convergence check below from
 * ever agreeing with itself.
 */

/** Give up re-applying a saved offset after this long. */
const RESTORE_TIMEOUT_MS = 1200;

/** Close enough to the target to stop retrying. */
const RESTORE_EPSILON_PX = 2;

/** Cap on remembered entries, so a long session can't grow the map forever. */
const MAX_ENTRIES = 40;

const locationKey = (): string => window.location.pathname + window.location.search;

export interface ScrollRestoration {
  /**
   * Call from the location-change handler.
   *
   * @param isPush `true` for an in-app navigation (start at the top), `false`
   *   for a browser Back/Forward (restore the remembered offset).
   */
  applyForNavigation: (isPush: boolean) => void;
}

export function useScrollRestoration(): ScrollRestoration {
  const offsets = useRef(new Map<string, number>());
  const restoring = useRef(false);
  const frame = useRef<number | null>(null);

  const cancelPending = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    restoring.current = false;
  }, []);

  /* The browser's own restoration races React: it fires before the route has
   * rendered, finds a short document, clamps to the bottom, and then the real
   * content pushes the page around underneath. Owning it here is the only way
   * to make it land. */
  useEffect(() => {
    if (!('scrollRestoration' in window.history)) return;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  // Record the live position for whichever URL is current. Reading the location
  // at scroll time rather than closing over it keeps the entry attributed to the
  // page actually on screen.
  useEffect(() => {
    let pending = false;

    const handleScroll = () => {
      if (restoring.current || pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        if (restoring.current) return;
        const map = offsets.current;
        const key = locationKey();
        if (!map.has(key) && map.size >= MAX_ENTRIES) {
          const oldest = map.keys().next();
          if (!oldest.done) map.delete(oldest.value);
        }
        map.set(key, window.scrollY);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => cancelPending, [cancelPending]);

  const applyForNavigation = useCallback(
    (isPush: boolean) => {
      cancelPending();

      const target = isPush ? 0 : (offsets.current.get(locationKey()) ?? 0);

      if (target <= 0) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        return;
      }

      restoring.current = true;
      const deadline = performance.now() + RESTORE_TIMEOUT_MS;

      const step = () => {
        frame.current = null;
        window.scrollTo({ top: target, left: 0, behavior: 'instant' });
        const settled = Math.abs(window.scrollY - target) <= RESTORE_EPSILON_PX;
        if (settled || performance.now() >= deadline) {
          restoring.current = false;
          return;
        }
        frame.current = requestAnimationFrame(step);
      };

      frame.current = requestAnimationFrame(step);
    },
    [cancelPending]
  );

  return { applyForNavigation };
}
