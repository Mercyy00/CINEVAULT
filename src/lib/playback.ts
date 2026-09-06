/**
 * Shared playback thresholds.
 *
 * These numbers were duplicated per call site and had drifted: `store.tsx`
 * dropped a title from Continue Watching at >= 95 %, while `PlayerPage.tsx`
 * marked it "completed" at >= 90 %. A title could therefore be finished
 * according to the player and still sit in the Continue row forever.
 */

/** At or above this percentage a title counts as finished. */
export const COMPLETION_THRESHOLD = 90;

/** Below this, resuming is pointless -- start from the beginning instead. */
export const MIN_RESUME_PERCENT = 2;

/** Seconds to rewind on resume so the viewer re-establishes context. */
export const RESUME_REWIND_SECONDS = 5;

/** True when the title should leave the Continue Watching row. */
export function isComplete(progressPercentage: number | null | undefined): boolean {
  return typeof progressPercentage === 'number' && progressPercentage >= COMPLETION_THRESHOLD;
}

/** True when there is a meaningful position worth offering to resume from. */
export function isResumable(progressPercentage: number | null | undefined): boolean {
  return (
    typeof progressPercentage === 'number' &&
    progressPercentage >= MIN_RESUME_PERCENT &&
    progressPercentage < COMPLETION_THRESHOLD
  );
}

/** Resume a few seconds earlier than the recorded position. */
export function resumePosition(positionSeconds: number): number {
  return Math.max(0, Math.floor(positionSeconds) - RESUME_REWIND_SECONDS);
}

/**
 * Percentage from a position and a duration, or null when the duration is
 * unknown. Never guesses a runtime.
 */
export function progressPercent(
  positionSeconds: number,
  durationSeconds: number | null | undefined
): number | null {
  if (!durationSeconds || durationSeconds <= 0) return null;
  const raw = (positionSeconds / durationSeconds) * 100;
  return Math.min(100, Math.max(0, Math.round(raw * 10) / 10));
}
