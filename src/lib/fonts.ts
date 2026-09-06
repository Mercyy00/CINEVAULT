/**
 * On-demand display-font loading.
 *
 * Previously index.html loaded 12 font families render-blocking so that a
 * theme picker could switch between 8 of them. Every visitor paid ~1 MB to
 * see one. Here each family's stylesheet is injected the first time it is
 * actually selected.
 *
 * Note: the original font stacks led with names that were never loaded from
 * anywhere ("DINKO", "GC Inklab", "Odida", "Talina", "GRIND"...). There are no
 * local @font-face rules and no font files in public/, so those names always
 * fell through to the next entry in the stack. The stacks below list only
 * faces that genuinely load, and the labels in the UI now name what actually
 * renders.
 */

export type AppFontId =
  | 'bricolage'
  | 'syne'
  | 'clash'
  | 'orbitron'
  | 'cinzel'
  | 'melodrama'
  | 'fredoka'
  | 'anton';

export interface FontDefinition {
  /** Label shown in the picker. */
  readonly name: string;
  readonly tag: string;
  /** Stylesheet URL(s), or null when the face is bundled locally. */
  readonly href: string | string[] | null;
  /** Complete CSS font-family stack */
  readonly fontFamily: string;
}

const GOOGLE = 'https://fonts.googleapis.com/css2';
const FONTSHARE = 'https://api.fontshare.com/v2/css';

export const APP_FONTS: Record<AppFontId, FontDefinition> = {
  bricolage: {
    name: 'Bricolage Grotesque',
    tag: 'Default',
    href: null,
    fontFamily: '"Bricolage Grotesque", "Inter", system-ui, sans-serif',
  },
  syne: {
    name: 'Syne',
    tag: 'Retro Bold',
    href: `${GOOGLE}?family=Syne:wght@700;800&display=swap`,
    fontFamily: '"Syne", "Cabinet Grotesk", sans-serif',
  },
  clash: {
    name: 'Clash Display',
    tag: 'Geometric',
    href: [
      `${FONTSHARE}?f[]=clash-display@500,600,700&display=swap`,
      `${GOOGLE}?family=Space+Grotesk:wght@600;700&display=swap`,
    ],
    fontFamily: '"Clash Display", "Space Grotesk", sans-serif',
  },
  orbitron: {
    name: 'Orbitron',
    tag: 'Futuristic',
    href: `${GOOGLE}?family=Orbitron:wght@600;800;900&display=swap`,
    fontFamily: '"Orbitron", "Space Grotesk", sans-serif',
  },
  cinzel: {
    name: 'Cinzel',
    tag: 'Luxury',
    href: `${GOOGLE}?family=Cinzel:wght@600;700;900&display=swap`,
    fontFamily: '"Cinzel", "Playfair Display", serif',
  },
  melodrama: {
    name: 'Melodrama',
    tag: 'High Contrast',
    href: [
      `${FONTSHARE}?f[]=melodrama@400,500,600,700&display=swap`,
      `${GOOGLE}?family=DM+Serif+Display&display=swap`,
    ],
    fontFamily: '"Melodrama", "DM Serif Display", "Playfair Display", serif',
  },
  fredoka: {
    name: 'Fredoka',
    tag: 'Playful',
    href: `${GOOGLE}?family=Fredoka:wght@600;700&display=swap`,
    fontFamily: '"Fredoka", "Comfortaa", cursive, sans-serif',
  },
  anton: {
    name: 'Anton',
    tag: 'Heavy Impact',
    href: `${GOOGLE}?family=Anton&display=swap`,
    fontFamily: '"Anton", "Impact", sans-serif',
  },
};

export const APP_FONT_IDS = Object.keys(APP_FONTS) as AppFontId[];

export function isAppFontId(value: unknown): value is AppFontId {
  return typeof value === 'string' && value in APP_FONTS;
}

export function normalizeFontId(id: unknown): AppFontId {
  if (typeof id !== 'string') return 'bricolage';
  const clean = id.trim().toLowerCase();
  const legacyMap: Record<string, AppFontId> = {
    dinko: 'syne',
    inklab: 'clash',
    gunken: 'orbitron',
    odida: 'cinzel',
    talina: 'fredoka',
    grind: 'anton',
  };
  if (clean in legacyMap) return legacyMap[clean];
  if (isAppFontId(clean)) return clean;
  return 'bricolage';
}

/** Ids of families whose stylesheet has been requested this session. */
const requested = new Set<string>(['bricolage']);

/** Injects a font family's stylesheet once. Safe to call on every selection. */
export function loadAppFont(rawId: string): void {
  const id = normalizeFontId(rawId);
  if (requested.has(id)) return;
  const definition = APP_FONTS[id];
  if (!definition?.href) {
    requested.add(id);
    return;
  }

  requested.add(id);
  const hrefs = Array.isArray(definition.href) ? definition.href : [definition.href];
  for (const url of hrefs) {
    const existing = document.querySelector(`link[href="${url}"]`);
    if (!existing) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.crossOrigin = 'anonymous';
      link.dataset.appFont = id;
      document.head.appendChild(link);
    }
  }
}
