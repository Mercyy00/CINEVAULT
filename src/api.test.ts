import { describe, it, expect } from 'vitest';
import { api, kitsuApi, TmdbItem } from './api';

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

describe('kitsuApi.mapKitsuToInternal', () => {
  it('extracts malId and anilistId correctly from mappings', () => {
    const kitsuResource = {
      id: '244',
      type: 'anime',
      attributes: {
        canonicalTitle: 'Bleach',
        averageRating: '82.5',
        episodeCount: 366,
      },
      relationships: {
        mappings: {
          data: [
            { id: 'm1', type: 'mappings' },
            { id: 'm2', type: 'mappings' },
          ],
        },
      },
    };

    const included = [
      {
        id: 'm1',
        type: 'mappings',
        attributes: {
          externalSite: 'myanimelist/anime',
          externalId: '269',
        },
      },
      {
        id: 'm2',
        type: 'mappings',
        attributes: {
          externalSite: 'anilist/anime',
          externalId: '269',
        },
      },
    ];

    const result = kitsuApi.mapKitsuToInternal(kitsuResource as any, included as any);

    expect(result.malId).toBe('269');
    expect(result.anilistId).toBe('269');
    expect(result.title).toBe('Bleach');
  });
});
