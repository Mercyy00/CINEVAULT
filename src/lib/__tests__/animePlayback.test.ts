import { describe, it, expect } from 'vitest';
import {
  buildAnimeEmbedUrl,
  ANIME_SERVERS,
  TRUSTED_ANIME_ORIGINS,
} from '../../components/AnimePlayer';

describe('animePlayback - ZokoAnime Server Integration', () => {
  it('makes Zoko the primary server (index 0)', () => {
    expect(ANIME_SERVERS[0].id).toBe('zokoanime');
    expect(ANIME_SERVERS[0].name).toContain('Primary');
  });

  it('includes https://zokoanime.video in trusted origins for postMessage security', () => {
    expect(TRUSTED_ANIME_ORIGINS.has('https://zokoanime.video')).toBe(true);
  });

  it('builds ZokoAnime embed URL with MAL ID when available', () => {
    const url = buildAnimeEmbedUrl({
      server: 'zokoanime',
      episodeNumber: 5,
      language: 'sub',
      malId: '52211',
      anilistId: '185874',
    });

    expect(url).toBe(
      'https://zokoanime.video/stream/mal/52211/5/sub?color=e8852a&autoplay=1&asi=1&autonext=1'
    );
  });

  it('builds ZokoAnime embed URL with AniList ID when MAL ID is missing or 0', () => {
    const urlWithoutMal = buildAnimeEmbedUrl({
      server: 'zokoanime',
      episodeNumber: 1,
      language: 'sub',
      malId: '',
      anilistId: '185874',
    });

    expect(urlWithoutMal).toBe(
      'https://zokoanime.video/stream/anilist/185874/1/sub?color=e8852a&autoplay=1&asi=1&autonext=1'
    );

    const urlWithZeroMal = buildAnimeEmbedUrl({
      server: 'zokoanime',
      episodeNumber: 1,
      language: 'sub',
      malId: '0',
      anilistId: '185874',
    });

    expect(urlWithZeroMal).toBe(
      'https://zokoanime.video/stream/anilist/185874/1/sub?color=e8852a&autoplay=1&asi=1&autonext=1'
    );
  });

  it('supports dub track for ZokoAnime', () => {
    const url = buildAnimeEmbedUrl({
      server: 'zokoanime',
      episodeNumber: 12,
      language: 'dub',
      malId: '21',
      anilistId: '21',
    });

    expect(url).toBe(
      'https://zokoanime.video/stream/mal/21/12/dub?color=e8852a&autoplay=1&asi=1&autonext=1'
    );
  });

  it('maintains compatibility with secondary anime servers', () => {
    const megaplayUrl = buildAnimeEmbedUrl({
      server: 'megaplay',
      episodeNumber: 3,
      language: 'sub',
      malId: '21',
      anilistId: '21',
    });
    expect(megaplayUrl).toBe('https://megaplay.buzz/stream/mal/21/3/sub');

    const videasyUrl = buildAnimeEmbedUrl({
      server: 'videasy',
      episodeNumber: 3,
      language: 'sub',
      anilistId: '21',
    });
    expect(videasyUrl).toContain('https://player.videasy.to/anime/21/3');

    const vidlinkUrl = buildAnimeEmbedUrl({
      server: 'vidlink',
      episodeNumber: 3,
      language: 'sub',
      malId: '21',
      anilistId: '21',
    });
    expect(vidlinkUrl).toBe('https://vidlink.pro/anime/21/3/sub');
  });
});
