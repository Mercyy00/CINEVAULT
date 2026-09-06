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
  const scrollFrame = useRef<number | null>(null);

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
    },
    []
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
   * Width of one card plus the gap, measured rather than assumed. Card width is
   * a five-breakpoint responsive value, so a hardcoded step would be wrong on
   * four of them -- and `clientWidth * 0.75` stopped mid-poster, which fought
   * `snap-start` and bounced the row back.
   */
  const cardStep = (element: HTMLElement): number => {
    const items = element.querySelectorAll<HTMLLIElement>(':scope > li');
    if (items.length >= 2) return items[1].offsetLeft - items[0].offsetLeft;
    if (items.length === 1) return items[0].offsetWidth;
    return element.clientWidth * 0.8;
  };

  const scrollByPage = useCallback((direction: 'left' | 'right') => {
    const element = rowRef.current;
    if (!element) return;
    const step = cardStep(element);
    // Advance by whole cards so the landing position agrees with snap-start.
    const perView = Math.max(1, Math.floor(element.clientWidth / step));
    const delta = step * perView;
    element.scrollTo({
      left: element.scrollLeft + (direction === 'left' ? -delta : delta),
      behavior: 'smooth',
    });
  }, []);

  const pointerX = (event: React.MouseEvent, element: HTMLElement) =>
    event.pageX - element.offsetLeft;

  const handleDragStart = (event: React.MouseEvent) => {
    const element = rowRef.current;
    if (!element || event.button !== 0) return;
    isDown.current = true;
    didDrag.current = false;
    startX.current = pointerX(event, element);
    startScroll.current = element.scrollLeft;
    // `scroll-smooth` animates direct scrollLeft writes too, which made the row
    // lag behind the pointer. Suspend it for the duration of the drag.
    element.style.scrollBehavior = 'auto';
  };

  const handleDragEnd = () => {
    const element = rowRef.current;
    isDown.current = false;
    if (element) element.style.scrollBehavior = '';
  };

  const handleDragMove = (event: React.MouseEvent) => {
    const element = rowRef.current;
    if (!isDown.current || !element) return;
    const travel = pointerX(event, element) - startX.current;
    if (!didDrag.current && Math.abs(travel) < DRAG_SLOP_PX) return;
    didDrag.current = true;
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
