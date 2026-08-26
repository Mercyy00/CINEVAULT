/* CineVault service worker.
 *
 * Design rules, in priority order:
 *   1. NEVER cache media. Video/audio arrive as partial (206) range requests;
 *      caching them corrupts playback and would try to store 100 MB+ files in
 *      CacheStorage until the origin quota blows up.
 *   2. NEVER cache authenticated or personal data (Firestore, Firebase Auth,
 *      the TMDB API). A shared cache must not leak one user's data to another.
 *   3. Cache-first only for content-addressed, immutable assets.
 *   4. Every cache is bounded. An unbounded cache is a bug with a delay.
 */

const VERSION = 'v5';
const SHELL_CACHE = `cv-shell-${VERSION}`;
const ASSET_CACHE = `cv-assets-${VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, ASSET_CACHE];

// Minimal app shell so a cold offline load renders something.
const SHELL_URLS = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest'];

const ASSET_CACHE_MAX_ENTRIES = 120;

// Extensions we must never intercept-and-cache.
const MEDIA_RE = /\.(mp4|webm|mkv|mov|m4v|mp3|m4a|ogg|wav|flac|m3u8|ts|mpd)$/i;

// Hosts whose responses are user-specific or must always be fresh.
const NEVER_CACHE_HOSTS = [
  'api.themoviedb.org',
  'image.tmdb.org',
  'kitsu.io',
  'media.kitsu.io',
  'media.kitsu.app',
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'www.googleapis.com',
  'firebaseinstallations.googleapis.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .catch(() => {
        /* A failed precache must not block activation. */
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith('cv-') && !CURRENT_CACHES.includes(name))
            .map((name) => caches.delete(name))
        )
      )
      // Drop caches written by older workers
      .then(() => caches.delete('cinevault-v2'))
      .then(() => caches.delete('cinevault-v1'))
      .then(() => self.clients.claim())
  );
});

// Allow the page to trigger an immediate update.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

/** Evict oldest entries once a cache exceeds its ceiling. */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  // cache.keys() is insertion-ordered, so the head is the oldest.
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

/** Only store complete, basic/CORS 200 responses. Never opaque or partial. */
function isStorable(response) {
  return (
    response &&
    response.status === 200 &&
    (response.type === 'basic' || response.type === 'cors')
  );
}

async function cacheFirst(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;

  const response = await fetch(request);
  if (isStorable(response)) {
    await cache.put(request, response.clone());
    trimCache(cacheName, maxEntries);
  }
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (isStorable(response)) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const hit = await cache.match(request);
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Rule: only ever touch plain GETs over http(s).
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Rule 1: media and range requests pass straight through, untouched.
  if (request.headers.has('range')) return;
  if (request.destination === 'video' || request.destination === 'audio') return;
  if (MEDIA_RE.test(url.pathname)) return;

  // Rule 2: never cache personal, external image CDNs, or must-be-fresh data.
  if (NEVER_CACHE_HOSTS.includes(url.hostname)) return;

  // Navigations: network-first so users get fresh HTML, cache as offline
  // fallback. Falls back to the precached shell for unknown routes.
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, SHELL_CACHE).catch(() =>
        caches.match('/index.html').then((hit) => hit || Response.error())
      )
    );
    return;
  }

  // Anything else cross-origin: leave it alone.
  if (url.origin !== self.location.origin) return;

  // Vite emits content-hashed filenames into /assets -- safe to cache forever.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      cacheFirst(request, ASSET_CACHE, ASSET_CACHE_MAX_ENTRIES).catch(() => Response.error())
    );
    return;
  }

  // Remaining same-origin static files (icons, fonts, images).
  if (['image', 'font', 'style', 'script'].includes(request.destination)) {
    event.respondWith(
      cacheFirst(request, ASSET_CACHE, ASSET_CACHE_MAX_ENTRIES).catch(() => Response.error())
    );
  }
});
