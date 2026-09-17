export interface AnimeGenreConfig {
  slug: string;
  label: string;
}

/**
 * Featured anime genres for sliding category rows in the Anime tab.
 * Slugs match AniList's genre taxonomy (mapped via toAniListGenre in api.ts).
 */
export const FEATURED_ANIME_GENRES: AnimeGenreConfig[] = [
  { slug: 'action', label: 'Action' },
  { slug: 'romance', label: 'Romance' },
  { slug: 'fantasy', label: 'Fantasy' },
  { slug: 'comedy', label: 'Comedy' },
  { slug: 'sci-fi', label: 'Sci-Fi' },
  { slug: 'slice-of-life', label: 'Slice of Life' },
  { slug: 'adventure', label: 'Adventure' },
  { slug: 'supernatural', label: 'Supernatural' },
  { slug: 'mystery', label: 'Mystery' },
  { slug: 'sports', label: 'Sports' },
];
