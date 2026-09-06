import { describe, it, expect } from 'vitest';
import { detailRoute, watchRoute } from '../navigation';

describe('navigation routes', () => {
  it('detailRoute generates correct paths', () => {
    expect(detailRoute('123', 'movie')).toBe('/movie/123');
    expect(detailRoute('123', 'tv')).toBe('/tv/123');
    expect(detailRoute('456', 'anime')).toBe('/ani/456');
  });

  it('watchRoute generates correct paths', () => {
    expect(watchRoute('123', 'movie')).toBe('/watch/movie/123');
    expect(watchRoute('123', 'tv', 2, 5)).toBe('/watch/tv/123/2/5');
  });
});
