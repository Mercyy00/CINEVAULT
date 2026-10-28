import Lenis from 'lenis';

/**
 * Global Lenis smooth-scroll controller for CineVault.
 *
 * Configured with an exponential decay curve and calibrated wheel physics
 * to achieve that effortless, frictionless "ice glide" sensation — where a subtle
 * scroll gesture carries momentum forward and softly decelerates with luxury damping.
 */

let lenisInstance: Lenis | null = null;
let rafId: number | null = null;

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export function initSmoothScroll(): Lenis | null {
  if (typeof window === 'undefined') return null;
  if (lenisInstance) return lenisInstance;

  // Respect prefers-reduced-motion for accessibility
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const lenis = new Lenis({
    // 1.25s duration with exponential decay provides that frictionless "ice glide" momentum
    duration: prefersReduced ? 0.01 : 1.25,
    // Custom exponential decay easing: quick initial response, long smooth coast to rest
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: !prefersReduced,
    wheelMultiplier: 1.1,
    touchMultiplier: 1.0,
    infinite: false,
    autoResize: true,
    prevent: (node: HTMLElement) => {
      // Prevent Lenis from intercepting scroll inside modals, drawers, or horizontal carousels
      return Boolean(
        node.hasAttribute?.('data-lenis-prevent') ||
          node.closest?.('[data-lenis-prevent]') ||
          node.closest?.('.card-row') ||
          node.closest?.('.custom-scrollbar') ||
          node.closest?.('[role="dialog"]')
      );
    },
  });

  lenisInstance = lenis;
  window.__lenis = lenis;

  // Custom RAF loop with high-precision timestamp
  function raf(time: number) {
    lenis.raf(time);
    rafId = requestAnimationFrame(raf);
  }
  rafId = requestAnimationFrame(raf);

  // Keep responsive to reduced-motion preference changes
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handleMotionChange = (e: MediaQueryListEvent) => {
    if (e.matches) {
      lenis.options.duration = 0.01;
      lenis.options.smoothWheel = false;
    } else {
      lenis.options.duration = 1.25;
      lenis.options.smoothWheel = true;
    }
  };
  mediaQuery.addEventListener?.('change', handleMotionChange);

  return lenis;
}

export function getSmoothScroll(): Lenis | null {
  return lenisInstance;
}

export function scrollTo(
  target: number | HTMLElement | string,
  options?: {
    duration?: number;
    offset?: number;
    immediate?: boolean;
    lock?: boolean;
  }
) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, options);
  } else if (typeof window !== 'undefined') {
    if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior: options?.immediate ? 'instant' : 'smooth' });
    } else if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: options?.immediate ? 'instant' : 'smooth' });
    }
  }
}

export function stopScroll() {
  lenisInstance?.stop();
}

export function startScroll() {
  lenisInstance?.start();
}

export function destroySmoothScroll() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
    delete window.__lenis;
  }
}
