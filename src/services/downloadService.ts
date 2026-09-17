/**
 * Multi-provider High-Speed Download Service
 * Aggregates live direct downloads and cloud drive links across 8+ upstream providers
 * (Febbox, Bollyflix / Fastdlserver, 4KHDHub, Defe, Films365, VidGod, DriveSeed, Jabroni).
 */

export interface UnifiedDownloadLink {
  id: string;
  name: string;
  quality: '4K' | '1080p' | '720p' | '480p' | 'Auto';
  qualityRaw: string;
  format: 'MP4' | 'MKV' | 'File';
  size: string | null;
  sizeBytes: number | null;
  provider: string;
  providerCode: string;
  audio: string;
  url: string;
  directUrl?: string;
  isPinned?: boolean;
}

export interface DownloadResponse {
  tmdbId: string;
  imdbId?: string;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  totalProviders: number;
  totalSizeLabel: string;
  downloads: UnifiedDownloadLink[];
  mirrorUrl: string;
  nxshaDlUrl?: string;
}

const PROVIDER_NAMES: Record<string, string> = {
  febbox: 'Febbox (Showbox)',
  fastdlserver: 'Fastdlserver',
  bollyflix: 'Bollyflix',
  jabroni: 'Jabroni',
  '4khdhub': '4KHDHub',
  defe: 'Defe',
  films365: 'Films365',
  vidgod: 'VidGod',
  driveseed: 'DriveSeed',
  drive: 'Google Drive',
  pixeldrain: 'PixelDrain',
  cinemaos: 'CinemaOS',
  moviesmod: 'MoviesMod',
  mod: 'MoviesMod',
  vega: 'VegaMovies',
  vegamovies: 'VegaMovies',
  hdhub4u: 'HDHub4u',
  movies4u: 'Movies4u',
  moviebox: 'MovieBox',
  nxsha: 'NxSha Multi-Source Hub',
};

/** Parse human-readable file size strings into megabytes for sorting */
export function parseSizeToBytes(sizeStr?: string | null): number | null {
  if (!sizeStr || typeof sizeStr !== 'string') return null;
  const match = sizeStr.trim().match(/^([\d.]+)\s*(GB|MB|KB|TB)?$/i);
  if (!match) return null;
  const val = parseFloat(match[1]);
  if (isNaN(val)) return null;
  const unit = (match[2] || 'MB').toUpperCase();
  switch (unit) {
    case 'TB':
      return val * 1024 * 1024 * 1024 * 1024;
    case 'GB':
      return val * 1024 * 1024 * 1024;
    case 'MB':
      return val * 1024 * 1024;
    case 'KB':
      return val * 1024;
    default:
      return val * 1024 * 1024;
  }
}

/** Normalize quality tags */
export function normalizeQuality(raw?: string | null, name?: string | null): '4K' | '1080p' | '720p' | '480p' | 'Auto' {
  const combined = `${raw || ''} ${name || ''}`.toLowerCase();
  if (combined.includes('4k') || combined.includes('2160p') || combined.includes('uhd')) return '4K';
  if (combined.includes('1080p') || combined.includes('1080')) return '1080p';
  if (combined.includes('720p') || combined.includes('720')) return '720p';
  if (combined.includes('480p') || combined.includes('480') || combined.includes('360p')) return '480p';
  return 'Auto';
}

/** Detect audio language from title / tags */
export function detectAudio(raw?: string | null, name?: string | null): string {
  const combined = `${raw || ''} ${name || ''}`.toLowerCase();
  const hasHindi = combined.includes('hindi') || combined.includes('hin') || combined.includes('bolly');
  const hasEnglish = combined.includes('english') || combined.includes('eng');
  const hasDual = combined.includes('dual') || (hasHindi && hasEnglish) || combined.includes('multi');

  if (hasDual) return 'Hindi + English';
  if (hasHindi) return 'Hindi Dub';
  if (hasEnglish) return 'English';
  if (combined.includes('sub') || combined.includes('esub')) return 'English Subtitles';
  return 'Multi-Audio';
}

/** Detect container format */
export function detectFormat(url?: string | null, name?: string | null): 'MP4' | 'MKV' | 'File' {
  const combined = `${url || ''} ${name || ''}`.toLowerCase();
  if (combined.includes('.mkv')) return 'MKV';
  if (combined.includes('.mp4')) return 'MP4';
  return 'File';
}

/** Detect provider name */
export function detectProvider(url?: string | null, source?: string | null, name?: string | null): { name: string; code: string } {
  const code = (source || '').toLowerCase().trim();
  if (code && PROVIDER_NAMES[code]) {
    return { name: PROVIDER_NAMES[code], code };
  }

  const combined = `${url || ''} ${name || ''}`.toLowerCase();
  for (const [key, label] of Object.entries(PROVIDER_NAMES)) {
    if (combined.includes(key)) {
      return { name: label, code: key };
    }
  }

  if (combined.includes('febbox')) return { name: 'Febbox (Showbox)', code: 'febbox' };
  if (combined.includes('fastdlserver') || combined.includes('dl.fastdlserver')) return { name: 'Fastdlserver (Bollyflix)', code: 'fastdlserver' };
  if (combined.includes('jabroni')) return { name: 'Jabroni', code: 'jabroni' };
  if (combined.includes('cloudflarestorage') || combined.includes('r2.')) return { name: 'Cloudflare R2 (Fast)', code: 'r2' };
  if (combined.includes('googleusercontent')) return { name: 'Google Cloud Drive', code: 'drive' };
  if (combined.includes('pixeldrain')) return { name: 'PixelDrain Drive', code: 'pixeldrain' };
  if (combined.includes('streamflix')) return { name: 'StreamFlix Storage', code: 'streamflix' };

  return { name: code ? code.toUpperCase() : 'High-Speed Cloud', code: code || 'cloud' };
}

interface FetchOptions {
  type: 'movie' | 'tv';
  id: string;
  season?: number;
  episode?: number;
  imdbId?: string;
  signal?: AbortSignal;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function fetchDownloads({
  type,
  id,
  season = 1,
  episode = 1,
  imdbId,
  signal,
}: FetchOptions): Promise<DownloadResponse> {
  const cacheKey = `cv:dl:${type}:${id}:${type === 'tv' ? `${season}:${episode}` : ''}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.exp > Date.now() && Array.isArray(parsed.downloads)) {
        return parsed.data;
      }
    }
  } catch {}

  const mirrorParams = new URLSearchParams();
  if (imdbId) mirrorParams.set('imdb', imdbId);
  mirrorParams.set('id', id);
  mirrorParams.set('type', type);
  if (type === 'tv') {
    mirrorParams.set('season', String(season));
    mirrorParams.set('episode', String(episode));
  }
  const mirrorUrl = `https://theogpiratebot.vercel.app/download?${mirrorParams.toString()}`;
  const nxshaDlUrl = type === 'tv'
    ? `https://nxsha.space/dl/tv/${imdbId || id}/${season}/${episode}`
    : `https://nxsha.space/dl/movie/${imdbId || id}`;

  const path = type === 'tv' ? `tv/${id}/${season}/${episode}` : `movie/${id}`;

  // Fetch both upstream multi-provider APIs in parallel with error isolation
  const [tgdlRes, vidsrcRes] = await Promise.allSettled([
    fetch(`https://tgdl.lovable.app/api/${path}`, {
      headers: { accept: 'application/json' },
      signal,
    }).then(async (r) => {
      if (!r.ok) return null;
      return r.json().catch(() => null);
    }),
    fetch(`https://vidsrc.party/api/downloads/${path}`, {
      headers: { accept: 'application/json' },
      signal,
    }).then(async (r) => {
      if (!r.ok) return null;
      return r.json().catch(() => null);
    }),
  ]);

  const rawLinks: UnifiedDownloadLink[] = [
    {
      id: `nxsha-${id}-${type === 'tv' ? `${season}-${episode}` : 'movie'}`,
      name: `${type === 'tv' ? `Episode S${season}E${episode}` : 'Movie'} Multi-Server Direct Hub`,
      quality: '1080p',
      qualityRaw: '1080p Multi-Server',
      format: 'MKV',
      size: 'Direct Cloud',
      sizeBytes: null,
      provider: 'NxSha Hub',
      providerCode: 'nxsha',
      audio: 'Multi-Audio (Hindi + English)',
      url: nxshaDlUrl,
      isPinned: true,
    },
  ];

  // Parse TGDL (Showbox, Febbox, Bollyflix, Fastdlserver, Jabroni)
  if (tgdlRes.status === 'fulfilled' && tgdlRes.value) {
    const data = tgdlRes.value;
    const items: any[] = Array.isArray(data.downloads)
      ? data.downloads
      : Array.isArray(data)
      ? data
      : data.download_url
      ? [data]
      : [];

    items.forEach((item, idx) => {
      const url = item.download_url || item.url || item.link;
      if (!url) return;

      const name = item.name || item.title || `Release ${idx + 1}`;
      const quality = normalizeQuality(item.quality, name);
      const audio = detectAudio(item.quality || item.audio, name);
      const format = detectFormat(url, name);
      const providerInfo = detectProvider(url, item.source, name);
      const sizeStr = item.size || null;

      rawLinks.push({
        id: `tg-${idx}-${quality}-${providerInfo.code}`,
        name,
        quality,
        qualityRaw: item.quality || quality,
        format,
        size: sizeStr,
        sizeBytes: parseSizeToBytes(sizeStr),
        provider: providerInfo.name,
        providerCode: providerInfo.code,
        audio,
        url,
        isPinned: url.includes('febbox.com/share'),
      });
    });
  }

  // Parse VidSrc.Party (VidGod, 4KHDHub, Defe, Films365, DriveSeed, CinemaOS)
  if (vidsrcRes.status === 'fulfilled' && vidsrcRes.value) {
    const data = vidsrcRes.value;
    const items: any[] = Array.isArray(data.downloads) ? data.downloads : [];

    items.forEach((item, idx) => {
      const targetUrl = item.directUrl || item.url;
      if (!targetUrl) return;

      const name = item.name || item.title || `Server ${item.label || idx + 1} (${item.source || 'Fast'})`;
      const quality = normalizeQuality(item.quality, name);
      const audio = detectAudio(item.quality || item.audio, name);
      const format = (item.format as any) || detectFormat(targetUrl, name);
      const providerInfo = detectProvider(targetUrl, item.source, name);
      const sizeStr = item.size || null;

      rawLinks.push({
        id: `vs-${idx}-${quality}-${providerInfo.code}`,
        name,
        quality,
        qualityRaw: item.quality || quality,
        format,
        size: sizeStr,
        sizeBytes: parseSizeToBytes(sizeStr),
        provider: providerInfo.name,
        providerCode: providerInfo.code,
        audio,
        url: targetUrl,
        directUrl: item.directUrl,
      });
    });
  }

  // Deduplicate links by normalized URL
  const seenUrls = new Set<string>();
  const uniqueLinks: UnifiedDownloadLink[] = [];
  for (const item of rawLinks) {
    const cleanUrl = item.url.split('?')[0].toLowerCase();
    if (!seenUrls.has(cleanUrl)) {
      seenUrls.add(cleanUrl);
      uniqueLinks.push(item);
    }
  }

  // Sort: Pinned first, then resolution hierarchy (4K > 1080p > 720p > 480p > Auto), then file size
  const qualityWeight: Record<string, number> = {
    '4K': 4,
    '1080p': 3,
    '720p': 2,
    '480p': 1,
    Auto: 0,
  };

  uniqueLinks.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    const qDiff = (qualityWeight[b.quality] || 0) - (qualityWeight[a.quality] || 0);
    if (qDiff !== 0) return qDiff;

    return (b.sizeBytes || 0) - (a.sizeBytes || 0);
  });

  const providersSet = new Set(uniqueLinks.map((l) => l.providerCode));
  const totalBytes = uniqueLinks.reduce((acc, l) => acc + (l.sizeBytes || 0), 0);
  const totalSizeLabel = totalBytes > 0
    ? totalBytes >= 1024 * 1024 * 1024 * 1024
      ? `${(totalBytes / (1024 * 1024 * 1024 * 1024)).toFixed(1)} TB`
      : `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
    : `${uniqueLinks.length} files`;

  const result: DownloadResponse = {
    tmdbId: id,
    imdbId,
    type,
    season,
    episode,
    totalProviders: providersSet.size,
    totalSizeLabel,
    downloads: uniqueLinks,
    mirrorUrl,
    nxshaDlUrl,
  };

  try {
    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({
        exp: Date.now() + CACHE_TTL_MS,
        data: result,
      })
    );
  } catch {}

  return result;
}
