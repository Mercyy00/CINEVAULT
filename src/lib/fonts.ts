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

interface FontDefinition {
  /** Label shown in the picker. Must match the face that actually renders. */
  readonly name: string;
  readonly tag: string;
  /** Stylesheet URL, or null when the face is already in the initial payload. */
  readonly href: string | null;
}

const GOOGLE = 'https://fonts.googleapis.com/css2';
const FONTSHARE = 'https://api.fontshare.com/v2/css';

export const APP_FONTS: Record<AppFontId, FontDefinition> = {
  bricolage: { name: 'Bricolage Grotesque', tag: 'Default', href: null },
  syne: { name: 'Syne', tag: 'Retro Bold', href: `${GOOGLE}?family=Syne:wght@700;800&display=swap` },
  clash: {
    name: 'Clash Display',
    tag: 'Geometric',
    href: `${FONTSHARE}?f[]=clash-display@500,600,700&display=swap`,
  },
  orbitron: {
    name: 'Orbitron',
    tag: 'Futuristic',
    href: `${GOOGLE}?family=Orbitron:wght@600;800;900&display=swap`,
  },
  cinzel: {
    name: 'Cinzel',
    tag: 'Luxury',
    href: `${GOOGLE}?family=Cinzel:wght@600;700;900&display=swap`,
  },
  melodrama: {
    name: 'Melodrama',
    tag: 'High Contrast',
    href: `${FONTSHARE}?f[]=melodrama@400,500,600,700&display=swap`,
  },
  fredoka: {
    name: 'Fredoka',
    tag: 'Playful',
    href: `${GOOGLE}?family=Fredoka:wght@600;700&display=swap`,
  },
  anton: { name: 'Anton', tag: 'Heavy Impact', href: `${GOOGLE}?family=Anton&display=swap` },
};

export const APP_FONT_IDS = Object.keys(APP_FONTS) as AppFontId[];

export function isAppFontId(value: unknown): value is AppFontId {
  return typeof value === 'string' && value in APP_FONTS;
}

/** Ids of families whose stylesheet has been requested this session. */
const requested = new Set<AppFontId>(['bricolage']);

/** Injects a font family's stylesheet once. Safe to call on every selection. */
export function loadAppFont(id: AppFontId): void {
  if (requested.has(id)) return;
  const definition = APP_FONTS[id];
  if (!definition?.href) {
    requested.add(id);
    return;
  }

  requested.add(id);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = definition.href;
  link.crossOrigin = 'anonymous';
  link.dataset.appFont = id;
  document.head.appendChild(link);
}
