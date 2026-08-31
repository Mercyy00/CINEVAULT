/**
 * CineVault SEO & Dynamic Metadata Manager
 *
 * Handles:
 * - Dynamic document titles with consistent branding
 * - Dynamic meta descriptions
 * - Dynamic canonical links
 * - Open Graph & Twitter Cards
 * - Schema.org JSON-LD structured data (WebSite, Movie, TVSeries, Breadcrumbs, Organization)
 */

export interface SeoConfig {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'video.movie' | 'video.tv_show' | 'video.other';
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const DEFAULT_TITLE = 'CineVault — Discover films, TV and anime';
const DEFAULT_DESCRIPTION =
  'Browse films, television and anime, build a personalized watchlist, and pick up where you left off. Metadata powered by TMDB and Kitsu.';
const BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SITE_URL) || 'https://cinevault.app';
const DEFAULT_OG_IMAGE = `${BASE_URL}/logo-vault.png`;

function setMetaTag(attribute: 'name' | 'property', attrValue: string, content: string) {
  if (typeof document === 'undefined') return;
  let element = document.querySelector(`meta[${attribute}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonicalUrl(url: string) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function setStructuredData(data?: Record<string, unknown> | Array<Record<string, unknown>>) {
  if (typeof document === 'undefined') return;
  const scriptId = 'cinevault-structured-data';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (!data) {
    if (script) script.remove();
    return;
  }

  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data, null, 2);
}

export function updateSeoMetadata(config: SeoConfig = {}) {
  if (typeof document === 'undefined') return;

  const title = config.title ? `${config.title} — CineVault` : DEFAULT_TITLE;
  const description = config.description || DEFAULT_DESCRIPTION;
  const canonicalUrl = config.canonicalUrl
    ? (config.canonicalUrl.startsWith('http') ? config.canonicalUrl : `${BASE_URL}/${config.canonicalUrl.replace(/^\//, '')}`)
    : BASE_URL;
  const ogImage = config.ogImage || DEFAULT_OG_IMAGE;
  const ogType = config.ogType || 'website';

  // Title
  document.title = title;

  // Standard Meta
  setMetaTag('name', 'description', description);
  setCanonicalUrl(canonicalUrl);

  // Open Graph
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:url', canonicalUrl);
  setMetaTag('property', 'og:image', ogImage);
  setMetaTag('property', 'og:type', ogType);
  setMetaTag('property', 'og:site_name', 'CineVault');

  // Twitter
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', ogImage);

  // Structured Data
  if (config.structuredData) {
    setStructuredData(config.structuredData);
  }
}

/**
 * Route-specific default SEO configurations
 */
export const ROUTE_SEO: Record<string, SeoConfig> = {
  home: {
    title: 'Stream Movies, TV & Anime',
    description:
      'Discover trending movies, TV shows, and anime in high definition with CineVault. Sync your watchlist across devices.',
    ogType: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${BASE_URL}/#website`,
          url: BASE_URL,
          name: 'CineVault',
          description: 'Discover and stream films, TV series, and anime.',
          potentialAction: {
            '@type': 'SearchAction',
            target: `${BASE_URL}/#search/{search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        },
        {
          '@type': 'Organization',
          '@id': `${BASE_URL}/#organization`,
          name: 'CineVault',
          url: BASE_URL,
          logo: `${BASE_URL}/logo-vault.png`,
          description: 'A cinematic discovery and watchlist platform for film and anime enthusiasts.',
        },
      ],
    },
  },
  movies: {
    title: 'Movies',
    description:
      'Browse popular, top-rated, and newly released films across all genres with trailers, cast details, and ratings on CineVault.',
    ogType: 'website',
  },
  tvshows: {
    title: 'TV Shows',
    description:
      'Explore binge-worthy television series, full episode guides, seasons, and trending shows on CineVault.',
    ogType: 'website',
  },
  anime: {
    title: 'Anime',
    description:
      'Discover top seasonal anime, Japanese animations, trending series, and comprehensive episode guides on CineVault.',
    ogType: 'website',
  },
  mylist: {
    title: 'My Watchlist',
    description:
      'Your personal CineVault collection — save movies, shows, and anime to watch anytime, anywhere.',
    ogType: 'website',
  },
  profiles: {
    title: "Who's Watching?",
    description: 'Switch CineVault profile or customize avatar and viewing preferences.',
    ogType: 'website',
  },
  profile: {
    title: 'Account Settings',
    description: 'Manage your CineVault profile, custom theme, audio preferences, and saved lists.',
    ogType: 'website',
  },
  admin: {
    title: 'Watch Activity & Diagnostics',
    description: 'CineVault watch analytics and administrative settings.',
    ogType: 'website',
  },
};

/**
 * Generate Schema.org JSON-LD for a movie or TV show
 */
export function generateMediaStructuredData(item: {
  title: string;
  overview?: string | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  releaseDate?: string;
  rating?: number | null;
  voteCount?: number;
  genres?: string[];
  director?: string;
  actors?: string[];
  mediaType: 'movie' | 'tv' | 'anime';
}) {
  const isMovie = item.mediaType === 'movie';
  const type = isMovie ? 'Movie' : 'TVSeries';

  return {
    '@context': 'https://schema.org',
    '@type': type,
    name: item.title,
    description: item.overview || undefined,
    image: item.posterUrl || item.backdropUrl || `${BASE_URL}/logo-vault.png`,
    datePublished: item.releaseDate || undefined,
    genre: item.genres && item.genres.length > 0 ? item.genres : undefined,
    aggregateRating:
      item.rating && item.rating > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: item.rating.toFixed(1),
            bestRating: '10',
            worstRating: '1',
            ratingCount: item.voteCount || 100,
          }
        : undefined,
    actor:
      item.actors && item.actors.length > 0
        ? item.actors.slice(0, 5).map((actorName) => ({
            '@type': 'Person',
            name: actorName,
          }))
        : undefined,
    director: item.director
      ? {
          '@type': 'Person',
          name: item.director,
        }
      : undefined,
  };
}
