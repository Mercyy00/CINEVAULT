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

  it('fetches and merges multi-provider links in parallel', async () => {
    const mockTgdl = {
      success: true,
      downloads: [
        {
          name: 'Spider-Man 1080p Febbox',
          quality: '1080p',
          size: '8.91 GB',
          download_url: 'https://www.febbox.com/share/zcegI2J7',
        },
        {
          name: 'Spider-Man 720p Bollyflix',
          quality: '720p',
          size: '1.2 GB',
          download_url: 'https://dl.fastdlserver.site/?id=abc',
        },
      ],
    };

    const mockVidsrc = {
      downloads: [
        {
          name: 'Spider-Man 4K REMUX',
          quality: '4K',
          size: '19.5 GB',
          directUrl: 'https://cdn.example.com/spiderman-4k.mkv',
          source: '4khdhub',
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
      if (urlStr.includes('vidsrc.party')) {
        return {
          ok: true,
          json: async () => mockVidsrc,
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

      expect(result.downloads.length).toBe(3);
      // Pinned Febbox first, then 4K, then 720p
      expect(result.downloads[0].url).toBe('https://www.febbox.com/share/zcegI2J7');
      expect(result.downloads[1].quality).toBe('4K');
      expect(result.downloads[2].quality).toBe('720p');
      expect(result.mirrorUrl).toContain('theogpiratebot.vercel.app');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
