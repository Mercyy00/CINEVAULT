import { TRUSTED_PLAYER_ORIGINS } from '../config/servers';

export type AnimeServerId =
  | 'zokoanime'
  | 'megaplay'
  | 'videasy'
  | 'vidlink'
  | 'vidstuck'
  | 'screenmirror'
  | 'gogoanime'
  | 'screenscape';

export interface AnimeServerOption {
  id: AnimeServerId;
  name: string;
  quality: string;
  tag: string;
}

export function formatSeconds(totalSec: number): string {
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = Math.floor(totalSec % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const ANIME_SERVERS: AnimeServerOption[] = [
  { id: 'megaplay', name: 'MegaPlay (Primary)', quality: '1080p', tag: 'Direct MAL • Sub/Dub' },
  { id: 'zokoanime', name: 'Zoko Anime', quality: '1080p', tag: 'Auto-Skip • Sub/Dub' },
  { id: 'vidstuck', name: 'VIDSTUCK 4K', quality: '1080p', tag: 'Auto-Skip • Sub/Dub Sync' },
  { id: 'videasy', name: 'VIDEASY 4K', quality: '4K', tag: 'Direct AniList • 4K Sub/Dub' },
  { id: 'vidlink', name: 'VidLink Pro', quality: '1080p', tag: 'Direct Sync • Sub/Dub' },
  { id: 'screenmirror', name: 'ModiPlay Hindi', quality: '4K', tag: 'TMDB • Multi-Audio' },
  { id: 'gogoanime', name: 'GogoAnime', quality: 'HD', tag: 'Direct Gogo Player' },
  { id: 'screenscape', name: 'ScreenScape', quality: '4K', tag: 'TMDB • Hindi Dub' },
];

export const TRUSTED_ANIME_ORIGINS = new Set([
  ...TRUSTED_PLAYER_ORIGINS,
  'https://player.videasy.to',
  'https://videasy.to',
  'https://vidlink.pro',
  'https://megaplay.buzz',
  'https://rozgarlelo.modiplay.xyz',
  'https://gogoanime.me.uk',
  'https://screenscape.me',
  'https://zokoanime.video',
  'https://vidstuck.xyz',
  'https://nxsha.space',
]);

export interface BuildAnimeEmbedUrlOptions {
  server: AnimeServerId;
  episodeNumber: number;
  language: 'sub' | 'dub';
  malId?: string | null;
  anilistId?: string | null;
  tmdbId?: string | null;
  isAnimeMovie?: boolean;
}

export function buildAnimeEmbedUrl({
  server,
  episodeNumber,
  language,
  malId,
  anilistId,
  tmdbId,
  isAnimeMovie = false,
}: BuildAnimeEmbedUrlOptions): string {
  const effectiveMalId = malId && malId !== '0' ? String(malId) : '';
  const targetAnilist = anilistId ? String(anilistId) : '';
  const epNum = episodeNumber;
  const lang = language;

  switch (server) {
    case 'zokoanime': {
      const source = effectiveMalId ? 'mal' : 'anilist';
      const targetId = effectiveMalId || targetAnilist;
      const track = lang === 'dub' ? 'dub' : 'sub';
      return `https://zokoanime.video/stream/${source}/${targetId}/${epNum}/${track}?color=e8852a&autoplay=1&asi=1&autonext=1`;
    }
    case 'megaplay': {
      if (effectiveMalId) {
        return `https://megaplay.buzz/stream/mal/${effectiveMalId}/${epNum}/${lang}`;
      }
      if (targetAnilist) {
        return `https://megaplay.buzz/stream/anilist/${targetAnilist}/${epNum}/${lang}`;
      }
      return `https://vidlink.pro/anime/${targetAnilist}/${epNum}/${lang}`;
    }
    case 'videasy': {
      if (isAnimeMovie) {
        return `https://player.videasy.to/anime/${targetAnilist}?color=e8852a&nextEpisode=false&episodeSelector=false`;
      }
      return `https://player.videasy.to/anime/${targetAnilist}/${epNum}?color=e8852a&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true`;
    }
    case 'vidlink': {
      const streamId = effectiveMalId || targetAnilist;
      return `https://vidlink.pro/anime/${streamId}/${epNum}/${lang}`;
    }
    case 'vidstuck': {
      const streamId = effectiveMalId || targetAnilist;
      return `https://vidstuck.xyz/embed/anime/${streamId}/${epNum}?color=e8852a&branding=CINEVAULT&nextEpisode=true&episodeSelector=true&autoplayNextEpisode=true&overlay=true`;
    }
    case 'gogoanime': {
      if (effectiveMalId) {
        return `https://gogoanime.me.uk/newplayer.php?mal_id=${effectiveMalId}&ep=${epNum}&category=${lang}`;
      }
      return `https://vidlink.pro/anime/${targetAnilist}/${epNum}/${lang}`;
    }
    case 'screenmirror': {
      if (tmdbId) {
        return `https://rozgarlelo.modiplay.xyz/embed/tmdb/tv?id=${tmdbId}&s=1&e=${epNum}`;
      }
      return `https://vidlink.pro/anime/${targetAnilist}/${epNum}/${lang}`;
    }
    case 'screenscape': {
      if (tmdbId) {
        return `https://screenscape.me/embed?tmdb=${tmdbId}&type=tv&s=1&e=${epNum}&lan=hindi`;
      }
      return `https://vidlink.pro/anime/${targetAnilist}/${epNum}/${lang}`;
    }
    default:
      return `https://player.videasy.to/anime/${targetAnilist}/${epNum}?color=e8852a`;
  }
}
