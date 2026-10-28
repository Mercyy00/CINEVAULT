import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Shared mechanics for the horizontal poster rows.
 *
 * `MovieRow` and `Top10Row` each carried their own copy of this, and the copies
 * had drifted badly: only one of them suppressed the click at the end of a drag,
 * only one stepped by whole cards, and neither of Top10's ten posters was kept
 * out of the tab order. Owning it here means a fix lands in every row at once.
 */

/** Distance from the right edge, in px, at which more content is requested. */
const PREFETCH_THRESHOLD_PX = 400;

/** Scroll offsets below this don't count as scrollable in that direction. */
const ARROW_DEAD_ZONE_PX = 15;

/** A pointer that travelled less than this was a click, not a drag. */
const DRAG_SLOP_PX = 8;

/** Drag distance multiplier, so the row keeps pace with the cursor. */
const DRAG_FACTOR = 1.15;

interface ScrollerProps {
  ref: React.RefObject<HTMLUListElement | null>;
  onScroll: () => void;
  onMouseDown: (event: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onMouseMove: (event: React.MouseEvent) => void;
  onClickCapture: (event: React.MouseEvent) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onFocusCapture: (event: React.FocusEvent) => void;
}

interface CarouselOptions {
  /** Rendered item count. Arrows are re-measured when it changes. */
  itemCount: number;
  /** Called when the scroller nears its right edge, for paging in more items. */
  onNearEnd?: () => void;
}

export interface Carousel {
  /** Spread onto the scrolling `<ul>`. */
  scrollerProps: ScrollerProps;
  showLeftArrow: boolean;
  showRightArrow: boolean;
  /** The one card index that should hold `tabIndex={0}`. */
  rovingIndex: number;
  resetFocus: () => void;
  scrollByPage: (direction: 'left' | 'right') => void;
}

export function useCarousel({ itemCount, onNearEnd }: CarouselOptions): Carousel {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);

  const rowRef = useRef<HTMLUListElement>(null);
  const isDown = useRef(false);
  const didDrag = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);
  const scrollFrame = useRef<number | null>(null);
  const animFrame = useRef<number | null>(null);
  const targetScrollRef = useRef<number | null>(null);

  // `onNearEnd` is a fresh closure on most renders; a ref keeps the scroll
  // handler stable so the listener isn't swapped on every parent update.
  const nearEndRef = useRef(onNearEnd);
  useEffect(() => {
    nearEndRef.current = onNearEnd;
  }, [onNearEnd]);

  const updateArrows = useCallback(() => {
    const element = rowRef.current;
    if (!element) return;
    const { scrollLeft, scrollWidth, clientWidth } = element;
    const overflows = scrollWidth > clientWidth + ARROW_DEAD_ZONE_PX;
    setShowLeftArrow(scrollLeft > ARROW_DEAD_ZONE_PX);
    setShowRightArrow(overflows && scrollLeft < scrollWidth - clientWidth - ARROW_DEAD_ZONE_PX);
  }, []);

  /* Arrow visibility depends on content width, which changes with the list and
   * on resize. A ResizeObserver replaces the setTimeout(…, 150) guesses both
   * rows previously used. */
  useEffect(() => {
    const element = rowRef.current;
    if (!element) return;
    updateArrows();
    const observer = new ResizeObserver(updateArrows);
    observer.observe(element);
    return () => observer.disconnect();
  }, [itemCount, updateArrows]);

  useEffect(
    () => () => {
      if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
      if (animFrame.current !== null) cancelAnimationFrame(animFrame.current);
    },
    []
  );

  const cancelSmoothScroll = useCallback(() => {
    if (animFrame.current !== null) {
      cancelAnimationFrame(animFrame.current);
      animFrame.current = null;
    }
    targetScrollRef.current = null;
    const element = rowRef.current;
    if (element) {
      element.style.scrollSnapType = '';
      element.style.scrollBehavior = '';
    }
  }, []);

  /**
   * Ultra-smooth easing scroll that temporarily suspends CSS scroll-snap
   * so the browser's snap engine doesn't stutter fighting RAF interpolation.
   */
  const smoothScrollToTarget = useCallback(
    (element: HTMLUListElement, target: number, duration = 460) => {
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

      if (prefersReduced) {
        element.scrollLeft = target;
        targetScrollRef.current = null;
        updateArrows();
        return;
      }

      if (animFrame.current !== null) {
        cancelAnimationFrame(animFrame.current);
        animFrame.current = null;
      }

      const start = element.scrollLeft;
      const distance = target - start;
      if (Math.abs(distance) < 1) {
        targetScrollRef.current = null;
        return;
      }

      targetScrollRef.current = target;

      // Temporarily suspend snap & CSS smooth scroll during animation
      element.style.scrollSnapType = 'none';
      element.style.scrollBehavior = 'auto';

      const startTime = performance.now();

      // Silky smooth quintic/cubic ease-out deceleration curve
      const ease = (t: number) => 1 - Math.pow(1 - t, 3.5);

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased = ease(progress);

        element.scrollLeft = start + distance * eased;

        if (progress < 1) {
          animFrame.current = requestAnimationFrame(step);
        } else {
          element.scrollLeft = target;
          element.style.scrollSnapType = '';
          element.style.scrollBehavior = '';
          animFrame.current = null;
          targetScrollRef.current = null;
          updateArrows();
        }
      };

      animFrame.current = requestAnimationFrame(step);
    },
    [updateArrows]
  );

  const handleScroll = useCallback(() => {
    if (scrollFrame.current !== null) return;
    scrollFrame.current = requestAnimationFrame(() => {
      scrollFrame.current = null;
      updateArrows();
      const element = rowRef.current;
      if (!element || !nearEndRef.current) return;
      const remaining = element.scrollWidth - (element.scrollLeft + element.clientWidth);
      if (remaining < PREFETCH_THRESHOLD_PX) nearEndRef.current();
    });
  }, [updateArrows]);

  /**
   * Width of one card plus the gap, measured dynamically rather than assumed.
   */
  const cardStep = (element: HTMLElement): number => {
    const items = element.querySelectorAll<HTMLLIElement>(':scope > li');
    if (items.length >= 2) return items[1].offsetLeft - items[0].offsetLeft;
    if (items.length === 1) return items[0].offsetWidth;
    return element.clientWidth * 0.8;
  };

  const scrollByPage = useCallback(
    (direction: 'left' | 'right') => {
      const element = rowRef.current;
      if (!element) return;
      const step = cardStep(element);
      if (step <= 0) return;

      const items = element.querySelectorAll<HTMLLIElement>(':scope > li');
      const itemWidth = items.length > 0 ? items[0].offsetWidth : step;
      const gap = Math.max(0, step - itemWidth);

      const computedStyle = window.getComputedStyle(element);
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
      const innerWidth = element.clientWidth - paddingLeft - paddingRight;

      // Accurately compute whole cards visible in the row viewport (e.g. 6 on desktop)
      const perView = Math.max(1, Math.round((innerWidth + gap) / step));

      const maxScroll = Math.max(0, element.scrollWidth - element.clientWidth);
      // If a previous animation was running, extend from that target for seamless rapid clicks
      const baseScroll = targetScrollRef.current ?? element.scrollLeft;
      const currentCardIndex = Math.round(baseScroll / step);
      const targetCardIndex =
        direction === 'right' ? currentCardIndex + perView : currentCardIndex - perView;
      const targetScroll = Math.max(0, Math.min(targetCardIndex * step, maxScroll));

      smoothScrollToTarget(element, targetScroll);
    },
    [smoothScrollToTarget]
  );

  const pointerX = (event: React.MouseEvent, element: HTMLElement) =>
    event.pageX - element.offsetLeft;

  const handleDragStart = (event: React.MouseEvent) => {
    const element = rowRef.current;
    if (!element || event.button !== 0) return;
    cancelSmoothScroll();
    isDown.current = true;
    didDrag.current = false;
    startX.current = pointerX(event, element);
    startScroll.current = element.scrollLeft;
    lastX.current = pointerX(event, element);
    lastTime.current = performance.now();
    velocity.current = 0;
    // Suspend smooth scrolling & snap during manual drag for 1:1 fluid tracking
    element.style.scrollBehavior = 'auto';
    element.style.scrollSnapType = 'none';
  };

  const handleDragEnd = () => {
    const element = rowRef.current;
    if (!isDown.current || !element) return;
    isDown.current = false;

    if (didDrag.current) {
      const step = cardStep(element);
      const maxScroll = Math.max(0, element.scrollWidth - element.clientWidth);
      // Flick momentum if released with velocity
      if (Math.abs(velocity.current) > 0.2) {
        const momentumDistance = -velocity.current * 220;
        const target = element.scrollLeft + momentumDistance;
        const targetCard = Math.round(target / step) * step;
        smoothScrollToTarget(element, Math.max(0, Math.min(targetCard, maxScroll)), 420);
      } else {
        // Soft landing on nearest card boundary
        const nearestCard = Math.round(element.scrollLeft / step) * step;
        smoothScrollToTarget(element, Math.max(0, Math.min(nearestCard, maxScroll)), 250);
      }
    } else {
      element.style.scrollBehavior = '';
      element.style.scrollSnapType = '';
    }
  };

  const handleDragMove = (event: React.MouseEvent) => {
    const element = rowRef.current;
    if (!isDown.current || !element) return;
    const currentX = pointerX(event, element);
    const travel = currentX - startX.current;
    if (!didDrag.current && Math.abs(travel) < DRAG_SLOP_PX) return;
    didDrag.current = true;

    const now = performance.now();
    const dt = now - lastTime.current;
    if (dt > 8) {
      velocity.current = (currentX - lastX.current) / dt;
      lastX.current = currentX;
      lastTime.current = now;
    }

    element.scrollLeft = startScroll.current - travel * DRAG_FACTOR;
  };

  /** Swallows the click a real drag would otherwise fire on a poster. */
  const handleClickCapture = (event: React.MouseEvent) => {
    if (!didDrag.current) return;
    didDrag.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  /* Roving tabindex: one card per row is in the tab order and arrows move
   * between them. Without it, reaching the footer by keyboard meant tabbing
   * past every poster in every row plus the buttons inside each one. */
  const cardElements = (): HTMLElement[] =>
    Array.from(rowRef.current?.querySelectorAll<HTMLElement>('[data-movie-card]') ?? []);

  const focusCard = (target: number) => {
    const cards = cardElements();
    if (cards.length === 0) return;
    const clamped = Math.max(0, Math.min(cards.length - 1, target));
    setFocusIndex(clamped);
    cards[clamped].focus();
    /* Scroll the whole list item, not just the card. In the ranked row the
     * oversized numeral sits beside the poster inside the same `<li>`, and
     * revealing only the poster left the numeral off-screen. */
    const item = cards[clamped].closest('li') ?? cards[clamped];
    item.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const { key } = event;
    if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Home' && key !== 'End') return;
    // Only when a card itself holds focus -- the buttons inside it, and any
    // future text input, keep their own arrow-key behaviour.
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !active.hasAttribute('data-movie-card')) return;
    event.preventDefault();
    if (key === 'Home') focusCard(0);
    else if (key === 'End') focusCard(itemCount - 1);
    else focusCard(focusIndex + (key === 'ArrowRight' ? 1 : -1));
  };

  /** Keeps the roving index on whichever card the user actually reached. */
  const handleFocusCapture = (event: React.FocusEvent) => {
    const card = (event.target as HTMLElement).closest('[data-movie-card]');
    if (!card) return;
    const position = cardElements().indexOf(card as HTMLElement);
    if (position >= 0) setFocusIndex(position);
  };

  const resetFocus = useCallback(() => setFocusIndex(0), []);

  return {
    scrollerProps: {
      ref: rowRef,
      onScroll: handleScroll,
      onMouseDown: handleDragStart,
      onMouseUp: handleDragEnd,
      onMouseLeave: handleDragEnd,
      onMouseMove: handleDragMove,
      onClickCapture: handleClickCapture,
      onKeyDown: handleKeyDown,
      onFocusCapture: handleFocusCapture,
    },
    showLeftArrow,
    showRightArrow,
    rovingIndex: itemCount > 0 ? Math.min(focusIndex, itemCount - 1) : 0,
    resetFocus,
    scrollByPage,
  };
}
