import { describe, it, expect, vi } from 'vitest';
import {
  normalizeQuality,
  detectAudio,
  detectFormat,
  detectProvider,
  parseSizeToBytes,
  fetchDownloads,
} from '../downloadService';

describe('downloadService', () => {
  it('normalizes resolution quality tags accurately', () => {
    expect(normalizeQuality('2160p BluRay')).toBe('4K');
    expect(normalizeQuality('4K UHD')).toBe('4K');
    expect(normalizeQuality('1080p')).toBe('1080p');
    expect(normalizeQuality('', 'Movie Title 720p x264')).toBe('720p');
    expect(normalizeQuality('480p')).toBe('480p');
    expect(normalizeQuality('unknown')).toBe('Auto');
  });

  it('detects audio tracks and codecs', () => {
    expect(detectAudio('Hindi + English', 'Spider-Man')).toBe('Hindi + English');
    expect(detectAudio('Hindi', 'Movie Hindi Dub')).toBe('Hindi Dub');
    expect(detectAudio('English', 'Spider-Man')).toBe('English');
    expect(detectAudio('Org Dual Audio', 'Movie')).toBe('Hindi + English');
    expect(detectAudio('', 'Movie with ESub')).toBe('English Subtitles');
  });

  it('detects file containers', () => {
    expect(detectFormat('https://site.com/movie.mkv')).toBe('MKV');
    expect(detectFormat('https://site.com/video.mp4')).toBe('MP4');
    expect(detectFormat('https://site.com/stream')).toBe('File');
  });

  it('identifies provider brands', () => {
    expect(detectProvider('https://www.febbox.com/share/abc').name).toContain('Febbox');
    expect(detectProvider('https://dl.fastdlserver.site/?id=123').name).toContain('Fastdlserver');
    expect(detectProvider('', '4khdhub').name).toBe('4KHDHub');
    expect(detectProvider('', 'vidgod').name).toBe('VidGod');
  });

  it('parses human-readable sizes into bytes', () => {
    expect(parseSizeToBytes('8.91 GB')).toBe(8.91 * 1024 * 1024 * 1024);
    expect(parseSizeToBytes('790MB')).toBe(790 * 1024 * 1024);
    expect(parseSizeToBytes(null)).toBeNull();
  });

  it('fetches and merges multi-provider links including Torrentio 1-click swarms', async () => {
    const mockTgdl = {
      success: true,
      downloads: [
        {
          name: 'Spider-Man 1080p Febbox',
          quality: '1080p',
          size: '8.91 GB',
          download_url: 'https://www.febbox.com/share/zcegI2J7',
        },
      ],
    };

    const mockTorrentio = {
      streams: [
        {
          name: 'Torrentio\n1080p',
          title: 'Spider-Man.No.Way.Home.2021.1080p.WEBRip.x264\n👤 42 💾 2.45 GB',
          infoHash: 'abcd1234ef567890abcd1234ef567890abcd1234',
          behaviorHints: {
            filename: 'Spider-Man.No.Way.Home.2021.1080p.WEBRip.x264.mkv',
          },
        },
      ],
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('tgdl.lovable.app')) {
        return {
          ok: true,
          json: async () => mockTgdl,
        } as any;
      }
      if (urlStr.includes('torrentio.strem.fun')) {
        return {
          ok: true,
          json: async () => mockTorrentio,
        } as any;
      }
      return { ok: false } as any;
    });

    try {
      const result = await fetchDownloads({
        type: 'movie',
        id: '969681',
        imdbId: 'tt22084616',
      });

      expect(result.downloads.length).toBeGreaterThanOrEqual(2);
      expect(result.nxshaDlUrl).toBe('https://nxsha.space/dl/movie/tt22084616');
      expect(result.downloads.some((d) => d.providerCode === 'nxsha')).toBe(true);
      expect(result.downloads.some((d) => d.providerCode === 'theogpiratebot')).toBe(false);

      // Verify Torrentio 1-click swarm link
      const torLink = result.downloads.find((d) => d.providerCode === 'torrentio');
      expect(torLink).toBeDefined();
      expect(torLink?.isOneClick).toBe(true);
      expect(torLink?.magnetUrl).toContain('magnet:?xt=urn:btih:abcd1234ef567890abcd1234ef567890abcd1234');
      expect(torLink?.webtorUrl).toContain('https://webtor.io/show?magnet=');
      expect(torLink?.seeders).toBe(42);
      expect(torLink?.size).toBe('2.45 GB');
      expect(torLink?.quality).toBe('1080p');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('generates verified Bollywood gateways for modern Hindi titles', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => ({ ok: false } as any));

    try {
      const result = await fetchDownloads({
        type: 'movie',
        id: '872906',
        title: 'Jawan',
        originalLanguage: 'hi',
        productionCountries: ['IN'],
        releaseYear: 2023,
      });

      expect(result.isIndian).toBe(true);
      expect(result.isClassic).toBe(false);
      // Should include ScreenScape Hindi, Videasy 4K, AutoEmbed, and NxSha
      expect(result.downloads.some((d) => d.providerCode === 'screenscape')).toBe(true);
      expect(result.downloads.some((d) => d.providerCode === 'videasy')).toBe(true);
      expect(result.downloads.some((d) => d.providerCode === 'autoembed')).toBe(true);
      expect(result.downloads.some((d) => d.audio.includes('Hindi'))).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('fetches direct 1-click MP4 files from Internet Archive for vintage Bollywood titles', async () => {
    const mockArchiveSearch = {
      response: {
        numFound: 1,
        docs: [{ identifier: 'sholay-1975-restored' }],
      },
    };

    const mockArchiveFiles = {
      result: [
        { name: 'sholay-1975-restored.mp4', size: '1572864000', format: 'h.264' },
      ],
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('archive.org/advancedsearch.php')) {
        return {
          ok: true,
          json: async () => mockArchiveSearch,
        } as any;
      }
      if (urlStr.includes('archive.org/metadata/sholay-1975-restored/files')) {
        return {
          ok: true,
          json: async () => mockArchiveFiles,
        } as any;
      }
      return { ok: false } as any;
    });

    try {
      const result = await fetchDownloads({
        type: 'movie',
        id: '12345',
        title: 'Sholay',
        originalLanguage: 'hi',
        productionCountries: ['IN'],
        releaseYear: 1975,
      });

      expect(result.isIndian).toBe(true);
      expect(result.isClassic).toBe(true);

      const archiveLink = result.downloads.find((d) => d.providerCode === 'archive');
      expect(archiveLink).toBeDefined();
      expect(archiveLink?.isOneClick).toBe(true);
      expect(archiveLink?.category).toBe('classic');
      expect(archiveLink?.directUrl).toBe('https://archive.org/download/sholay-1975-restored/sholay-1975-restored.mp4');
      expect(archiveLink?.format).toBe('MP4');
      expect(archiveLink?.size).toBe('1.46 GB');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('generates 4K streams and multi-server gateways for Hollywood titles', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => ({ ok: false } as any));

    try {
      const result = await fetchDownloads({
        type: 'movie',
        id: '872585',
        title: 'Oppenheimer',
        originalLanguage: 'en',
        productionCountries: ['US'],
        releaseYear: 2023,
      });

      expect(result.isIndian).toBe(false);
      expect(result.downloads.some((d) => d.providerCode === 'videasy')).toBe(true);
      expect(result.downloads.some((d) => d.providerCode === 'autoembed')).toBe(true);
      expect(result.downloads.some((d) => d.providerCode === 'nxsha')).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('filters out dead 0-seeder torrents and ranks by highest seeders first', async () => {
    const mockTorrentio = {
      streams: [
        {
          name: 'Torrentio\n1080p',
          title: 'Movie.Dead.0Seeds.1080p.mkv\n👤 0 💾 2.1 GB',
          infoHash: 'dead000000000000000000000000000000000000',
        },
        {
          name: 'Torrentio\n1080p',
          title: 'Movie.Slow.2Seeds.1080p.mkv\n👤 2 💾 1.8 GB',
          infoHash: 'slow222222222222222222222222222222222222',
        },
        {
          name: 'Torrentio\n1080p',
          title: 'Movie.Fast.85Seeds.1080p.mkv\n👤 85 💾 3.4 GB',
          infoHash: 'fast858585858585858585858585858585858585',
        },
      ],
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('torrentio.strem.fun')) {
        return {
          ok: true,
          json: async () => mockTorrentio,
        } as any;
      }
      return { ok: false } as any;
    });

    try {
      const result = await fetchDownloads({
        type: 'movie',
        id: '99999',
        imdbId: 'tt9999999',
      });

      const torrentLinks = result.downloads.filter((d) => d.providerCode === 'torrentio');
      expect(torrentLinks.length).toBe(2);
      // Dead 0-seeder torrent must be filtered out
      expect(torrentLinks.some((d) => d.name.includes('Dead.0Seeds'))).toBe(false);
      // Fast 85-seeder torrent must be ranked ahead of slow 2-seeder torrent
      expect(torrentLinks[0].seeders).toBe(85);
      expect(torrentLinks[1].seeders).toBe(2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
