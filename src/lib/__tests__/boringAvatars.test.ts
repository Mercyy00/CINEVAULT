import { describe, it, expect } from 'vitest';
import {
  getBoringAvatarSvg,
  getBoringAvatarDataUri,
  BORING_PALETTES,
  BoringAvatarVariant,
  THEME_BEAM_COLORS,
  DEFAULT_PALETTE,
} from '../boringAvatars';
import { getUserAvatarUrl, PRESET_AVATARS } from '../avatars';

describe('Boring Avatars Generator', () => {
  const variants: BoringAvatarVariant[] = ['beam', 'marble', 'sunset', 'bauhaus', 'pixel', 'ring'];

  it('strictly defines the requested CineVault Beam palette', () => {
    expect(THEME_BEAM_COLORS).toEqual([
      '#9e1e4c',
      '#ff1168',
      '#25020f',
      '#8f8f8f',
      '#ececec',
    ]);
    expect(DEFAULT_PALETTE).toEqual(THEME_BEAM_COLORS);
    expect(BORING_PALETTES[0].colors).toEqual(THEME_BEAM_COLORS);
    expect(BORING_PALETTES[0].id).toBe('vault-beam-theme');
  });

  variants.forEach((variant) => {
    it(`generates valid SVG for variant "${variant}"`, () => {
      const svg = getBoringAvatarSvg(variant, 'Cinephile', THEME_BEAM_COLORS, 120);
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('viewBox=');
      expect(svg).toContain('mask=');
    });

    it(`generates valid data-URI for variant "${variant}"`, () => {
      const uri = getBoringAvatarDataUri(variant, 'TestUser', THEME_BEAM_COLORS, 96);
      expect(uri.startsWith('data:image/svg+xml;utf8,')).toBe(true);
      expect(uri).toContain('%3Csvg');
    });
  });

  it('generates deterministic SVGs for the same seed and colors', () => {
    const svg1 = getBoringAvatarSvg('beam', 'DirectorJay', THEME_BEAM_COLORS);
    const svg2 = getBoringAvatarSvg('beam', 'DirectorJay', THEME_BEAM_COLORS);
    expect(svg1).toBe(svg2);
  });

  it('generates different SVGs for different seeds', () => {
    const svg1 = getBoringAvatarSvg('beam', 'Alice', THEME_BEAM_COLORS);
    const svg2 = getBoringAvatarSvg('beam', 'Bob', THEME_BEAM_COLORS);
    expect(svg1).not.toBe(svg2);
  });

  it('ensures all PRESET_AVATARS use variant="beam" and THEME_BEAM_COLORS', () => {
    expect(PRESET_AVATARS.length).toBeGreaterThan(0);
    PRESET_AVATARS.forEach((preset) => {
      expect(preset.style).toBe('beam');
      expect(preset.paletteId).toBe('vault-beam-theme');
      // The generated URL must contain at least one of the theme colors
      const hasThemeColor =
        preset.url.includes('%239e1e4c') ||
        preset.url.includes('%23ff1168') ||
        preset.url.includes('%2325020f') ||
        preset.url.includes('%238f8f8f') ||
        preset.url.includes('%23ececec');
      expect(hasThemeColor).toBe(true);
    });
  });

  it('getUserAvatarUrl auto-migrates legacy keys to Beam theme', () => {
    const defaultUrl = getUserAvatarUrl('default');
    expect(defaultUrl).toContain('data:image/svg+xml');
    const hasThemeColor = THEME_BEAM_COLORS.some((c) =>
      defaultUrl.includes(encodeURIComponent(c))
    );
    expect(hasThemeColor).toBe(true);

    const legacyOrion = getUserAvatarUrl('constellation-orion');
    expect(legacyOrion).toContain('data:image/svg+xml');
    expect(
      THEME_BEAM_COLORS.some((c) => legacyOrion.includes(encodeURIComponent(c)))
    ).toBe(true);

    const staleDataUri = 'data:image/svg+xml;utf8,<svg>old_random_avatar</svg>';
    const migratedUrl = getUserAvatarUrl(staleDataUri);
    expect(migratedUrl).toContain('data:image/svg+xml');
    expect(migratedUrl).not.toBe(staleDataUri);
    expect(
      THEME_BEAM_COLORS.some((c) => migratedUrl.includes(encodeURIComponent(c)))
    ).toBe(true);
  });
});
