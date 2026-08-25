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
    id: 'screenscape-en',
    name: 'ScreenScape English',
    quality: '4K',
    language: 'english',
    latencyMs: null,
    status: 'unknown',
    buildUrl: ({ id, season, episode }) =>
      season && episode
        ? `https://screenscape.me/embed?tmdb=${id}&type=tv&s=${season}&e=${episode}&lan=eng`
        : `https://screenscape.me/embed?tmdb=${id}&type=movie&lan=eng`,
  },
  {
    id: 'modiplay-hi',
    name: 'ModiPlay Hindi',
    quality: '4K',
    language: 'hindi',
    latencyMs: null,
    status: 'unknown',
    requiresImdbId: true,
    buildUrl: ({ id, season, episode, imdbId }) =>
      season && episode
        ? `https://rozgarlelo.modiplay.xyz/embed/imdb/tv?id=${imdbId || id}&s=${season}&e=${episode}`
        : `https://rozgarlelo.modiplay.xyz/embed/imdb/movie?id=${imdbId || id}`,
  },
  {
    id: 'mbply-hi',
    name: 'MbPly Hindi',
    quality: '4K',
    language: 'hindi',
    latencyMs: null,
    status: 'unknown',
    buildUrl: ({ id, season, episode }) =>
      season && episode
        ? `https://cinesrc.st/embed/tv/${id}/${season}/${episode}?server=MbPly-[Multi-Lang]&lang=hi&sub=hi&disable_app_ad=true`
        : `https://cinesrc.st/embed/movie/${id}?server=MbPly-[Multi-Lang]&lang=hi&sub=hi&disable_app_ad=true`,
  },
  {
    id: 'cinesrc-hi',
    name: 'CineSrc Hindi Dub',
    quality: 'HD',
    language: 'hindi',
    latencyMs: null,
    status: 'unknown',
    buildUrl: ({ id, season, episode }) =>
      season && episode
        ? `https://cinesrc.st/embed/tv/${id}/${season}/${episode}?lang=hi&sub=hi&disable_app_ad=true`
        : `https://cinesrc.st/embed/movie/${id}?lang=hi&sub=hi&disable_app_ad=true`,
  },
  {
    id: 'autoembed-hi',
    name: 'AutoEmbed Hindi',
    quality: '4K',
    language: 'hindi',
    latencyMs: null,
    status: 'unknown',
    buildUrl: ({ id, season, episode }) =>
      season && episode
        ? `https://autoembed.co/tv/tmdb/${id}/${season}/${episode}?lang=hi&sub=hi`
        : `https://autoembed.co/movie/tmdb/${id}?lang=hi&sub=hi`,
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
    id: 'viduki-1',
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
    id: 'viduki-2',
    name: 'Viduki Multi-Lang',
    quality: 'HD',
    language: 'multi',
    latencyMs: null,
    status: 'unknown',
    buildUrl: ({ id, season, episode }) =>
      season && episode
        ? `https://viduki.net/2/tv/${id}/${season}/${episode}`
        : `https://viduki.net/2/movie/${id}`,
  },
  {
    id: 'viduki-3',
    name: 'Viduki Premium',
    quality: '4K',
    language: 'multi',
    latencyMs: null,
    status: 'unknown',
    buildUrl: ({ id, season, episode }) =>
      season && episode
        ? `https://viduki.net/3/tv/${id}/${season}/${episode}`
        : `https://viduki.net/3/movie/${id}`,
  },
  {
    id: 'vidsync',
    name: 'VidSync Cloud',
    quality: 'HD',
    language: 'english',
    latencyMs: null,
    status: 'unknown',
    buildUrl: ({ id, season, episode }) =>
      season && episode
        ? `https://vidsync.xyz/embed/tv/${id}/${season}/${episode}?autoPlay=true`
        : `https://vidsync.xyz/embed/movie/${id}?autoPlay=true`,
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
    id: 'videasy',
    name: 'Videasy',
    quality: 'HD',
    language: 'english',
    latencyMs: null,
    status: 'unknown',
    buildUrl: ({ id, season, episode }) =>
      season && episode
        ? `https://player.videasy.net/tv/${id}/${season}/${episode}?nextEpisode=true&autoplayNextEpisode=true`
        : `https://player.videasy.net/movie/${id}`,
  },
  {
    id: 'vidfast',
    name: 'VidFast Pro',
    quality: '4K',
    language: 'english',
    latencyMs: null,
    status: 'unknown',
    buildUrl: ({ id, season, episode }) =>
      season && episode
        ? `https://vidfast.pro/tv/${id}/${season}/${episode}?autoPlay=true`
        : `https://vidfast.pro/movie/${id}?autoPlay=true`,
  },
  {
    id: 'cinesrc',
    name: 'CineSrc HD',
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
];

/**
 * Origins whose `postMessage` payloads are trusted for progress reporting.
 *
 * Every other origin's messages are ignored, so an unrelated embedded page
 * cannot forge watch history.
 */
export const TRUSTED_PLAYER_ORIGINS = new Set([
  'https://screenscape.me',
  'https://peachify.pro',
]);

/**
 * Iframe sandbox for third-party embeds.
 *
 * Deliberately omits `allow-top-navigation` and `allow-popups`: these hosts
 * monetise with pop-unders and full-page redirects, and without those tokens
 * the browser blocks both. `allow-same-origin` keeps the embed on its *own*
 * origin (not ours) so its player storage and HLS requests still work.
 */
export const EMBED_SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-presentation';

export function findSource(id: string | undefined): StreamSource | undefined {
  return STREAM_SOURCES.find((source) => source.id === id);
}
