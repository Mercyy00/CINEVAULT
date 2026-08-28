export interface DiceBearStyle {
  id: string;
  name: string;
  category: string;
  desc: string;
  badge: string;
}

export interface UserAvatar {
  id: string;
  name: string;
  style: string;
  seed: string;
  tag: string;
  color: string;
  url: string;
}

export const DICEBEAR_STYLES: DiceBearStyle[] = [
  { id: 'constellation', name: 'Constellation', category: 'Cosmic', desc: 'Geometric star alignments & space maps', badge: 'Cosmic' },
  { id: 'lorelei', name: 'Lorelei', category: 'Anime', desc: 'Japanese anime & illustrated personas', badge: 'Anime' },
  { id: 'bottts', name: 'Bottts', category: 'Cyber', desc: 'Robotic cyber-units & mecha androids', badge: 'Cyber' },
  { id: 'adventurer', name: 'Adventurer', category: 'Fantasy', desc: 'RPG heroes, knights & rogues', badge: 'Fantasy' },
  { id: 'pixel-art', name: 'Pixel Art', category: 'Arcade', desc: 'Retro 8-bit / 16-bit arcade avatars', badge: 'Retro' },
  { id: 'avataaars', name: 'Avataaars', category: 'Expressive', desc: 'Stylized modern expressive characters', badge: 'Popular' },
  { id: 'micah', name: 'Micah', category: 'Minimal', desc: 'Minimalist editorial vector portraits', badge: 'Modern' },
  { id: 'notionists', name: 'Notionists', category: 'Sketch', desc: 'Monochrome editorial hand-drawn sketch', badge: 'Editorial' },
  { id: 'rings', name: 'Rings', category: 'Abstract', desc: 'Cosmic glowing orbital rings', badge: 'Aura' },
  { id: 'shapes', name: 'Shapes', category: 'Bauhaus', desc: 'Abstract modernist geometric art', badge: 'Abstract' },
  { id: 'big-smile', name: 'Big Smile', category: 'Fun', desc: 'Vibrant cheerful cartoon characters', badge: 'Vibrant' },
  { id: 'thumbs', name: 'Thumbs', category: 'Minimal', desc: 'Playful minimalist thumb faces', badge: 'Playful' },
];

export function getDiceBearUrl(style: string, seed: string): string {
  const safeSeed = encodeURIComponent(seed || 'Cinephile');
  const safeStyle = style || 'constellation';
  return `https://api.dicebear.com/10.x/${safeStyle}/svg?seed=${safeSeed}`;
}

export const PRESET_AVATARS: UserAvatar[] = [
  {
    id: 'constellation-orion',
    name: 'Orion Nebula',
    style: 'constellation',
    seed: 'OrionVault',
    tag: 'Cosmic Star',
    color: '#ffd066',
    url: getDiceBearUrl('constellation', 'OrionVault'),
  },
  {
    id: 'constellation-cassiopeia',
    name: 'Cassiopeia',
    style: 'constellation',
    seed: 'CassiopeiaVault',
    tag: 'Deep Galaxy',
    color: '#38bdf8',
    url: getDiceBearUrl('constellation', 'CassiopeiaVault'),
  },
  {
    id: 'lorelei-ronin',
    name: 'Anime Ronin',
    style: 'lorelei',
    seed: 'AnimeRonin',
    tag: 'Shonen Legend',
    color: '#ff4d6d',
    url: getDiceBearUrl('lorelei', 'AnimeRonin'),
  },
  {
    id: 'lorelei-star',
    name: 'Cyber Valkyrie',
    style: 'lorelei',
    seed: 'CyberValkyrie',
    tag: 'Sci-Fi Heroine',
    color: '#a855f7',
    url: getDiceBearUrl('lorelei', 'CyberValkyrie'),
  },
  {
    id: 'bottts-cyber-titan',
    name: 'Cyber Titan',
    style: 'bottts',
    seed: 'CyberTitan',
    tag: 'Mecha Unit',
    color: '#00f5d4',
    url: getDiceBearUrl('bottts', 'CyberTitan'),
  },
  {
    id: 'bottts-matrix-bot',
    name: 'Matrix Sentinel',
    style: 'bottts',
    seed: 'MatrixSentinel',
    tag: 'AI Core',
    color: '#d3f00a',
    url: getDiceBearUrl('bottts', 'MatrixSentinel'),
  },
  {
    id: 'adventurer-paladin',
    name: 'Gold Paladin',
    style: 'adventurer',
    seed: 'GoldPaladin',
    tag: 'Fantasy Knight',
    color: '#f59e0b',
    url: getDiceBearUrl('adventurer', 'GoldPaladin'),
  },
  {
    id: 'adventurer-rogue',
    name: 'Shadow Rogue',
    style: 'adventurer',
    seed: 'ShadowRogue',
    tag: 'Night Hunter',
    color: '#e63946',
    url: getDiceBearUrl('adventurer', 'ShadowRogue'),
  },
  {
    id: 'pixel-arcade-hero',
    name: 'Arcade Master',
    style: 'pixel-art',
    seed: 'ArcadeMaster',
    tag: '8-Bit Legend',
    color: '#ffbe0b',
    url: getDiceBearUrl('pixel-art', 'ArcadeMaster'),
  },
  {
    id: 'pixel-cyber-ninja',
    name: 'Pixel Ninja',
    style: 'pixel-art',
    seed: 'PixelNinja',
    tag: 'Retro Stealth',
    color: '#f72585',
    url: getDiceBearUrl('pixel-art', 'PixelNinja'),
  },
  {
    id: 'avataaars-cinephile',
    name: 'The Director',
    style: 'avataaars',
    seed: 'TheDirector',
    tag: 'Film Connoisseur',
    color: '#3b82f6',
    url: getDiceBearUrl('avataaars', 'TheDirector'),
  },
  {
    id: 'micah-auteur',
    name: 'Auteur Vision',
    style: 'micah',
    seed: 'AuteurVision',
    tag: 'Art Cinema',
    color: '#10b981',
    url: getDiceBearUrl('micah', 'AuteurVision'),
  },
  {
    id: 'notionists-critic',
    name: 'Noir Critic',
    style: 'notionists',
    seed: 'NoirCritic',
    tag: 'Monochrome Noir',
    color: '#9ca3af',
    url: getDiceBearUrl('notionists', 'NoirCritic'),
  },
  {
    id: 'rings-singularity',
    name: 'Singularity Ring',
    style: 'rings',
    seed: 'SingularityRing',
    tag: 'Energy Portal',
    color: '#8b5cf6',
    url: getDiceBearUrl('rings', 'SingularityRing'),
  },
  {
    id: 'shapes-vault-art',
    name: 'Modernist Grid',
    style: 'shapes',
    seed: 'ModernistGrid',
    tag: 'Geometric Art',
    color: '#e8852a',
    url: getDiceBearUrl('shapes', 'ModernistGrid'),
  },
  {
    id: 'big-smile-popcorn',
    name: 'Popcorn Fiend',
    style: 'big-smile',
    seed: 'PopcornFiend',
    tag: 'Premiere VIP',
    color: '#f97316',
    url: getDiceBearUrl('big-smile', 'PopcornFiend'),
  },
];

export function getUserAvatarUrl(avatarIdOrUrl?: string, fallbackSeed: string = 'Cinephile'): string {
  if (!avatarIdOrUrl) {
    return getDiceBearUrl('constellation', fallbackSeed);
  }
  if (avatarIdOrUrl.startsWith('http://') || avatarIdOrUrl.startsWith('https://')) {
    return avatarIdOrUrl;
  }
  const matched = PRESET_AVATARS.find((a) => a.id === avatarIdOrUrl);
  if (matched) {
    return matched.url;
  }
  if (avatarIdOrUrl.includes(':')) {
    const [style, seed] = avatarIdOrUrl.split(':');
    return getDiceBearUrl(style, seed || fallbackSeed);
  }
  return getDiceBearUrl('constellation', avatarIdOrUrl || fallbackSeed);
}

export function getAvatarPreset(id?: string): UserAvatar {
  return PRESET_AVATARS.find((a) => a.id === id) || PRESET_AVATARS[0];
}
