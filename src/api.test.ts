import { describe, it, expect } from 'vitest';
import { api, anilistApi, findMatchingSeason, TmdbItem } from './api';

describe('api.mapToInternalMovie', () => {
  it('maps a full TMDB payload correctly', () => {
    const tmdbItem: TmdbItem = {
      id: 123,
      title: 'Test Movie',
      media_type: 'movie',
      release_date: '2023-01-01',
      runtime: 120,
      vote_average: 8.5,
      poster_path: '/poster.jpg',
      backdrop_path: '/backdrop.jpg',
      videos: {
        results: [{ id: 'v1', key: 'trailer123', name: 'Trailer', site: 'YouTube', type: 'Trailer', official: true }]
      }
    };
    const result = api.mapToInternalMovie(tmdbItem);
    expect(result.id).toBe('123');
    expect(result.title).toBe('Test Movie');
    expect(result.type).toBe('movie');
    expect(result.year).toBe(2023);
    expect(result.duration).toBe('2h');
    expect(result.rating).toBe(8.5);
    expect(result.posterUrl).toContain('/poster.jpg');
    expect(result.backdropUrl).toContain('/backdrop.jpg');
    expect(result.trailerKey).toBe('trailer123');
  });

  it('returns null for rating when vote_average is 0', () => {
    const tmdbItem: TmdbItem = { id: 123, vote_average: 0 };
    const result = api.mapToInternalMovie(tmdbItem);
    expect(result.rating).toBeNull();
  });

  it('returns null for duration when runtime is undefined', () => {
    const tmdbItem: TmdbItem = { id: 123, runtime: undefined };
    const result = api.mapToInternalMovie(tmdbItem);
    expect(result.duration).toBeNull();
  });

  it('handles missing backdrop/poster gracefully', () => {
    const tmdbItem: TmdbItem = { id: 123, poster_path: null, backdrop_path: null };
    const result = api.mapToInternalMovie(tmdbItem);
    expect(result.posterUrl).toBeNull();
    expect(result.backdropUrl).toBeNull();
  });

  it('extracts trailer key correctly', () => {
    const tmdbItem: TmdbItem = {
      id: 123,
      videos: {
        results: [
          { id: 'v1', key: 't1', name: 'Teaser', site: 'YouTube', type: 'Teaser' },
          { id: 'v2', key: 'trailerKey', name: 'Trailer', site: 'YouTube', type: 'Trailer', official: true }
        ]
      }
    };
    const result = api.mapToInternalMovie(tmdbItem);
    expect(result.trailerKey).toBe('trailerKey');
  });

  it('does NOT fabricate data for missing fields', () => {
    const tmdbItem: TmdbItem = { id: 123 };
    const result = api.mapToInternalMovie(tmdbItem);
    
    // Check fields that used to be fabricated
    expect(result.rating).toBeNull();
    expect(result.duration).toBeNull();
    expect(result.ageRating).toBeNull();
    expect(result.genres).toEqual([]);
    expect(result.servers).toEqual([]);
  });
});

describe('anilistApi.mapAniListToInternal', () => {
  it('maps an AniList media item correctly into an internal Movie', () => {
    const aniListMedia = {
      id: 269,
      idMal: 269,
      title: {
        english: 'Bleach',
        romaji: 'Bleach',
        native: 'BLEACH',
      },
      description: '<p>Ichigo Kurosaki is a teenager with the ability to see ghosts.</p>',
      startDate: {
        year: 2004,
      },
      averageScore: 83,
      popularity: 300000,
      status: 'FINISHED',
      episodes: 366,
      duration: 24,
      genres: ['Action', 'Adventure', 'Supernatural'],
      coverImage: {
        large: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx269.jpg',
        extraLarge: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx269.jpg',
      },
      bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/269.jpg',
    };

    const result = anilistApi.mapAniListToInternal(aniListMedia as any);

    expect(result.id).toBe('269');
    expect(result.malId).toBe('269');
    expect(result.anilistId).toBe('269');
    expect(result.title).toBe('Bleach');
    expect(result.type).toBe('anime');
    expect(result.year).toBe(2004);
    expect(result.rating).toBe(8.3);
    expect(result.duration).toBe('366 episodes');
    expect(result.episodeCount).toBe(366);
    expect(result.status).toBe('finished');
    expect(result.description).toBe('Ichigo Kurosaki is a teenager with the ability to see ghosts.');
    expect(result.posterUrl).toBe('https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx269.jpg');
    expect(result.backdropUrl).toBe('https://s4.anilist.co/file/anilistcdn/media/anime/banner/269.jpg');
    expect(result.genres).toEqual(['Action', 'Adventure', 'Supernatural']);
  });

  it('handles missing or partial fields without fabricating values', () => {
    const minimalMedia = {
      id: 999,
      title: {
        romaji: 'Minimal Anime',
      },
    };

    const result = anilistApi.mapAniListToInternal(minimalMedia as any);

    expect(result.id).toBe('999');
    expect(result.title).toBe('Minimal Anime');
    expect(result.rating).toBeNull();
    expect(result.duration).toBeNull();
    expect(result.posterUrl).toBeNull();
    expect(result.backdropUrl).toBeNull();
    expect(result.malId).toBe('');
    expect(result.anilistId).toBe('999');
  });

  it('correctly maps episode count for ongoing anime using nextAiringEpisode', () => {
    const ongoingMedia = {
      id: 500,
      title: { english: 'Ongoing Adventure' },
      status: 'RELEASING',
      episodes: null,
      nextAiringEpisode: {
        episode: 120,
        airingAt: 1700000000,
      },
    };

    const result = anilistApi.mapAniListToInternal(ongoingMedia as any);

    expect(result.episodeCount).toBe(119);
    expect(result.duration).toBe('119 episodes');
    expect(result.status).toBe('releasing');
  });

  it('guarantees One Piece has full episode count (>= 1180) for long-running dropdown', () => {
    const onePieceMedia = {
      id: 21,
      title: {
        romaji: 'ONE PIECE',
        english: 'ONE PIECE',
      },
      status: 'RELEASING',
      episodes: null,
      nextAiringEpisode: {
        episode: 1177,
      },
    };

    const result = anilistApi.mapAniListToInternal(onePieceMedia as any);

    expect(result.episodeCount).toBeGreaterThanOrEqual(1180);
    expect(result.duration).toContain('episodes');
  });
});

describe('findMatchingSeason', () => {
  const mockBleachSeasons = [
    { season_number: 1, name: 'Season 1: Substitute', episode_count: 20 },
    { season_number: 2, name: 'Season 2: Entry', episode_count: 21 },
    { season_number: 16, name: 'Season 16: The Lost Agent', episode_count: 24 },
    { season_number: 17, name: 'Thousand-Year Blood War', episode_count: 13, air_date: '2022-10-11' },
    { season_number: 18, name: 'The Separation', episode_count: 13, air_date: '2023-07-08' },
    { season_number: 19, name: 'The Conflict', episode_count: 14, air_date: '2024-10-05' },
  ];

  it('matches Bleach Thousand-Year Blood War by subtitle', () => {
    const matched = findMatchingSeason(
      mockBleachSeasons,
      ['BLEACH: Thousand-Year Blood War', 'BLEACH: Sennen Kessen-hen'],
      2022,
      13
    );
    expect(matched).not.toBeNull();
    expect(matched?.season_number).toBe(17);
    expect(matched?.name).toBe('Thousand-Year Blood War');
  });

  it('matches Bleach The Separation by subtitle', () => {
    const matched = findMatchingSeason(
      mockBleachSeasons,
      ['BLEACH: Thousand-Year Blood War - The Separation'],
      2023,
      13
    );
    expect(matched).not.toBeNull();
    expect(matched?.season_number).toBe(18);
  });

  const mockDemonSlayerSeasons = [
    { season_number: 1, name: 'Tanjiro Kamado, Unwavering Resolve Arc', episode_count: 26 },
    { season_number: 2, name: 'Mugen Train Arc', episode_count: 7 },
    { season_number: 3, name: 'Entertainment District Arc', episode_count: 11 },
    { season_number: 4, name: 'Swordsmith Village Arc', episode_count: 11 },
    { season_number: 5, name: 'Hashira Training Arc', episode_count: 8, air_date: '2024-05-12' },
  ];

  it('matches Demon Slayer Hashira Training Arc by arc name', () => {
    const matched = findMatchingSeason(
      mockDemonSlayerSeasons,
      ['Kimetsu no Yaiba: Hashira Geiko-hen', 'Demon Slayer: Kimetsu no Yaiba Hashira Training Arc'],
      2024,
      8
    );
    expect(matched).not.toBeNull();
    expect(matched?.season_number).toBe(5);
  });

  it('returns null when no seasons match an unrelated anime title', () => {
    const matched = findMatchingSeason(
      mockBleachSeasons,
      ['Chainsaw Man'],
      2022,
      12
    );
    expect(matched).toBeNull();
  });
});
