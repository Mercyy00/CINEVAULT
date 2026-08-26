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

/** True when the current hash carries the configured unlock key. */
export function hashCarriesBirthdayKey(hash: string = window.location.hash): boolean {
  return SECRET_KEY.length > 0 && hash.includes(`key=${SECRET_KEY}`);
}

/**
 * Persists the unlock when the hash carries the key, so the section stays
 * reachable after the query string is dropped. Call this from an effect: the
 * previous code wrote to localStorage during render.
 */
export function rememberBirthdayUnlock(hash: string = window.location.hash): void {
  if (hashCarriesBirthdayKey(hash)) writeString(UNLOCKED_KEY, 'true');
}

export function isBirthdayVisible(hash: string = window.location.hash): boolean {
  return (
    isBirthdayBuildEnabled ||
    isBirthdayLocallyEnabled() ||
    isBirthdayUnlocked() ||
    hashCarriesBirthdayKey(hash)
  );
}
