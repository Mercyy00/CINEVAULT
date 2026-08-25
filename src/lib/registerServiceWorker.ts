/**
 * Service worker registration.
 *
 * Registered in production builds only. Registering in dev meant the worker
 * intercepted and cached module requests, producing stale-module bugs that
 * look like build failures.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) {
    // Clean up any worker a previous dev session installed.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => registrations.forEach((registration) => registration.unregister()))
        .catch(() => {
          /* Nothing actionable. */
        });
    }
    return;
  }

  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.error('Service worker registration failed:', error);
    });
  });
}
