import {
  BoringAvatarVariant,
  BORING_PALETTES,
  DEFAULT_PALETTE,
  THEME_BEAM_COLORS,
  getBoringAvatarDataUri,
  getBoringAvatarSvg,
} from './boringAvatars';

export type { BoringAvatarVariant };
export { BORING_PALETTES, DEFAULT_PALETTE, THEME_BEAM_COLORS, getBoringAvatarDataUri, getBoringAvatarSvg };

export interface AvatarStyle {
  id: BoringAvatarVariant;
  name: string;
  category: string;
  desc: string;
  badge: string;
}

export interface UserAvatar {
  id: string;
  name: string;
  style: BoringAvatarVariant;
  seed: string;
  tag: string;
  color: string;
  url: string;
  paletteId?: string;
}

/**
 * 6 Official Boring Avatar Variants
 */
export const BORING_AVATAR_VARIANTS: AvatarStyle[] = [
  {
    id: 'beam',
    name: 'Beam (Official Theme)',
    category: 'Expressive',
    desc: 'Signature CineVault Beam avatars with expressive character faces',
    badge: 'Signature',
  },
  {
    id: 'marble',
    name: 'Marble (Fluid)',
    category: 'Abstract',
    desc: 'Fluid organic liquid art & blending paths',
    badge: 'Artistic',
  },
  {
    id: 'sunset',
    name: 'Sunset (Dusk)',
    category: 'Atmospheric',
    desc: 'Cinematic dusk horizon & warm gradient dusk',
    badge: 'Cinema',
  },
  {
    id: 'bauhaus',
    name: 'Bauhaus (Modern)',
    category: 'Geometric',
    desc: 'Modernist constructivist geometric shapes',
    badge: 'Minimal',
  },
  {
    id: 'pixel',
    name: 'Pixel (Arcade)',
    category: 'Retro',
    desc: 'Retro 8-bit arcade matrix with symmetric blocks',
    badge: 'Retro',
  },
  {
    id: 'ring',
    name: 'Ring (Cosmic)',
    category: 'Cosmic',
    desc: 'Glowing concentric orbits & celestial portal rings',
    badge: 'Cosmic',
  },
];

/** Backward compatibility alias for legacy imports */
export const DICEBEAR_STYLES = BORING_AVATAR_VARIANTS;
export type DiceBearStyle = AvatarStyle;

/**
 * Generates Boring Avatar data-URI for a variant and seed, defaulting to the requested Beam theme.
 */
export function getBoringAvatarUrl(
  variant: BoringAvatarVariant = 'beam',
  seed: string = 'Cinephile',
  colors: string[] = THEME_BEAM_COLORS
): string {
  return getBoringAvatarDataUri(variant, seed, colors, 96);
}

/** Legacy alias pointing directly to the new Boring Avatar generator */
export function getDiceBearUrl(_styleOrVariant: string, seed: string): string {
  return getBoringAvatarUrl('beam', seed, THEME_BEAM_COLORS);
}

export const PALETTE_MAP: Record<string, string[]> = {
  'vault-beam-theme': BORING_PALETTES[0].colors,
  'vault-amber': BORING_PALETTES[1].colors,
  'cinema-neon': BORING_PALETTES[2].colors,
  'sunset-cinema': BORING_PALETTES[3].colors,
  'cosmic-noir': BORING_PALETTES[4].colors,
  'emerald-matrix': BORING_PALETTES[5].colors,
  'classic-boring': BORING_PALETTES[6].colors,
};

export const PRESET_AVATARS: UserAvatar[] = [
  {
    id: 'beam-director',
    name: 'The Director',
    style: 'beam',
    seed: 'Director',
    tag: 'Film Auteur',
    color: '#ff1168',
    paletteId: 'vault-beam-theme',
    url: getBoringAvatarUrl('beam', 'Director', THEME_BEAM_COLORS),
  },
  {
    id: 'marble-orion',
    name: 'Orion Star',
    style: 'beam',
    seed: 'OrionVault',
    tag: 'Cosmic Star',
    color: '#9e1e4c',
    paletteId: 'vault-beam-theme',
    url: getBoringAvatarUrl('beam', 'OrionVault', THEME_BEAM_COLORS),
  },
  {
    id: 'beam-ronin',
    name: 'Anime Ronin',
    style: 'beam',
    seed: 'AnimeRonin',
    tag: 'Shonen Hero',
    color: '#ff1168',
    paletteId: 'vault-beam-theme',
    url: getBoringAvatarUrl('beam', 'AnimeRonin', THEME_BEAM_COLORS),
  },
  {
    id: 'sunset-solaris',
    name: 'Solaris Auteur',
    style: 'beam',
    seed: 'SolarisDusk',
    tag: 'Atmospheric',
    color: '#9e1e4c',
    paletteId: 'vault-beam-theme',
    url: getBoringAvatarUrl('beam', 'SolarisDusk', THEME_BEAM_COLORS),
  },
  {
    id: 'bauhaus-auteur',
    name: 'Modernist Grid',
    style: 'beam',
    seed: 'BauhausGrid',
    tag: 'Geometric Art',
    color: '#8f8f8f',
    paletteId: 'vault-beam-theme',
    url: getBoringAvatarUrl('beam', 'BauhausGrid', THEME_BEAM_COLORS),
  },
  {
    id: 'pixel-ninja',
    name: 'Pixel Ninja',
    style: 'beam',
    seed: 'PixelNinja',
    tag: '8-Bit Arcade',
    color: '#ff1168',
    paletteId: 'vault-beam-theme',
    url: getBoringAvatarUrl('beam', 'PixelNinja', THEME_BEAM_COLORS),
  },
  {
    id: 'ring-singularity',
    name: 'Singularity',
    style: 'beam',
    seed: 'SingularityRing',
    tag: 'Energy Portal',
    color: '#9e1e4c',
    paletteId: 'vault-beam-theme',
    url: getBoringAvatarUrl('beam', 'SingularityRing', THEME_BEAM_COLORS),
  },
  {
    id: 'beam-valkyrie',
    name: 'Cyber Valkyrie',
    style: 'beam',
    seed: 'CyberValkyrie',
    tag: 'Sci-Fi Heroine',
    color: '#ff1168',
    paletteId: 'vault-beam-theme',
    url: getBoringAvatarUrl('beam', 'CyberValkyrie', THEME_BEAM_COLORS),
  },
  {
    id: 'beam-cinephile',
    name: 'Popcorn VIP',
    style: 'beam',
    seed: 'PopcornVIP',
    tag: 'Premiere VIP',
    color: '#9e1e4c',
    paletteId: 'vault-beam-theme',
    url: getBoringAvatarUrl('beam', 'PopcornVIP', THEME_BEAM_COLORS),
  },
  {
    id: 'beam-neo',
    name: 'Neo Cyber',
    style: 'beam',
    seed: 'NeoCyber',
    tag: 'Cyber Hacker',
    color: '#ececec',
    paletteId: 'vault-beam-theme',
    url: getBoringAvatarUrl('beam', 'NeoCyber', THEME_BEAM_COLORS),
  },
  {
    id: 'beam-akira',
    name: 'Neo Tokyo',
    style: 'beam',
    seed: 'AkiraTokyo',
    tag: 'Anime Icon',
    color: '#ff1168',
    paletteId: 'vault-beam-theme',
    url: getBoringAvatarUrl('beam', 'AkiraTokyo', THEME_BEAM_COLORS),
  },
  {
    id: 'marble-celestial',
    name: 'Cassiopeia',
    style: 'beam',
    seed: 'CassiopeiaVoid',
    tag: 'Deep Galaxy',
    color: '#9e1e4c',
    paletteId: 'vault-beam-theme',
    url: getBoringAvatarUrl('beam', 'CassiopeiaVoid', THEME_BEAM_COLORS),
  },
  {
    id: 'sunset-gold',
    name: 'Golden Hour',
    style: 'beam',
    seed: 'GoldenHour',
    tag: 'Warm Cinema',
    color: '#ececec',
    paletteId: 'vault-beam-theme',
    url: getBoringAvatarUrl('beam', 'GoldenHour', THEME_BEAM_COLORS),
  },
  {
    id: 'beam-shadow',
    name: 'Noir Detective',
    style: 'beam',
    seed: 'ShadowDetective',
    tag: 'Noir Mystery',
    color: '#25020f',
    paletteId: 'vault-beam-theme',
    url: getBoringAvatarUrl('beam', 'ShadowDetective', THEME_BEAM_COLORS),
  },
  {
    id: 'beam-critic',
    name: 'The Critic',
    style: 'beam',
    seed: 'FilmCritic',
    tag: 'Film Reviewer',
    color: '#8f8f8f',
    paletteId: 'vault-beam-theme',
    url: getBoringAvatarUrl('beam', 'FilmCritic', THEME_BEAM_COLORS),
  },
  {
    id: 'beam-producer',
    name: 'Studio Producer',
    style: 'beam',
    seed: 'StudioProducer',
    tag: 'Executive',
    color: '#9e1e4c',
    paletteId: 'vault-beam-theme',
    url: getBoringAvatarUrl('beam', 'StudioProducer', THEME_BEAM_COLORS),
  },
];

/** Legacy preset key translations so existing stored accounts map cleanly */
const LEGACY_PRESET_MAP: Record<string, string> = {
  'constellation-orion': 'beam-director',
  'constellation-cassiopeia': 'beam-valkyrie',
  'lorelei-ronin': 'beam-ronin',
  'lorelei-star': 'beam-valkyrie',
  'bottts-cyber-titan': 'beam-neo',
  'bottts-matrix-bot': 'beam-director',
  'adventurer-paladin': 'beam-director',
  'adventurer-rogue': 'beam-shadow',
  'pixel-arcade-hero': 'beam-akira',
  'pixel-cyber-ninja': 'beam-ronin',
  'avataaars-cinephile': 'beam-cinephile',
  'micah-auteur': 'beam-director',
  'notionists-critic': 'beam-critic',
  'rings-singularity': 'beam-valkyrie',
  'shapes-vault-art': 'beam-producer',
  'big-smile-popcorn': 'beam-cinephile',
  'big-smile': 'beam-cinephile',
  default: 'beam-director',
};

export function getUserAvatarUrl(avatarIdOrUrl?: string, fallbackSeed: string = 'Cinephile'): string {
  if (!avatarIdOrUrl) {
    return getBoringAvatarUrl('beam', fallbackSeed, THEME_BEAM_COLORS);
  }

  // If old DiceBear or old legacy amber palette data-URI, refresh to the requested Beam theme!
  if (
    avatarIdOrUrl.includes('dicebear.com') ||
    avatarIdOrUrl.includes('%23e8852a') ||
    avatarIdOrUrl.includes('%230f1016')
  ) {
    return getBoringAvatarUrl('beam', fallbackSeed, THEME_BEAM_COLORS);
  }

  // If data-URI is from an older session without any of the 5 theme colors, refresh to the requested Beam theme
  if (
    avatarIdOrUrl.startsWith('data:image/svg+xml') &&
    !THEME_BEAM_COLORS.some((c) => avatarIdOrUrl.includes(encodeURIComponent(c)))
  ) {
    return getBoringAvatarUrl('beam', fallbackSeed, THEME_BEAM_COLORS);
  }

  // Check legacy map
  const mappedId = LEGACY_PRESET_MAP[avatarIdOrUrl] || avatarIdOrUrl;

  // Match in PRESET_AVATARS
  const matched = PRESET_AVATARS.find((a) => a.id === mappedId);
  if (matched) {
    return matched.url;
  }

  // If already an HTTP/HTTPS or valid custom data URI containing theme colors, return directly
  if (
    avatarIdOrUrl.startsWith('http://') ||
    avatarIdOrUrl.startsWith('https://') ||
    avatarIdOrUrl.startsWith('data:image')
  ) {
    return avatarIdOrUrl;
  }

  // Dynamic format: variant:seed -> force beam with THEME_BEAM_COLORS
  if (avatarIdOrUrl.includes(':')) {
    const [, seed] = avatarIdOrUrl.split(':');
    return getBoringAvatarUrl('beam', seed || fallbackSeed, THEME_BEAM_COLORS);
  }

  // Default to beam with avatarIdOrUrl as seed using THEME_BEAM_COLORS
  return getBoringAvatarUrl('beam', avatarIdOrUrl || fallbackSeed, THEME_BEAM_COLORS);
}

export function getFallbackAvatarDataUri(name: string = 'Cinephile', _color: string = '#ff1168'): string {
  return getBoringAvatarDataUri('beam', name || 'Cinephile', THEME_BEAM_COLORS);
}

export function getAvatarPreset(id?: string): UserAvatar {
  const mappedId = id ? (LEGACY_PRESET_MAP[id] || id) : undefined;
  return PRESET_AVATARS.find((a) => a.id === mappedId) || PRESET_AVATARS[0];
}
