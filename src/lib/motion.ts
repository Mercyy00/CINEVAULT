import { useReducedMotion, Transition, MotionProps } from 'motion/react';

/**
 * Fast duration token (0.15s)
 */
export const DURATION_FAST = 0.15;

/**
 * Normal duration token (0.3s)
 */
export const DURATION_NORMAL = 0.3;

/**
 * Slow duration token (0.5s)
 */
export const DURATION_SLOW = 0.5;

/**
 * Standard ease-out timing function
 */
export const EASE_OUT = [0.0, 0.0, 0.2, 1.0] as const;

/**
 * Standard spring configuration
 */
export const SPRING = { type: 'spring' as const, stiffness: 300, damping: 24 };

/**
 * Fast transition preset
 */
export const transitionFast: Transition = { duration: DURATION_FAST, ease: EASE_OUT };

/**
 * Normal transition preset
 */
export const transitionNormal: Transition = { duration: DURATION_NORMAL, ease: EASE_OUT };

/**
 * Slow transition preset
 */
export const transitionSlow: Transition = { duration: DURATION_SLOW, ease: EASE_OUT };

/**
 * Spring transition preset
 */
export const transitionSpring: Transition = SPRING;

/**
 * Hook that returns context-aware transition configurations based on user's reduced motion preference.
 * @returns An object containing the transition presets, adjusted if reduced motion is enabled.
 */
export function useMotionAllowed() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    const reducedTransition: Transition = { duration: 0, bounce: 0 };
    return {
      transitionFast: reducedTransition,
      transitionNormal: reducedTransition,
      transitionSlow: reducedTransition,
      transitionSpring: reducedTransition,
    };
  }

  return {
    transitionFast,
    transitionNormal,
    transitionSlow,
    transitionSpring,
  };
}

/**
 * Fade in animation preset
 */
export const fadeIn: MotionProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Fade out animation preset
 */
export const fadeOut: MotionProps = {
  initial: { opacity: 1 },
  animate: { opacity: 0 },
  exit: { opacity: 0 },
};

/**
 * Slide up animation preset
 */
export const slideUp: MotionProps = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

/**
 * Slide down animation preset
 */
export const slideDown: MotionProps = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

/**
 * Scale in animation preset
 */
export const scaleIn: MotionProps = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};
