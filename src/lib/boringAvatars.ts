/**
 * Boring Avatars - Deterministic SVG Avatar Generator
 * Inspired by https://boringavatars.com/
 *
 * Implements 6 official variants:
 * 1. beam (expressive faces)
 * 2. marble (fluid organic gradients)
 * 3. sunset (atmospheric dusk horizon)
 * 4. bauhaus (geometric modernist art)
 * 5. pixel (retro 8-bit arcade matrix)
 * 6. ring (cosmic orbital rings)
 *
 * Zero external dependencies, 0ms latency, 100% offline.
 */

export type BoringAvatarVariant = 'beam' | 'marble' | 'sunset' | 'bauhaus' | 'pixel' | 'ring';

export interface BoringAvatarPalette {
  id: string;
  name: string;
  colors: string[];
}

export const THEME_BEAM_COLORS = ['#9e1e4c', '#ff1168', '#25020f', '#8f8f8f', '#ececec'];

export const BORING_PALETTES: BoringAvatarPalette[] = [
  {
    id: 'vault-beam-theme',
    name: 'CineVault Beam',
    colors: THEME_BEAM_COLORS,
  },
  {
    id: 'vault-amber',
    name: 'Vault Amber',
    colors: ['#0f1016', '#e8852a', '#ffbe0b', '#38bdf8', '#a855f7'],
  },
  {
    id: 'cinema-neon',
    name: 'Cyber Neon',
    colors: ['#090a0f', '#00f5d4', '#7b2cbf', '#f72585', '#4cc9f0'],
  },
  {
    id: 'sunset-cinema',
    name: 'Sunset Cinema',
    colors: ['#1e1b4b', '#f43f5e', '#fb7185', '#f59e0b', '#fbbf24'],
  },
  {
    id: 'cosmic-noir',
    name: 'Cosmic Noir',
    colors: ['#050508', '#6366f1', '#a855f7', '#ec4899', '#f43f5e'],
  },
  {
    id: 'emerald-matrix',
    name: 'Emerald Matrix',
    colors: ['#022c22', '#10b981', '#34d399', '#064e3b', '#6ee7b7'],
  },
  {
    id: 'classic-boring',
    name: 'Boring Classic',
    colors: ['#92a1cf', '#f0ab3d', '#c271b4', '#c20d90', '#92e1cf'],
  },
];

export const DEFAULT_PALETTE = THEME_BEAM_COLORS;

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getUnit(value: number, range: number, index = 0): number {
  const valueStr = String(value);
  const digit = parseInt(valueStr[index % valueStr.length] || '0', 10);
  return (digit / 9) * range;
}

function getRandomColor(number: number, colors: string[], range = 100): string {
  const index = Math.floor((number % range) / (range / colors.length));
  return colors[index % colors.length] || colors[0];
}

function getContrast(hexcolor: string): string {
  const clean = hexcolor.replace('#', '');
  const hex = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '#000000' : '#FFFFFF';
}

function getDigit(number: number, n: number): number {
  return Math.floor((number / Math.pow(10, n)) % 10);
}

function getBeamUnit(number: number, range: number, index = 0): number {
  const value = number % range;
  if (index && getDigit(number, index) % 2 === 0) {
    return -value;
  }
  return value;
}

/* -------------------------------------------------------------------------- */
/* 1. BEAM VARIANT (Official Boring Avatars Expressive Character Faces)      */
/* -------------------------------------------------------------------------- */
function generateBeam(name: string, colors: string[], size: number): string {
  const i = hashCode(name);
  const wrapperColor = getRandomColor(i, colors);
  const faceColor = getContrast(wrapperColor);
  const backgroundColor = getRandomColor(i + 13, colors);

  const n = getBeamUnit(i, 10, 1);
  const t = n < 5 ? n + 4 : n;
  const s = getBeamUnit(i, 10, 2);
  const y = s < 5 ? s + 4 : s;

  const wrapperTranslateX = t;
  const wrapperTranslateY = y;
  const wrapperRotate = getBeamUnit(i, 360);
  const wrapperScale = 1 + getBeamUnit(i, 3) / 10;
  const isMouthOpen = getDigit(i, 2) % 2 === 0;
  const isCircle = getDigit(i, 1) % 2 === 0;
  const eyeSpread = getBeamUnit(i, 5);
  const mouthSpread = getBeamUnit(i, 3);
  const faceRotate = getBeamUnit(i, 10, 3);
  const faceTranslateX = t > 6 ? t / 2 : getBeamUnit(i, 8, 1);
  const faceTranslateY = y > 6 ? y / 2 : getBeamUnit(i, 7, 2);

  return `
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <mask id="mask__beam_${i}" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
        <rect width="36" height="36" rx="72" fill="#FFFFFF"/>
      </mask>
      <g mask="url(#mask__beam_${i})">
        <rect width="36" height="36" fill="${backgroundColor}"/>
        <rect
          x="0"
          y="0"
          width="36"
          height="36"
          transform="translate(${wrapperTranslateX} ${wrapperTranslateY}) rotate(${wrapperRotate} 18 18) scale(${wrapperScale})"
          fill="${wrapperColor}"
          rx="${isCircle ? 36 : 6}"
        />
        <g transform="translate(${faceTranslateX} ${faceTranslateY}) rotate(${faceRotate} 18 18)">
          ${isMouthOpen
            ? `<path d="M15 ${19 + mouthSpread}c2 1 4 1 6 0" stroke="${faceColor}" fill="none" stroke-linecap="round" stroke-width="1"/>`
            : `<path d="M13,${19 + mouthSpread} a1,0.75 0 0,0 10,0" fill="${faceColor}"/>`
          }
          <rect x="${14 - eyeSpread}" y="14" width="1.5" height="2" rx="1" stroke="none" fill="${faceColor}"/>
          <rect x="${20 + eyeSpread}" y="14" width="1.5" height="2" rx="1" stroke="none" fill="${faceColor}"/>
        </g>
      </g>
    </svg>
  `.trim();
}

/* -------------------------------------------------------------------------- */
/* 2. MARBLE VARIANT (Organic fluid art)                                      */
/* -------------------------------------------------------------------------- */
function generateMarble(name: string, colors: string[], size: number): string {
  const hash = hashCode(name);
  const elements = [0, 1, 2].map((i) => ({
    color: getRandomColor(hash + i * 17, colors),
    translateX: getUnit(hash, 24, i * 2) - 12,
    translateY: getUnit(hash, 24, i * 2 + 1) - 12,
    scale: 1 + getUnit(hash, 0.8, i * 3) * 0.5,
    rotate: getUnit(hash, 360, i * 4),
  }));

  const bg = getRandomColor(hash + 99, colors);

  return `
    <svg viewBox="0 0 80 80" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <mask id="mask__marble_${hash}" maskUnits="userSpaceOnUse" x="0" y="0" width="80" height="80">
        <rect width="80" height="80" rx="40" fill="#FFFFFF"/>
      </mask>
      <g mask="url(#mask__marble_${hash})">
        <rect width="80" height="80" fill="${bg}"/>
        <path filter="url(#filter__marble_${hash})" d="M32.414 59.35L50.376 70.5H72.5v-71H33.728L26.5 13.381l19.057 27.08L32.414 59.35z" fill="${elements[0].color}" transform="translate(${elements[0].translateX} ${elements[0].translateY}) rotate(${elements[0].rotate} 40 40) scale(${elements[0].scale})"/>
        <path filter="url(#filter__marble_${hash})" d="M22.216 24L0 46.75l14.108 38.129L78 86l-3.081-59.276-22.343 8.005 5.476 20.768L22.216 24z" fill="${elements[1].color}" transform="translate(${elements[1].translateX} ${elements[1].translateY}) rotate(${elements[1].rotate} 40 40) scale(${elements[1].scale})"/>
        <path filter="url(#filter__marble_${hash})" d="M40 0h40v40H40z" fill="${elements[2].color}" transform="translate(${elements[2].translateX} ${elements[2].translateY}) rotate(${elements[2].rotate} 40 40) scale(${elements[2].scale})"/>
      </g>
      <defs>
        <filter id="filter__marble_${hash}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
          <feGaussianBlur stdDeviation="7" result="effect1_foregroundBlur"/>
        </filter>
      </defs>
    </svg>
  `.trim();
}

/* -------------------------------------------------------------------------- */
/* 3. SUNSET VARIANT (Atmospheric dusk horizon)                               */
/* -------------------------------------------------------------------------- */
function generateSunset(name: string, colors: string[], size: number): string {
  const hash = hashCode(name);
  const color1 = getRandomColor(hash, colors);
  const color2 = getRandomColor(hash + 23, colors);
  const color3 = getRandomColor(hash + 47, colors);
  const color4 = getRandomColor(hash + 71, colors);

  return `
    <svg viewBox="0 0 80 80" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <mask id="mask__sunset_${hash}" maskUnits="userSpaceOnUse" x="0" y="0" width="80" height="80">
        <rect width="80" height="80" rx="40" fill="#FFFFFF"/>
      </mask>
      <g mask="url(#mask__sunset_${hash})">
        <path fill="url(#gradient_paint0_linear_${hash})" d="M0 0h80v40H0z"/>
        <path fill="url(#gradient_paint1_linear_${hash})" d="M0 40h80v40H0z"/>
        <circle cx="40" cy="40" r="28" fill="url(#gradient_paint2_radial_${hash})" />
      </g>
      <defs>
        <linearGradient id="gradient_paint0_linear_${hash}" x1="0" y1="0" x2="80" y2="40" gradientUnits="userSpaceOnUse">
          <stop stop-color="${color1}"/>
          <stop offset="1" stop-color="${color2}"/>
        </linearGradient>
        <linearGradient id="gradient_paint1_linear_${hash}" x1="80" y1="40" x2="0" y2="80" gradientUnits="userSpaceOnUse">
          <stop stop-color="${color3}"/>
          <stop offset="1" stop-color="${color4}"/>
        </linearGradient>
        <radialGradient id="gradient_paint2_radial_${hash}" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(0 28 -28 0 40 40)">
          <stop stop-color="${color2}" stop-opacity="0.85"/>
          <stop offset="1" stop-color="${color1}" stop-opacity="0"/>
        </radialGradient>
      </defs>
    </svg>
  `.trim();
}

/* -------------------------------------------------------------------------- */
/* 4. BAUHAUS VARIANT (Geometric Modernist Art)                               */
/* -------------------------------------------------------------------------- */
function generateBauhaus(name: string, colors: string[], size: number): string {
  const hash = hashCode(name);
  const elements = [0, 1, 2, 3].map((i) => ({
    color: getRandomColor(hash + i * 19, colors),
    translateX: getUnit(hash, 24, i * 2) - 12,
    translateY: getUnit(hash, 24, i * 2 + 1) - 12,
    rotate: getUnit(hash, 360, i * 3),
    isSquare: (hash + i) % 2 === 0,
  }));

  const bg = getRandomColor(hash + 99, colors);

  return `
    <svg viewBox="0 0 80 80" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <mask id="mask__bauhaus_${hash}" maskUnits="userSpaceOnUse" x="0" y="0" width="80" height="80">
        <rect width="80" height="80" rx="40" fill="#FFFFFF"/>
      </mask>
      <g mask="url(#mask__bauhaus_${hash})">
        <rect width="80" height="80" fill="${bg}"/>
        <rect x="10" y="10" width="40" height="40" rx="${elements[0].isSquare ? 4 : 20}" fill="${elements[0].color}" transform="translate(${elements[0].translateX} ${elements[0].translateY}) rotate(${elements[0].rotate} 40 40)"/>
        <circle cx="50" cy="30" r="18" fill="${elements[1].color}" transform="translate(${elements[1].translateX} ${elements[1].translateY})"/>
        <line x1="0" y1="40" x2="80" y2="40" stroke="${elements[2].color}" stroke-width="4" transform="rotate(${elements[2].rotate} 40 40)"/>
        <rect x="25" y="45" width="30" height="15" rx="6" fill="${elements[3].color}" transform="translate(${elements[3].translateX} ${elements[3].translateY}) rotate(${elements[3].rotate} 40 40)"/>
      </g>
    </svg>
  `.trim();
}

/* -------------------------------------------------------------------------- */
/* 5. PIXEL VARIANT (Retro 8-Bit Arcade Matrix)                              */
/* -------------------------------------------------------------------------- */
function generatePixel(name: string, colors: string[], size: number): string {
  const hash = hashCode(name);
  const gridSize = 8;
  const cellSize = 80 / gridSize;
  const bg = getRandomColor(hash, colors);

  const rects: string[] = [];
  // Symmetric horizontally (columns 0..3 mirrored to 4..7)
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize / 2; x++) {
      const cellHash = hashCode(`${name}_${x}_${y}`);
      const shouldFill = cellHash % 3 !== 0;
      if (shouldFill) {
        const color = getRandomColor(cellHash, colors);
        const mirrorX = gridSize - 1 - x;
        rects.push(`<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}"/>`);
        if (x !== mirrorX) {
          rects.push(`<rect x="${mirrorX * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="${color}"/>`);
        }
      }
    }
  }

  return `
    <svg viewBox="0 0 80 80" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <mask id="mask__pixel_${hash}" maskUnits="userSpaceOnUse" x="0" y="0" width="80" height="80">
        <rect width="80" height="80" rx="40" fill="#FFFFFF"/>
      </mask>
      <g mask="url(#mask__pixel_${hash})">
        <rect width="80" height="80" fill="${bg}"/>
        ${rects.join('')}
      </g>
    </svg>
  `.trim();
}

/* -------------------------------------------------------------------------- */
/* 6. RING VARIANT (Cosmic Orbital Rings)                                    */
/* -------------------------------------------------------------------------- */
function generateRing(name: string, colors: string[], size: number): string {
  const hash = hashCode(name);
  const bg = getRandomColor(hash, colors);
  const ringColors = [
    getRandomColor(hash + 11, colors),
    getRandomColor(hash + 22, colors),
    getRandomColor(hash + 33, colors),
    getRandomColor(hash + 44, colors),
    getRandomColor(hash + 55, colors),
  ];

  return `
    <svg viewBox="0 0 80 80" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <mask id="mask__ring_${hash}" maskUnits="userSpaceOnUse" x="0" y="0" width="80" height="80">
        <rect width="80" height="80" rx="40" fill="#FFFFFF"/>
      </mask>
      <g mask="url(#mask__ring_${hash})">
        <rect width="80" height="80" fill="${bg}"/>
        <path d="M0 0h80v80H0z" fill="${ringColors[0]}" />
        <path d="M10 10h60v60H10z" rx="30" fill="${ringColors[1]}" />
        <path d="M20 20h40v40H20z" rx="20" fill="${ringColors[2]}" />
        <path d="M30 30h20v20H30z" rx="10" fill="${ringColors[3]}" />
        <circle cx="40" cy="40" r="5" fill="${ringColors[4]}" />
      </g>
    </svg>
  `.trim();
}

/* -------------------------------------------------------------------------- */
/* PUBLIC API                                                                 */
/* -------------------------------------------------------------------------- */

export function getBoringAvatarSvg(
  variant: BoringAvatarVariant = 'beam',
  name = 'Cinephile',
  colors: string[] = DEFAULT_PALETTE,
  size = 80
): string {
  const safeName = (name || 'Cinephile').trim();
  const safeColors = colors && colors.length > 0 ? colors : DEFAULT_PALETTE;

  switch (variant) {
    case 'beam':
      return generateBeam(safeName, safeColors, size);
    case 'marble':
      return generateMarble(safeName, safeColors, size);
    case 'sunset':
      return generateSunset(safeName, safeColors, size);
    case 'bauhaus':
      return generateBauhaus(safeName, safeColors, size);
    case 'pixel':
      return generatePixel(safeName, safeColors, size);
    case 'ring':
      return generateRing(safeName, safeColors, size);
    default:
      return generateBeam(safeName, safeColors, size);
  }
}

export function getBoringAvatarDataUri(
  variant: BoringAvatarVariant = 'beam',
  name = 'Cinephile',
  colors: string[] = DEFAULT_PALETTE,
  size = 80
): string {
  const svg = getBoringAvatarSvg(variant, name, colors, size);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
