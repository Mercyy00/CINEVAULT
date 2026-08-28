export interface UserAvatar {
  id: string;
  name: string;
  emoji: string;
  tag: string;
  color: string;
  bg: string;
  border: string;
}

export const USER_AVATARS: UserAvatar[] = [
  {
    id: 'gold-reel',
    name: 'The Cinephile',
    emoji: '🎬',
    tag: 'Classic Cinema',
    color: '#ffd066',
    bg: 'linear-gradient(135deg, #1f1a0d, #3d3110)',
    border: '#ffd066',
  },
  {
    id: 'vault-shadow-cat',
    name: 'Shadow Neko',
    emoji: '🐱',
    tag: 'Vault Mascot',
    color: '#e8852a',
    bg: 'linear-gradient(135deg, #241306, #45240c)',
    border: '#e8852a',
  },
  {
    id: 'cyber-hunter',
    name: 'Cyber Stalker',
    emoji: '🥷',
    tag: 'Neon Visor',
    color: '#00f5d4',
    bg: 'linear-gradient(135deg, #051d1a, #0a3a34)',
    border: '#00f5d4',
  },
  {
    id: 'anime-ronin',
    name: 'Anime Ronin',
    emoji: '🗡️',
    tag: 'Shonen Warrior',
    color: '#ff4d6d',
    bg: 'linear-gradient(135deg, #2b0b14, #4a1322)',
    border: '#ff4d6d',
  },
  {
    id: 'cosmic-traveler',
    name: 'Cosmic Voyager',
    emoji: '🚀',
    tag: 'Deep Space',
    color: '#9d4edd',
    bg: 'linear-gradient(135deg, #180a29, #2f1450)',
    border: '#9d4edd',
  },
  {
    id: 'noir-sleuth',
    name: 'Noir Detective',
    emoji: '🕵️',
    tag: 'Smoky Mystery',
    color: '#d1d5db',
    bg: 'linear-gradient(135deg, #111827, #1f2937)',
    border: '#9ca3af',
  },
  {
    id: 'night-stalker',
    name: 'Nightstalker',
    emoji: '🧛',
    tag: 'Gothic Cinema',
    color: '#e63946',
    bg: 'linear-gradient(135deg, #26090c, #400f14)',
    border: '#e63946',
  },
  {
    id: 'popcorn-fiend',
    name: 'Popcorn Fiend',
    emoji: '🍿',
    tag: 'Premiere VIP',
    color: '#ffbe0b',
    bg: 'linear-gradient(135deg, #2b1f00, #4d3700)',
    border: '#ffbe0b',
  },
  {
    id: 'retro-director',
    name: 'Film Director',
    emoji: '🎥',
    tag: 'Auteur Vision',
    color: '#38bdf8',
    bg: 'linear-gradient(135deg, #082f49, #0c4a6e)',
    border: '#38bdf8',
  },
  {
    id: 'vault-sovereign',
    name: 'Vault Sovereign',
    emoji: '👑',
    tag: 'Ultimate Crown',
    color: '#f59e0b',
    bg: 'linear-gradient(135deg, #2e1d05, #573708)',
    border: '#f59e0b',
  },
  {
    id: 'synth-racer',
    name: 'Synthwave Rider',
    emoji: '⚡',
    tag: '80s Electro',
    color: '#f72585',
    bg: 'linear-gradient(135deg, #2e051a, #52092e)',
    border: '#f72585',
  },
  {
    id: 'arcane-mage',
    name: 'Arcane Mage',
    emoji: '🔮',
    tag: 'High Fantasy',
    color: '#a855f7',
    bg: 'linear-gradient(135deg, #1f0b38, #3b1569)',
    border: '#a855f7',
  },
];

export function getAvatarById(id?: string): UserAvatar {
  return USER_AVATARS.find((a) => a.id === id) || USER_AVATARS[0];
}
