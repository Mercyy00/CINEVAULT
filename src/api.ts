const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
const BASE_URL = 'https://api.themoviedb.org/3';

import { Movie } from './types';

export const api = {
  getImageUrl: (path: string | null, size = 'w500') => 
    path ? `https://image.tmdb.org/t/p/${size}${path}` : 'https://picsum.photos/400/600',

  getTrending: async (mediaType = 'all', timeWindow = 'day', page = 1) => {
    const res = await fetch(`${BASE_URL}/trending/${mediaType}/${timeWindow}?api_key=${TMDB_API_KEY}&page=${page}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  getPopular: async (mediaType = 'movie', page = 1) => {
    const res = await fetch(`${BASE_URL}/${mediaType}/popular?api_key=${TMDB_API_KEY}&page=${page}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  getTopRated: async (mediaType = 'movie', page = 1) => {
    const res = await fetch(`${BASE_URL}/${mediaType}/top_rated?api_key=${TMDB_API_KEY}&page=${page}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  discover: async (mediaType = 'movie', params: Record<string, string | number> = {}) => {
    const url = new URL(`${BASE_URL}/discover/${mediaType}`);
    url.searchParams.append('api_key', TMDB_API_KEY);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.append(k, v.toString());
    });
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  getWatchProviders: async (mediaType = 'movie', region = 'US') => {
    const res = await fetch(`${BASE_URL}/watch/providers/${mediaType}?api_key=${TMDB_API_KEY}&watch_region=${region}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  searchMulti: async (query: string) => {
    if (!query) return { results: [] };
    const res = await fetch(`${BASE_URL}/search/multi?query=${encodeURIComponent(query)}&api_key=${TMDB_API_KEY}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  getDetails: async (mediaType: string, id: string) => {
    const res = await fetch(`${BASE_URL}/${mediaType}/${id}?api_key=${TMDB_API_KEY}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  getCredits: async (mediaType: string, id: string) => {
    const res = await fetch(`${BASE_URL}/${mediaType}/${id}/credits?api_key=${TMDB_API_KEY}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  getSimilar: async (mediaType: string, id: string, page: number = 1) => {
    const res = await fetch(`${BASE_URL}/${mediaType}/${id}/similar?api_key=${TMDB_API_KEY}&page=${page}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  getAnimeCategory: async (params: Record<string, string | number> = {}) => {
    return api.discover('tv', {
      with_genres: '16',
      with_original_language: 'ja',
      ...params
    });
  },

  getSeasonDetails: async (tvId: string, seasonNumber: number) => {
    const res = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },
  
  getEpisodeDetails: async (tvId: string, seasonNumber: number, episodeNumber: number) => {
    const res = await fetch(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${TMDB_API_KEY}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  getGenres: async (mediaType: 'movie' | 'tv' = 'movie') => {
    const res = await fetch(`${BASE_URL}/genre/${mediaType}/list?api_key=${TMDB_API_KEY}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },
  
  // Maps TMDB result to our internal Movie type for smooth integration
  mapToInternalMovie: (tmdbItem: any): Movie => {
    return {
      id: tmdbItem.id.toString(),
      title: tmdbItem.title || tmdbItem.name || 'Unknown',
      type: tmdbItem.media_type === 'tv' || tmdbItem.first_air_date ? 'tv' : 'movie',
      tagline: tmdbItem.overview ? tmdbItem.overview.split(' ').slice(0, 15).join(' ') + '...' : '',
      description: tmdbItem.overview || 'No description available.',
      year: parseInt((tmdbItem.release_date || tmdbItem.first_air_date || '2024').substring(0, 4)) || 2024,
      duration: '2h 10m', // Placeholder
      rating: Math.round((tmdbItem.vote_average || 8) * 10) / 10,
      ageRating: 'PG-13',
      genres: tmdbItem.genres ? tmdbItem.genres.map((g: any) => g.name) : ['Action', 'Drama'],
      posterUrl: tmdbItem.poster_path ? api.getImageUrl(tmdbItem.poster_path) : '',
      backdropUrl: tmdbItem.backdrop_path ? api.getImageUrl(tmdbItem.backdrop_path, 'original') : '',
      servers: [
        { id: 's1', name: 'Server Alpha', quality: '4K', latency: 12, status: 'working' },
        { id: 's2', name: 'Server Beta', quality: 'HD', latency: 45, status: 'working' },
      ],
      cast: [],
      reviews: []
    };
  }
};
const ANIKOTO_BASE = 'https://anikotoapi.site';
export const anikotoApi = {
  getRecentAnime: async (page = 1, perPage = 20) => {
    const cacheKey = `anikoto_recent_${page}_${perPage}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 10 * 60 * 1000) return data;
    }
    const res = await fetch(`${ANIKOTO_BASE}/recent-anime?page=${page}&per_page=${perPage}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const data = await res.json();
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
  },
  getSeries: async (id: string) => {
    const cacheKey = `anikoto_series_${id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 30 * 60 * 1000) return data;
    }
    const res = await fetch(`${ANIKOTO_BASE}/series/${id}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const data = await res.json();
    localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
  },
  mapToInternalMovie: (animeItem: any): Movie => {
    const poster = animeItem.image || animeItem.poster || 'https://picsum.photos/400/600';
    return {
      id: animeItem.id?.toString() || Math.random().toString(),
      title: animeItem.title || animeItem.name || 'Unknown Anime',
      type: 'anime', // internal custom type indicator
      tagline: '',
      description: animeItem.synopsis || animeItem.description || 'No description available.',
      year: animeItem.year || 2024,
      duration: animeItem.episode_count ? `${animeItem.episode_count} Episodes` : (animeItem.episodes ? `${animeItem.episodes} Episodes` : 'Ongoing'),
      rating: animeItem.score ? parseFloat(animeItem.score) : 0,
      ageRating: animeItem.rating || 'PG-13',
      genres: animeItem.terms_by_type?.genre || animeItem.genres || [],
      posterUrl: poster,
      backdropUrl: animeItem.background_image || poster,
      servers: [],
      cast: [],
      reviews: []
    };
  }
};


const KITSU_BASE = 'https://kitsu.io/api/edge';
const KITSU_HEADERS = {
  'Accept': 'application/vnd.api+json',
  'Content-Type': 'application/vnd.api+json'
};

export const kitsuApi = {
  getTrending: async (page = 1) => {
    const res = await fetch(`${KITSU_BASE}/anime?sort=popularityRank&page[limit]=20&page[offset]=${(page - 1) * 20}&include=categories,mappings`, { headers: KITSU_HEADERS });
    if (!res.ok) throw new Error(`Kitsu API Error: ${res.status}`);
    return res.json();
  },
  getByCategory: async (slug: string, page = 1) => {
    const res = await fetch(`${KITSU_BASE}/anime?filter[categories]=${slug}&sort=-averageRating&page[limit]=20&page[offset]=${(page - 1) * 20}&include=categories,mappings`, { headers: KITSU_HEADERS });
    if (!res.ok) throw new Error(`Kitsu API Error: ${res.status}`);
    return res.json();
  },
  search: async (query: string) => {
    const res = await fetch(`${KITSU_BASE}/anime?filter[text]=${encodeURIComponent(query)}&page[limit]=10&include=categories,mappings`, { headers: KITSU_HEADERS });
    if (!res.ok) throw new Error(`Kitsu API Error: ${res.status}`);
    return res.json();
  },
  getDetails: async (id: string) => {
    const res = await fetch(`${KITSU_BASE}/anime/${id}?include=categories,mappings,episodes`, { headers: KITSU_HEADERS });
    if (!res.ok) throw new Error(`Kitsu API Error: ${res.status}`);
    return res.json();
  },
  getCharacters: async (id: string) => {
    try {
      const res = await fetch(`${KITSU_BASE}/anime-characters?filter[animeId]=${id}&include=character&page[limit]=12`, { headers: KITSU_HEADERS });
      if (!res.ok) return { data: [], included: [] };
      return res.json();
    } catch {
      return { data: [], included: [] };
    }
  },
  mapKitsuToInternal: (item: any, included: any[] = []): Movie => {
    let genres: string[] = [];
    let malId = '';
    
    if (item.relationships?.categories?.data && included.length > 0) {
      const categoryIds = item.relationships.categories.data.map((c: any) => c.id);
      const categoryObjs = included.filter((i: any) => i.type === 'categories' && categoryIds.includes(i.id));
      genres = categoryObjs.map((c: any) => c.attributes?.title).filter(Boolean);
    }

    if (item.relationships?.mappings?.data && included.length > 0) {
      const mappingIds = item.relationships.mappings.data.map((m: any) => m.id);
      const mappingObjs = included.filter((i: any) => i.type === 'mappings' && mappingIds.includes(i.id));
      const malMapping = mappingObjs.find((m: any) => m.attributes?.externalSite === 'myanimelist/anime' || m.attributes?.externalSite === 'my-anime-list/anime');
      if (malMapping && malMapping.attributes?.externalId) {
        malId = malMapping.attributes.externalId;
      }
    }

    const titles = item.attributes?.titles || {};
    const japaneseTitle = titles.en_jp || titles.ja_jp || item.attributes?.abbreviatedTitles?.[0] || '';

    return {
      id: item.id.toString(),
      title: item.attributes?.canonicalTitle || titles.en || 'Unknown Anime',
      type: 'anime',
      tagline: japaneseTitle ? `${japaneseTitle}` : '',
      description: item.attributes?.synopsis || 'No description available.',
      year: parseInt(item.attributes?.startDate?.substring(0, 4) || '2024') || 2024,
      duration: item.attributes?.episodeCount ? `${item.attributes.episodeCount} Episodes` : 'Ongoing',
      rating: parseFloat(((parseFloat(item.attributes?.averageRating || '80') / 10)).toFixed(1)) || 0,
      ageRating: item.attributes?.ageRating || 'PG-13',
      genres: genres.length > 0 ? genres : ['Anime'],
      posterUrl: item.attributes?.posterImage?.large || 'https://picsum.photos/400/600',
      backdropUrl: item.attributes?.coverImage?.large || item.attributes?.posterImage?.large || 'https://picsum.photos/1200/600',
      servers: [],
      cast: [],
      reviews: [],
      episodeCount: item.attributes?.episodeCount || 0,
      status: item.attributes?.status || "finished",
      episodes: (item.attributes?.episodeCount || 0) <= 100 ? Array.from({ length: item.attributes?.episodeCount || 0 }, (_, i) => ({
        id: `ep-${i + 1}`,
        season: 1,
        episode: i + 1,
        title: `Episode ${i + 1}`,
        duration: '24m',
        thumbnail: 'https://picsum.photos/300/150',
        description: `Episode ${i + 1} of ${item.attributes?.canonicalTitle}`
      })) : [],
      malId: malId
    };
  },
  searchAnikotoByTitleFallback: async (title: string) => {
    try {
      const res = await fetch(`https://anikotoapi.site/api/anime/search?keyword=${encodeURIComponent(title)}`);
      if (res.ok) {
         const data = await res.json();
         if (data && data.results && data.results.length > 0) {
           return data.results[0].id;
         }
      }
    } catch (e) {
      console.error("Anikoto fallback failed", e);
    }
    return null;
  }
};
