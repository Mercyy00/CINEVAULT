import { describe, it, expect } from 'vitest';
import { continueWatchingKey } from '../sync';
import { ContinueWatchingItem } from '../../types';

describe('continueWatchingKey', () => {
  it('generates correct keys for movies, TV episodes, and anime', () => {
    const movieItem = { media_type: 'movie', id: '123' } as ContinueWatchingItem;
    expect(continueWatchingKey(movieItem)).toBe('movie_123');

    const tvItem = { media_type: 'tv', id: '456' } as ContinueWatchingItem;
    expect(continueWatchingKey(tvItem)).toBe('tv_456');

    const animeItem = { media_type: 'anime', id: '789' } as ContinueWatchingItem;
    expect(continueWatchingKey(animeItem)).toBe('anime_789');
  });

  it('same show produces the same key across different episodes so continue watching is deduplicated', () => {
    const s1e1 = { media_type: 'tv', id: '123', season_number: 1, episode_number: 1 } as ContinueWatchingItem;
    const s1e2 = { media_type: 'tv', id: '123', season_number: 1, episode_number: 2 } as ContinueWatchingItem;
    const anime1 = { media_type: 'anime', id: '789', episode_number: 320 } as ContinueWatchingItem;
    const anime2 = { media_type: 'anime', id: '789', episode_number: 321 } as ContinueWatchingItem;

    expect(continueWatchingKey(s1e1)).toBe(continueWatchingKey(s1e2));
    expect(continueWatchingKey(s1e1)).toBe('tv_123');
    expect(continueWatchingKey(anime1)).toBe(continueWatchingKey(anime2));
    expect(continueWatchingKey(anime1)).toBe('anime_789');
  });
});
