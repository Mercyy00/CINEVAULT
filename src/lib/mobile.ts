/**
 * Mobile utility helpers for CineVault.
 * Provides safe Web APIs for haptic vibration feedback, native Web Share,
 * and device feature checks.
 */

export type HapticType = 'light' | 'medium' | 'selection' | 'success';

/**
 * Triggers safe haptic vibration on devices supporting the Vibration API.
 * Gracefully degrades to a no-op on desktop or unsupported browsers.
 */
export function triggerHaptic(type: HapticType = 'light'): void {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'selection':
        navigator.vibrate(15);
        break;
      case 'medium':
        navigator.vibrate(30);
        break;
      case 'success':
        navigator.vibrate([15, 60, 20]);
        break;
      default:
        navigator.vibrate(10);
    }
  } catch {
    // Ignore environments where vibrate is restricted or disabled
  }
}

export interface ShareOptions {
  title: string;
  text?: string;
  url?: string;
}

/**
 * Shares content via the native Web Share API if supported on mobile,
 * or copies the URL to the clipboard as an automatic fallback.
 *
 * @returns 'shared' if shared via OS sheet, 'copied' if copied to clipboard, or 'failed'
 */
export async function shareTitle(options: ShareOptions): Promise<'shared' | 'copied' | 'failed'> {
  const shareUrl = options.url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareData: ShareData = {
    title: options.title,
    text: options.text || `Watch "${options.title}" on CineVault`,
    url: shareUrl,
  };

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData);
      triggerHaptic('success');
      return 'shared';
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return 'failed'; // User cancelled share sheet
      }
    }
  }

  // Fallback: Copy URL to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      triggerHaptic('selection');
      return 'copied';
    } catch {
      return 'failed';
    }
  }

  return 'failed';
}
