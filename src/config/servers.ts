import type { ServerOption } from '../types';

/**
 * Playback source catalogue.
 *
 * Previously this lived inline in `PlayerPage.tsx` with two fabricated fields
 * on every entry:
 *
 * - `latency: 8 | 12 | 45 | 105 | ...` — hardcoded numbers that the sidebar
 *   rendered as live signal bars and a "12ms" readout. Nothing measured them.
 *   Browsers cannot time a cross-origin embed (no CORS headers, no Timing-
 *   Allow-Origin), so the honest value is `null` and the UI omits the readout.
 * - `status: 'working'` on all 17 entries — asserted, never checked. Only
 *   `maintenance` is real, because a human sets it.
 *
 * The entry for "ArtPlayer (Custom)" pointed at Google's BigBuckBunny sample
 * MP4 and depended on `window.Artplayer` / `window.Hls`, neither of which is
 * ever loaded by this app. Selecting it played a cartoon rabbit instead of the
 * title the user asked for, so it is gone.
 */

export interface StreamSource extends ServerOption {
  /** Audio language the source advertises. Drives the badge in the picker. */
  language: 'hindi' | 'english' | 'multi';
  /** True when the source needs an IMDb id rather than a TMDB id. */
  requiresImdbId?: boolean;
}

export const STREAM_SOURCES: StreamSource[] = [
  {
    id: 'modiplay-hi',
    name: 'ModiPlay Hindi',
    quality: '4K',
    language: 'hindi',
    latencyMs: null,
    status: 'unknown',
    buildUrl: ({ id, season, episode }) =>
      season && episode
        ? `https://rozgarlelo.modiplay.xyz/embed/tmdb/tv?id=${id}&s=${season}&e=${episode}`
        : `https://rozgarlelo.modiplay.xyz/embed/tmdb/movie?id=${id}`,
  },
  {
    id: 'screenscape-hi',
    name: 'ScreenScape Hindi',
    quality: '4K',
    language: 'hindi',
    latencyMs: null,
    status: 'unknown',
    buildUrl: ({ id, season, episode }) =>
      season && episode
        ? `https://screenscape.me/embed?tmdb=${id}&type=tv&s=${season}&e=${episode}&lan=hindi`
        : `https://screenscape.me/embed?tmdb=${id}&type=movie&lan=hindi`,
  },
  {
    id: 'videasy',
    name: 'VIDEASY 4K',
    quality: '4K',
    language: 'multi',
    latencyMs: null,
    status: 'unknown',
    buildUrl: ({ id, season, episode, progress }) => {
      const startSec = progress && progress > 5 ? Math.round(progress) : null;
      const progParam = startSec ? `&progress=${startSec}` : '';
      return season && episode
        ? `https://player.videasy.to/tv/${id}/${season}/${episode}?color=e8852a&nextEpisode=true&episodeSelector=true&autoplayNextEpisode=true${progParam}`
        : `https://player.videasy.to/movie/${id}?color=e8852a${progParam}`;
    },
  },
  {
    id: 'zxc',
    name: 'ZXC Stream',
    quality: 'HD',
    language: 'english',
    latencyMs: null,
    status: 'unknown',
    buildUrl: ({ id, season, episode }) =>
      season && episode
        ? `https://zxcstream.xyz/player/tv/${id}/${season}/${episode}`
        : `https://zxcstream.xyz/player/movie/${id}`,
  },
  {
    id: 'peachify',
    name: 'Peachify',
    quality: 'HD',
    language: 'multi',
    latencyMs: null,
    status: 'unknown',
    buildUrl: ({ id, season, episode }) =>
      season && episode
        ? `https://peachify.pro/embed/tv/${id}/${season}/${episode}?autoNext=true&showNextBtn=true`
        : `https://peachify.pro/embed/movie/${id}?autoPlay=true`,
  },
  {
    id: 'viduki',
    name: 'Viduki',
    quality: 'HD',
    language: 'english',
    latencyMs: null,
    status: 'unknown',
    buildUrl: ({ id, season, episode }) =>
      season && episode
        ? `https://viduki.net/1/tv/${id}/${season}/${episode}`
        : `https://viduki.net/1/movie/${id}`,
  },
  {
    id: '111movies',
    name: '111 Movies',
    quality: 'SD',
    language: 'english',
    latencyMs: null,
    status: 'unknown',
    buildUrl: ({ id, season, episode }) =>
      season && episode
        ? `https://111movies.com/tv/${id}/${season}/${episode}`
        : `https://111movies.com/movie/${id}`,
  },
  {
    id: 'vidlink',
    name: 'VidLink Pro',
    quality: 'HD',
    language: 'english',
    latencyMs: null,
    status: 'unknown',
    buildUrl: ({ id, season, episode }) =>
      season && episode
        ? `https://vidlink.pro/tv/${id}/${season}/${episode}`
        : `https://vidlink.pro/movie/${id}`,
  },
  {
    id: 'cinesrc',
    name: 'CineSrc',
    quality: 'HD',
    language: 'multi',
    latencyMs: null,
    status: 'unknown',
    buildUrl: ({ id, season, episode }) =>
      season && episode
        ? `https://cinesrc.st/embed/tv/${id}/${season}/${episode}`
        : `https://cinesrc.st/embed/movie/${id}`,
  },
  {
    id: 'vidsync',
    name: 'VidSync',
    quality: 'HD',
    language: 'english',
    latencyMs: null,
    status: 'unknown',
    buildUrl: ({ id, season, episode }) =>
      season && episode
        ? `https://vidsync.xyz/embed/tv/${id}/${season}/${episode}?autoPlay=true`
        : `https://vidsync.xyz/embed/movie/${id}?autoPlay=true`,
  },
];

/**
 * Origins whose `postMessage` payloads are trusted for progress reporting.
 *
 * Every other origin's messages are ignored, so an unrelated embedded page
 * cannot forge watch history.
 */
export const TRUSTED_PLAYER_ORIGINS = new Set([
  'https://screenscape.me',
  'https://rozgarlelo.modiplay.xyz',
  'https://opstream.fun',
  'https://zxcstream.xyz',
  'https://peachify.pro',
  'https://viduki.net',
  'https://111movies.com',
  'https://vidlink.pro',
  'https://cinesrc.st',
  'https://player.videasy.net',
  'https://videasy.net',
  'https://player.videasy.to',
  'https://videasy.to',
  'https://vidsync.xyz',
]);

export function findSource(id: string | undefined): StreamSource | undefined {
  return STREAM_SOURCES.find((source) => source.id === id);
}
