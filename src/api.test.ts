import { describe, it, expect } from 'vitest';
import { api, anilistApi, TmdbItem } from './api';

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
});
