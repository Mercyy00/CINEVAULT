/**
 * Ambient colour extraction for the theatre glow.
 *
 * Three things were wrong with the previous version:
 *
 * - **It was blocked by CORS in practice.** It re-requested the exact URL the
 *   `<img>` had already loaded. TMDB's CDN serves images without
 *   `Vary: Origin`, so the browser reused the cached non-CORS response, which
 *   carries no `Access-Control-Allow-Origin`, and `getImageData` threw for
 *   every backdrop. The glow silently fell back to null on every slide.
 *   Sampling a deliberately different (and 8x smaller) size sidesteps the
 *   poisoned cache entry.
 * - **It averaged every pixel**, which converges on grey-brown for any real
 *   frame. The glow was mud. It now quantises into buckets and picks the most
 *   present *saturated* colour, ignoring letterbox bars and blown highlights.
 * - **It could never settle.** An image that neither loads nor errors left the
 *   promise pending forever, and it rejected with bare strings rather than
 *   Errors, so callers logging `error.message` got `undefined`.
 */

/** Sampling size. Small on purpose: colour, not detail. */
const SAMPLE_SIZE = 'w300';

/** Canvas is square and tiny; this is a histogram, not a thumbnail. */
const CANVAS_EDGE = 96;

const LOAD_TIMEOUT_MS = 6_000;

/** Below this the pixel is a letterbox bar or crush; above, a blown highlight. */
const MIN_LIGHTNESS = 24;
const MAX_LIGHTNESS = 236;

/** Floor applied to the winner so the glow is visible against a dark page. */
const MIN_GLOW_LIGHTNESS = 70;

const cache = new Map<string, string>();
const MAX_CACHE_ENTRIES = 80;

function remember(key: string, value: string): string {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, value);
  return value;
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  return `#${((1 << 24) | (clamp(r) << 16) | (clamp(g) << 8) | clamp(b)).toString(16).slice(1)}`;
}

/** Rewrites a TMDB image URL to the sampling size. Other hosts pass through. */
function sampleUrl(imageUrl: string): string {
  return imageUrl.replace(/\/t\/p\/(w\d+|h\d+|original)\//, `/t/p/${SAMPLE_SIZE}/`);
}

interface Bucket {
  count: number;
  weight: number;
  r: number;
  g: number;
  b: number;
}

/**
 * Picks the most present saturated colour rather than the mean of the frame.
 * Buckets are 4 bits per channel, which is coarse enough to group a sky or a
 * skin tone and fine enough to keep a neon sign distinct from it.
 */
function dominantColor(data: Uint8ClampedArray): string {
  const buckets = new Map<number, Bucket>();
  let fallbackR = 0;
  let fallbackG = 0;
  let fallbackB = 0;
  let fallbackCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    fallbackR += r;
    fallbackG += g;
    fallbackB += b;
    fallbackCount += 1;

    if (data[i + 3] < 128) continue;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;
    if (lightness < MIN_LIGHTNESS || lightness > MAX_LIGHTNESS) continue;

    const span = max - min;
    const saturation = span === 0 ? 0 : span / (255 - Math.abs(max + min - 255));

    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key) ?? { count: 0, weight: 0, r: 0, g: 0, b: 0 };
    bucket.count += 1;
    // Presence still matters, but a vivid pixel counts for more than a grey one.
    bucket.weight += 0.35 + saturation;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }

  let winner: Bucket | null = null;
  for (const bucket of buckets.values()) {
    if (!winner || bucket.weight > winner.weight) winner = bucket;
  }

  // A frame that is entirely black bars or entirely blown out has no winner.
  if (!winner || fallbackCount === 0) {
    if (fallbackCount === 0) return '#8a8a8a';
    return toHex(fallbackR / fallbackCount, fallbackG / fallbackCount, fallbackB / fallbackCount);
  }

  let r = winner.r / winner.count;
  let g = winner.g / winner.count;
  let b = winner.b / winner.count;

  // Lift dark winners so the glow reads at the low opacity it is drawn with,
  // preserving hue by scaling all three channels together.
  const lightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
  if (lightness > 0 && lightness < MIN_GLOW_LIGHTNESS) {
    const lift = MIN_GLOW_LIGHTNESS / lightness;
    r *= lift;
    g *= lift;
    b *= lift;
  }

  return toHex(r, g, b);
}

/**
 * Resolves to a hex colour sampled from `imageUrl`, or rejects when the image
 * cannot be read. Results are cached per URL.
 */
export async function getDominantColor(imageUrl: string): Promise<string> {
  const key = sampleUrl(imageUrl);
  const cached = cache.get(key);
  if (cached) return cached;

  if (key.includes('media.kitsu.app')) {
    return '#e50914';
  }

  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';

    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      image.src = '';
      reject(new Error(`Colour sampling timed out for ${key}`));
    }, LOAD_TIMEOUT_MS);

    const finish = (run: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      run();
    };

    image.onload = () =>
      finish(() => {
        const canvas = document.createElement('canvas');
        canvas.width = CANVAS_EDGE;
        canvas.height = CANVAS_EDGE;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          reject(new Error('2D canvas context unavailable'));
          return;
        }
        try {
          context.drawImage(image, 0, 0, CANVAS_EDGE, CANVAS_EDGE);
          const { data } = context.getImageData(0, 0, CANVAS_EDGE, CANVAS_EDGE);
          resolve(remember(key, dominantColor(data)));
        } catch (cause) {
          // Tainted canvas: the response arrived without CORS headers.
          reject(cause instanceof Error ? cause : new Error(String(cause)));
        }
      });

    image.onerror = () => finish(() => reject(new Error(`Colour sample failed to load: ${key}`)));

    image.src = key;
  });
}
