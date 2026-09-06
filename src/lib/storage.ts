/**
 * Namespaced, validated localStorage access.
 *
 * Replaces the previous ad-hoc mix of key conventions -- `cv_watchlist`,
 * `cinevault_continue_watching`, `cinevault_onboarding_complete`,
 * `user_preferences` (unprefixed, so it collided with anything else on the
 * origin), `cv_guest_uid`, `cinevault_user` -- with a single `cv:` namespace,
 * a schema version, and one-time migration of the legacy keys.
 *
 * Every read is validated. A single malformed value used to be able to throw
 * during render and blank the page.
 */

const NAMESPACE = 'cv:';
const SCHEMA_VERSION_KEY = `${NAMESPACE}schemaVersion`;
const CURRENT_SCHEMA_VERSION = 2;

export const StorageKeys = {
  watchlist: `${NAMESPACE}watchlist`,
  continueWatching: `${NAMESPACE}continueWatching`,
  onboardingComplete: `${NAMESPACE}onboardingComplete`,
  userPreferences: `${NAMESPACE}userPreferences`,
  guestUid: `${NAMESPACE}guestUid`,
  profile: `${NAMESPACE}profile`,
  profiles: `${NAMESPACE}profiles`,
  activeProfileId: `${NAMESPACE}activeProfileId`,
  /** Locally cached watch sessions. Was a bare literal inside watchTracking.ts,
   *  so `clearAppData()` happened to catch it only because of the `cv:` prefix. */
  localWatchSessions: `${NAMESPACE}localWatchSessions`,
  /** 'granted' | 'denied'. Absent until the visitor answers. */
  telemetryConsent: `${NAMESPACE}telemetryConsent`,
  /** Last source id that played successfully, so it is offered first. */
  preferredServer: `${NAMESPACE}preferredServer`,
  /** Read by the pre-paint bootstrap in index.html. Keep the names in sync. */
  theme: `${NAMESPACE}theme`,
  themeMode: `${NAMESPACE}themeMode`,
  font: `${NAMESPACE}font`,
} as const;

/** localStorage throws in private browsing modes and when the quota is full. */
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Quota exceeded or storage denied. Persistence is best-effort. */
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* Nothing actionable. */
  }
}

export function readString(key: string, fallback: string): string {
  return safeGet(key) ?? fallback;
}

export function writeString(key: string, value: string): void {
  safeSet(key, value);
}

/**
 * Reads and parses a JSON value, falling back when it is missing, unparseable,
 * or rejected by `isValid`.
 */
export function readJSON<T>(key: string, fallback: T, isValid?: (value: unknown) => boolean): T {
  const raw = safeGet(key);
  if (raw === null) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isValid && !isValid(parsed)) return fallback;
    return parsed as T;
  } catch {
    // Drop the corrupt entry so it cannot fail again on every load.
    safeRemove(key);
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    safeSet(key, JSON.stringify(value));
  } catch {
    /* Value contained a circular reference. Nothing to persist. */
  }
}

export function remove(key: string): void {
  safeRemove(key);
}

/**
 * Removes only this app's keys.
 *
 * The reset flow previously called `localStorage.clear()`, which wiped every
 * key on the origin including any set by other apps or tooling.
 */
export function clearAppData(): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(NAMESPACE)) doomed.push(key);
    }
    doomed.forEach(safeRemove);
  } catch {
    /* Nothing actionable. */
  }
}

/** Old key -> new key. Values are moved verbatim. */
const LEGACY_KEY_MAP: Record<string, string> = {
  cv_watchlist: StorageKeys.watchlist,
  cinevault_continue_watching: StorageKeys.continueWatching,
  cinevault_onboarding_complete: StorageKeys.onboardingComplete,
  user_preferences: StorageKeys.userPreferences,
  cv_guest_uid: StorageKeys.guestUid,
  cinevault_user: StorageKeys.profile,
  cv_theme: StorageKeys.theme,
  cv_font: StorageKeys.font,
};

/** Keys that are simply obsolete and should be dropped. */
const OBSOLETE_KEYS = [
  // Runtime Firebase config: allowing a visitor to repoint the app's backend
  // via localStorage was a credential-injection vector.
  'cv_firebase_api_key',
  'cv_firebase_auth_domain',
  'cv_firebase_project_id',
  'cv_firebase_storage_bucket',
  'cv_firebase_messaging_sender_id',
  'cv_firebase_app_id',
  // Cached auth identity: Firebase Auth owns session persistence.
  'cv_auth_user',
  // Client-side admin gate.
  'cv_admin_authenticated',
];

/**
 * Moves legacy keys into the `cv:` namespace. Idempotent; safe to call on
 * every boot. Must run before any component reads storage.
 */
export function runStorageMigrations(): void {
  const version = Number(safeGet(SCHEMA_VERSION_KEY) ?? '0');
  if (version >= CURRENT_SCHEMA_VERSION) return;

  for (const [legacyKey, newKey] of Object.entries(LEGACY_KEY_MAP)) {
    const legacyValue = safeGet(legacyKey);
    if (legacyValue !== null && safeGet(newKey) === null) {
      safeSet(newKey, legacyValue);
    }
    safeRemove(legacyKey);
  }

  OBSOLETE_KEYS.forEach(safeRemove);

  // Derive the theme mode once so the pre-paint bootstrap no longer needs its
  // own duplicated copy of the light-theme list.
  if (safeGet(StorageKeys.themeMode) === null) {
    const theme = safeGet(StorageKeys.theme) ?? 'cinematic-dark';
    safeSet(StorageKeys.themeMode, LIGHT_THEME_IDS.has(theme) ? 'light' : 'dark');
  }

  safeSet(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
}

/**
 * Single source of truth for which themes are light.
 *
 * This lived in two places before: `LIGHT_THEMES` in store.tsx and a
 * hand-copied `var lightThemes = [...]` in the index.html bootstrap script.
 */
export const LIGHT_THEME_IDS: ReadonlySet<string> = new Set([
  'elegant-light',
  'clean-daylight',
  'vanilla-cherry',
  'nordic-frost',
  'matcha-cream',
  'sunset-rose',
]);
