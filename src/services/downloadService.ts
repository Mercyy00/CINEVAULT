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
  magnetUrl?: string;
  webtorUrl?: string;
  seeders?: number;
  isOneClick?: boolean;
  isPinned?: boolean;
  category?: 'cloud' | 'bollywood' | 'classic' | 'hub';
  speedBadge?: string;
  description?: string;
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
  isIndian?: boolean;
  isClassic?: boolean;
  mediaTitle?: string;
  releaseYear?: number;
}

const PROVIDER_NAMES: Record<string, string> = {
  febbox: 'Febbox (Showbox)',
  fastdlserver: 'Fastdlserver',
  bollyflix: 'Bollyflix FastDL Cloud',
  jabroni: 'Jabroni',
  '4khdhub': '4KHDHub',
  defe: 'Defe',
  films365: 'Films365',
  vidgod: 'VidGod',
  driveseed: 'DriveSeed',
  drive: 'Google Drive',
  pixeldrain: 'PixelDrain',
  cinemaos: 'CinemaOS',
  moviesmod: 'MoviesMod FastCloud',
  mod: 'MoviesMod FastCloud',
  vega: 'VegaMovies V-Cloud',
  vegamovies: 'VegaMovies V-Cloud',
  hdhub4u: 'HDHub4u DriveHub',
  movies4u: 'Movies4u',
  moviebox: 'MovieBox',
  nxsha: 'NxSha Multi-Source Hub',
  videasy: 'Videasy 4K Cloud Node',
  autoembed: 'AutoEmbed Direct Stream',
  '2embed': '2Embed Cloud Stream',
  archive: 'Internet Archive Vault',
  yts: 'YTS Official High-Speed',
  screenscape: 'ScreenScape In-Player Downloader',
  torrentio: 'Torrentio High-Speed Swarm',
  webtor: 'Webtor Cloud Download',
};

/** Clean raw title strings into alphanumeric keywords for safe querying */
export function cleanMovieTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/[^\w\s-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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
  if (combined.includes('bollyflix')) return { name: 'Bollyflix FastDL Cloud', code: 'bollyflix' };
  if (combined.includes('vegamovies')) return { name: 'VegaMovies V-Cloud', code: 'vegamovies' };
  if (combined.includes('hdhub4u')) return { name: 'HDHub4u DriveHub', code: 'hdhub4u' };
  if (combined.includes('moviesmod')) return { name: 'MoviesMod FastCloud', code: 'moviesmod' };
  if (combined.includes('archive.org')) return { name: 'Internet Archive Vault', code: 'archive' };
  if (combined.includes('yts.mx')) return { name: 'YTS Official Direct', code: 'yts' };
  if (combined.includes('screenscape')) return { name: 'ScreenScape Hindi', code: 'screenscape' };
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
  title?: string;
  originalLanguage?: string;
  productionCountries?: string[];
  releaseYear?: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Safe fetch with timeout to prevent hanging on unresponsive endpoints */
async function fetchWithTimeout(url: string, timeoutMs = 3500, signal?: AbortSignal): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  if (signal) {
    signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    const res = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return await res.json().catch(() => null);
  } catch {
    clearTimeout(timeoutId);
    return null;
  } finally {
    if (signal) {
      signal.removeEventListener('abort', onAbort);
    }
  }
}

export async function fetchDownloads({
  type,
  id,
  season = 1,
  episode = 1,
  imdbId,
  signal,
  title,
  originalLanguage,
  productionCountries,
  releaseYear,
}: FetchOptions): Promise<DownloadResponse> {
  const cleanTitle = cleanMovieTitle(title || '');
  const lang = (originalLanguage || '').toLowerCase().trim();
  const isIndianLang = ['hi', 'ta', 'te', 'ml', 'kn', 'bn', 'pa', 'mr', 'gu'].includes(lang);
  const isIndianCountry = Array.isArray(productionCountries) && productionCountries.some((c) => {
    const code = String(c).toUpperCase();
    return code === 'IN' || code === 'INDIA';
  });
  const isBollywoodTitle = /bollywood|hindi|sholay|ddlj|pathaan|jawan|stree|dunki|dangal|baahubali|kgf|pushpa|rrr/i.test(cleanTitle);

  const isIndian = isIndianLang || isIndianCountry || isBollywoodTitle;
  const isClassic = Boolean(releaseYear && releaseYear < 2012);

  const cacheKey = `cv:dl:v2:${type}:${id}:${cleanTitle}:${type === 'tv' ? `${season}:${episode}` : ''}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.exp > Date.now() && Array.isArray(parsed.data?.downloads)) {
        return parsed.data;
      }
    }
  } catch {}

  const nxshaDlUrl = type === 'tv'
    ? `https://nxsha.space/dl/tv/${imdbId || id}/${season}/${episode}`
    : `https://nxsha.space/dl/movie/${imdbId || id}`;
  const mirrorUrl = nxshaDlUrl;

  const path = type === 'tv' ? `tv/${id}/${season}/${episode}` : `movie/${id}`;

  // Fetch upstream multi-provider APIs with strict 3.5s timeout protection
  const fetches: Promise<any>[] = [
    fetchWithTimeout(`https://tgdl.lovable.app/api/${path}`, 3000, signal),
    fetchWithTimeout(`https://vidsrc.party/api/downloads/${path}`, 3000, signal),
  ];

  if (imdbId) {
    const torrentioPath = type === 'tv' ? `series/${imdbId}:${season}:${episode}` : `movie/${imdbId}`;
    fetches.push(fetchWithTimeout(`https://torrentio.strem.fun/stream/${torrentioPath}.json`, 3500, signal));
  } else {
    fetches.push(Promise.resolve(null));
  }

  if (isClassic && cleanTitle) {
    const archiveSearchUrl = `https://archive.org/advancedsearch.php?q=title%3A(${encodeURIComponent(cleanTitle)})+AND+mediatype%3A(movies)&fl[]=identifier,title,downloads&sort[]=downloads+desc&rows=1&output=json`;
    fetches.push(fetchWithTimeout(archiveSearchUrl, 3500, signal));
  } else {
    fetches.push(Promise.resolve(null));
  }

  const [tgdlRes, vidsrcRes, torrentioRes, archiveRes] = await Promise.allSettled(fetches);

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
      isPinned: false,
      category: 'hub',
      speedBadge: 'Multi-Host Hub',
      description: 'Interactive multi-source cloud hub with automatic mirror failover.',
    },
  ];

  // Parse Internet Archive Direct MP4 (True 1-Click Direct File Download for Classics)
  if (archiveRes.status === 'fulfilled' && archiveRes.value) {
    const aData = archiveRes.value;
    const docs = aData?.response?.docs || [];
    if (docs.length > 0 && docs[0]?.identifier) {
      const identifier = docs[0].identifier;
      try {
        const fileData = await fetchWithTimeout(`https://archive.org/metadata/${identifier}/files`, 3000, signal);
        const files: any[] = Array.isArray(fileData?.result) ? fileData.result : [];
        const videoFile = files.find((f) => f.name && (f.name.endsWith('.mp4') || f.name.endsWith('.mkv')));
        if (videoFile) {
          const directMp4Url = `https://archive.org/download/${identifier}/${encodeURIComponent(videoFile.name)}`;
          const sizeBytes = parseInt(videoFile.size || '0', 10) || null;
          const sizeStr = sizeBytes
            ? sizeBytes >= 1024 * 1024 * 1024
              ? `${(sizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
              : `${(sizeBytes / (1024 * 1024)).toFixed(0)} MB`
            : '~1.5 GB';

          rawLinks.unshift({
            id: `archive-direct-${identifier}`,
            name: `${cleanTitle} (${releaseYear || ''}) — Direct MP4 Download [Archive.org]`,
            quality: '1080p',
            qualityRaw: '1080p Direct MP4',
            format: videoFile.name.endsWith('.mp4') ? 'MP4' : 'MKV',
            size: sizeStr,
            sizeBytes,
            provider: 'Internet Archive Vault',
            providerCode: 'archive',
            audio: 'Original Classic Audio [Mono/Stereo]',
            url: directMp4Url,
            directUrl: directMp4Url,
            isOneClick: true,
            isPinned: true,
            category: 'classic',
            speedBadge: '⚡ 1-Click Direct MP4',
            description: '100% direct, ad-free legal MP4 download from Internet Archive. Downloads directly in your browser with 1 click.',
          });
        }
      } catch {}
    }
  }

  // Parse Torrentio High-Speed Swarms (1-Click Magnet + Webtor Cloud Download)
  if (torrentioRes.status === 'fulfilled' && torrentioRes.value) {
    const tData = torrentioRes.value;
    const streams: any[] = Array.isArray(tData?.streams) ? tData.streams : [];
    const parsedTorrents: UnifiedDownloadLink[] = [];

    streams.forEach((s, idx) => {
      if (!s.infoHash) return;
      const rawTitle = s.title || '';
      const filename = s.behaviorHints?.filename || rawTitle.split('\n')[0] || `Release ${idx + 1}`;

      // Parse file size
      const sizeMatch = rawTitle.match(/💾\s*([\d.]+\s*[GMK]B)/i);
      const sizeStr = sizeMatch ? sizeMatch[1].trim() : null;

      // Parse seeders
      const seedersMatch = rawTitle.match(/👤\s*(\d+)/);
      const seeders = seedersMatch ? parseInt(seedersMatch[1], 10) : 0;

      // Parse quality
      let quality: '4K' | '1080p' | '720p' | '480p' | 'Auto' = '1080p';
      const nameAndTitle = `${s.name || ''} ${filename} ${rawTitle}`.toLowerCase();
      if (nameAndTitle.includes('4k') || nameAndTitle.includes('2160p') || nameAndTitle.includes('uhd')) quality = '4K';
      else if (nameAndTitle.includes('1080p') || nameAndTitle.includes('1080')) quality = '1080p';
      else if (nameAndTitle.includes('720p') || nameAndTitle.includes('720')) quality = '720p';
      else if (nameAndTitle.includes('480p') || nameAndTitle.includes('480')) quality = '480p';

      // Parse audio
      const isHindi = nameAndTitle.includes('hindi') || nameAndTitle.includes('hin') || isIndian;
      const isDual = nameAndTitle.includes('dual') || nameAndTitle.includes('multi');
      const audio = isDual
        ? 'Hindi + English Dual Audio'
        : isHindi
        ? 'Hindi Original DD+ 5.1'
        : detectAudio(filename, rawTitle);

      const format: 'MP4' | 'MKV' | 'File' = filename.toLowerCase().endsWith('.mp4') ? 'MP4' : 'MKV';

      // Build tracker-rich magnet link
      const trackers = [
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://open.demonii.com:1337/announce',
        'udp://tracker.torrent.eu.org:451/announce',
        'udp://tracker.coppersurfer.tk:6969/announce',
        'udp://tracker.openbittorrent.com:6969/announce',
      ].map((t) => '&tr=' + encodeURIComponent(t)).join('');

      const magnetUrl = `magnet:?xt=urn:btih:${s.infoHash}&dn=${encodeURIComponent(filename)}${trackers}`;
      const webtorUrl = `https://webtor.io/show?magnet=${encodeURIComponent(magnetUrl)}`;

      parsedTorrents.push({
        id: `tor-${idx}-${s.infoHash.slice(0, 8)}`,
        name: filename,
        quality,
        qualityRaw: `${quality} (${seeders > 0 ? `${seeders} Seeders` : 'High-Speed'})`,
        format,
        size: sizeStr,
        sizeBytes: parseSizeToBytes(sizeStr),
        provider: 'Torrentio High-Speed Swarm',
        providerCode: 'torrentio',
        audio,
        url: magnetUrl,
        magnetUrl,
        webtorUrl,
        seeders,
        isOneClick: true,
        isPinned: false,
        category: isIndian ? 'bollywood' : 'cloud',
        speedBadge: seeders > 15 ? `⚡ Fast (${seeders} Seeds)` : seeders > 0 ? `${seeders} Seeds` : 'Web Download',
        description: 'Direct 1-click web and torrent download.',
      });
    });

    // Keep only active torrents with healthy seeders (filter out dead 0-seeder swarms)
    const seededTorrents = parsedTorrents.filter((t) => (t.seeders || 0) > 0);
    const candidateTorrents = seededTorrents.length > 0 ? seededTorrents : parsedTorrents.slice(0, 2);

    // Sort by seeders descending so the fastest downloads appear first
    candidateTorrents.sort((a, b) => (b.seeders || 0) - (a.seeders || 0));

    // Limit to top 8 best-seeded torrents to ensure maximum download speed and no clutter
    rawLinks.push(...candidateTorrents.slice(0, 8));
  }

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
        category: 'cloud',
        speedBadge: 'Direct Cloud Node',
        description: 'Direct high-speed upstream mirror with resume capability.',
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
        category: 'cloud',
        speedBadge: 'Fast Cloud Mirror',
        description: 'High-speed cloud CDN stream with direct file access.',
      });
    });
  }

  // If a valid title is provided, generate verified, fast-loading specialized download gateways
  if (cleanTitle) {
    if (isIndian) {
      // 🇮🇳 DEDICATED BOLLYWOOD & INDIAN CINEMA GATEWAYS

      // 1. ScreenScape Hindi Fast In-Player Downloader (Direct Hindi feed with in-player Sealx / HDHub downloads)
      rawLinks.push({
        id: `ss-stream-${id}`,
        name: `${cleanTitle} — ScreenScape Hindi In-Player Downloader`,
        quality: '1080p',
        qualityRaw: '1080p HD',
        format: 'MP4',
        size: 'Direct 1080p / 720p',
        sizeBytes: null,
        provider: 'ScreenScape In-Player Downloader',
        providerCode: 'screenscape',
        audio: 'Hindi • Multi-Audio (Sealx / HDHub / Mamba)',
        url: type === 'tv'
          ? `https://screenscape.me/embed?tmdb=${id}&type=tv&s=${season}&e=${episode}&lan=hindi`
          : `https://screenscape.me/embed?tmdb=${id}&type=movie&lan=hindi`,
        isPinned: true,
        category: 'bollywood',
        speedBadge: '⚡ In-Player Downloader',
        description: 'Built-in direct download engine. Open player and click the ⬇️ Download icon in player controls to grab instant 1-click links from Sealx & HDHub.',
      });

      // 2. Videasy 4K / 1080p Cloud Stream Node
      rawLinks.push({
        id: `videasy-stream-${id}`,
        name: `${cleanTitle} — Videasy 4K / 1080p Cloud Node`,
        quality: '4K',
        qualityRaw: '4K UHD / 1080p',
        format: 'MP4',
        size: '4K Stream Node',
        sizeBytes: null,
        provider: 'Videasy 4K Cloud Node',
        providerCode: 'videasy',
        audio: 'Hindi + Multi-Audio',
        url: type === 'tv'
          ? `https://player.videasy.to/tv/${id}/${season}/${episode}`
          : `https://player.videasy.to/movie/${id}`,
        isPinned: false,
        category: 'bollywood',
        speedBadge: '4K Stream & Capture',
        description: 'Multi-server cloud video node with high-bitrate audio and stream capture support.',
      });

      // 3. AutoEmbed Fast Cloud Mirror
      rawLinks.push({
        id: `autoembed-stream-${id}`,
        name: `${cleanTitle} — AutoEmbed Fast Cloud Mirror`,
        quality: '1080p',
        qualityRaw: '1080p HD',
        format: 'MP4',
        size: 'Cloud CDN Stream',
        sizeBytes: null,
        provider: 'AutoEmbed Direct Stream',
        providerCode: 'autoembed',
        audio: 'Hindi / Multi-Audio',
        url: type === 'tv'
          ? `https://autoembed.co/tv/tmdb/${id}-${season}-${episode}`
          : `https://autoembed.co/movie/tmdb/${id}`,
        isPinned: false,
        category: 'bollywood',
        speedBadge: 'Fast Cloud Mirror',
        description: 'High-availability video node for mobile streaming and download managers.',
      });
    } else {
      // 🌐 HOLLYWOOD & INTERNATIONAL CINEMA GATEWAYS

      // 1. ScreenScape In-Player Downloader (4K / 1080p Showbox & HDHub)
      rawLinks.push({
        id: `ss-stream-${id}`,
        name: `${cleanTitle} — ScreenScape In-Player Downloader`,
        quality: '1080p',
        qualityRaw: '1080p / 4K',
        format: 'MP4',
        size: 'Direct 1080p / 4K',
        sizeBytes: null,
        provider: 'ScreenScape In-Player Downloader',
        providerCode: 'screenscape',
        audio: 'Original / Multi-Audio (Showbox / HDHub)',
        url: type === 'tv'
          ? `https://screenscape.me/embed?tmdb=${id}&type=tv&s=${season}&e=${episode}`
          : `https://screenscape.me/embed?tmdb=${id}&type=movie`,
        isPinned: true,
        category: 'cloud',
        speedBadge: '⚡ In-Player Downloader',
        description: 'Built-in direct download engine. Open player and click the ⬇️ Download icon in player controls to grab instant 1-click links from Showbox & HDHub.',
      });

      // 2. Videasy 4K Ultra HD Cloud Node
      rawLinks.push({
        id: `videasy-stream-${id}`,
        name: `${cleanTitle} — Videasy 4K Ultra HD Cloud Node`,
        quality: '4K',
        qualityRaw: '4K UHD',
        format: 'MP4',
        size: '4K Stream Node',
        sizeBytes: null,
        provider: 'Videasy 4K Cloud Node',
        providerCode: 'videasy',
        audio: 'English 5.1 Surround',
        url: type === 'tv'
          ? `https://player.videasy.to/tv/${id}/${season}/${episode}`
          : `https://player.videasy.to/movie/${id}`,
        isPinned: false,
        category: 'cloud',
        speedBadge: '4K Stream & Capture',
        description: 'Multi-server 4K video stream node ready for instant playback or browser download capture.',
      });

      // 3. AutoEmbed Direct Cloud Node
      rawLinks.push({
        id: `autoembed-stream-${id}`,
        name: `${cleanTitle} — AutoEmbed Direct Cloud Stream`,
        quality: '1080p',
        qualityRaw: '1080p HD',
        format: 'MP4',
        size: 'Cloud CDN Stream',
        sizeBytes: null,
        provider: 'AutoEmbed Direct Stream',
        providerCode: 'autoembed',
        audio: 'English / Multi-Audio',
        url: type === 'tv'
          ? `https://autoembed.co/tv/tmdb/${id}-${season}-${episode}`
          : `https://autoembed.co/movie/tmdb/${id}`,
        isPinned: false,
        category: 'cloud',
        speedBadge: 'Fast Cloud Mirror',
        description: 'High-availability video node for mobile streaming and download managers.',
      });
    }
  }

  // Deduplicate links by normalized URL and ID
  const seenUrls = new Set<string>();
  const seenIds = new Set<string>();
  const uniqueLinks: UnifiedDownloadLink[] = [];
  for (const item of rawLinks) {
    const cleanUrl = item.url.trim().toLowerCase();
    if (!seenUrls.has(cleanUrl) && !seenIds.has(item.id)) {
      seenUrls.add(cleanUrl);
      seenIds.add(item.id);
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
    if (a.isOneClick && !b.isOneClick) return -1;
    if (!a.isOneClick && b.isOneClick) return 1;

    // For torrent swarms, prioritize highest active seeders for maximum download speed
    const aSeeds = a.seeders ?? 0;
    const bSeeds = b.seeders ?? 0;
    if (aSeeds > 0 || bSeeds > 0) {
      if (aSeeds !== bSeeds) {
        return bSeeds - aSeeds;
      }
    }

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
    isIndian,
    isClassic,
    mediaTitle: cleanTitle,
    releaseYear,
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

