import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initSmoothScroll,
  getSmoothScroll,
  scrollTo,
  stopScroll,
  startScroll,
  destroySmoothScroll,
} from '../smoothScroll';

describe('smoothScroll module', () => {
  beforeEach(() => {
    destroySmoothScroll();
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
  });

  afterEach(() => {
    destroySmoothScroll();
    vi.unstubAllGlobals();
  });

  it('initializes Lenis instance and exposes it via getSmoothScroll and window.__lenis', () => {
    const lenis = initSmoothScroll();
    expect(lenis).not.toBeNull();
    expect(getSmoothScroll()).toBe(lenis);
    expect(window.__lenis).toBe(lenis);
  });

  it('returns existing instance on multiple init calls (singleton)', () => {
    const first = initSmoothScroll();
    const second = initSmoothScroll();
    expect(second).toBe(first);
  });

  it('delegates stopScroll and startScroll to the active lenis instance', () => {
    const lenis = initSmoothScroll();
    expect(lenis).not.toBeNull();
    if (!lenis) return;

    const stopSpy = vi.spyOn(lenis, 'stop');
    const startSpy = vi.spyOn(lenis, 'start');

    stopScroll();
    expect(stopSpy).toHaveBeenCalledOnce();

    startScroll();
    expect(startSpy).toHaveBeenCalledOnce();
  });

  it('delegates scrollTo to lenis.scrollTo', () => {
    const lenis = initSmoothScroll();
    expect(lenis).not.toBeNull();
    if (!lenis) return;

    const scrollSpy = vi.spyOn(lenis, 'scrollTo');
    scrollTo(250, { duration: 1.2 });
    expect(scrollSpy).toHaveBeenCalledWith(250, { duration: 1.2 });
  });

  it('cleans up resources and references upon destroySmoothScroll', () => {
    initSmoothScroll();
    expect(getSmoothScroll()).not.toBeNull();
    expect(window.__lenis).toBeDefined();

    destroySmoothScroll();
    expect(getSmoothScroll()).toBeNull();
    expect(window.__lenis).toBeUndefined();
  });
});
