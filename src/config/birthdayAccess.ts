import { readString, writeString } from '../lib/storage';

/**
 * Visibility of the personal birthday section.
 *
 * The same three-clause condition was pasted into `App.tsx`, `Navbar.tsx` and
 * `AdminDashboard.tsx`, each with its own copy of the storage key and, in
 * `App.tsx`, a hardcoded fallback secret (`'divu21'`) that shipped in the
 * bundle — so the "secret key" gate was public knowledge for anyone who opened
 * devtools. The fallback is gone: with no `VITE_BIRTHDAY_SECRET_KEY` configured
 * there is no key that unlocks it, only the explicit build flag or the local
 * toggle.
 *
 * This is a presentation toggle, not a security boundary. It lives in
 * localStorage, so it is per-browser and any visitor can flip their own copy.
 * Nothing sensitive should ever be gated on it.
 */

const ENABLED_KEY = 'cv:birthdayPublic';
const UNLOCKED_KEY = 'cv:birthdayUnlocked';

export const isBirthdayBuildEnabled = import.meta.env.VITE_ENABLE_BIRTHDAY === 'true';
const SECRET_KEY: string = import.meta.env.VITE_BIRTHDAY_SECRET_KEY ?? '';

export function isBirthdayLocallyEnabled(): boolean {
  return readString(ENABLED_KEY, 'false') === 'true';
}

export function setBirthdayLocallyEnabled(enabled: boolean): void {
  writeString(ENABLED_KEY, String(enabled));
}

/** True once a correct key has been used in this browser. */
export function isBirthdayUnlocked(): boolean {
  return readString(UNLOCKED_KEY, 'false') === 'true';
}

/** True when the current URL search or hash carries the configured unlock key. */
export function hashCarriesBirthdayKey(urlContext: string = typeof window !== 'undefined' ? `${window.location.search} ${window.location.hash}` : ''): boolean {
  return SECRET_KEY.length > 0 && urlContext.includes(`key=${SECRET_KEY}`);
}

/**
 * Persists the unlock when the URL carries the key, so the section stays
 * reachable after the query string is dropped. Call this from an effect: the
 * previous code wrote to localStorage during render.
 */
export function rememberBirthdayUnlock(urlContext: string = typeof window !== 'undefined' ? `${window.location.search} ${window.location.hash}` : ''): void {
  if (hashCarriesBirthdayKey(urlContext)) writeString(UNLOCKED_KEY, 'true');
}

/**
 * Target Birthday is 2nd September 2026 00:00:00 (Local Time).
 * Returns true if the current date is on or after September 2nd, 2026.
 */
export function isBirthdayDateReached(): boolean {
  const now = new Date();
  const target = new Date(2026, 8, 2, 0, 0, 0); // Month 8 is September (0-indexed)
  return now.getTime() >= target.getTime();
}

/**
 * Determines whether the birthday page can be opened.
 * Before 2nd September 2026, opening the birthday page is restricted unless
 * explicitly enabled via secret key, local toggle, or build flag.
 */
export function isBirthdayPageAccessible(urlContext: string = typeof window !== 'undefined' ? `${window.location.search} ${window.location.hash}` : ''): boolean {
  return (
    isBirthdayDateReached() ||
    isBirthdayBuildEnabled ||
    isBirthdayLocallyEnabled() ||
    isBirthdayUnlocked() ||
    hashCarriesBirthdayKey(urlContext)
  );
}

/**
 * Returns true if the birthday page is accessible (kept for backward compatibility).
 */
export function isBirthdayVisible(urlContext: string = typeof window !== 'undefined' ? `${window.location.search} ${window.location.hash}` : ''): boolean {
  return isBirthdayPageAccessible(urlContext);
}

/**
 * The countdown timer widget is hidden from the navbar.
 */
export function isBirthdayCountdownVisible(): boolean {
  return false;
}

