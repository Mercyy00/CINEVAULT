import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useDebouncedCallback } from 'use-debounce';
import type { ContinueWatchingItem, Movie, WatchStatus, WatchlistItem } from './types';
import { authService, type AuthUser } from './services/auth';
import { continueWatchingKey, syncService } from './services/sync';
import { watchTrackingService } from './services/watchTracking';
import { loadAppFont, normalizeFontId, type AppFontId } from './lib/fonts';
import { COMPLETION_THRESHOLD } from './lib/playback';
import {
  getTelemetryConsent,
  hasTelemetryConsent,
  setSignedInHint,
  setTelemetryConsent as persistTelemetryConsent,
  type ConsentState,
} from './lib/consent';
import {
  LIGHT_THEME_IDS,
  StorageKeys,
  clearAppData,
  readJSON,
  readString,
  remove,
  runStorageMigrations,
  writeJSON,
  writeString,
} from './lib/storage';

/**
 * Legacy localStorage keys are migrated before any state initialiser reads them.
 *
 * This was a bare `runStorageMigrations()` at module scope, which made merely
 * importing the store a side effect -- it ran during test collection, during any
 * static analysis that resolved the import graph, and twice under HMR. It is now
 * invoked from the first statement of `AppProvider`, still ahead of every
 * `useState` initialiser in that body, and guarded so it happens exactly once.
 */
let migrationsHaveRun = false;
function ensureStorageMigrations(): void {
  if (migrationsHaveRun) return;
  migrationsHaveRun = true;
  runStorageMigrations();
}

export const THEMES = [
  'cinematic-dark',
  'butter-green',
  'cherry-cola',
  'bistre-aureolin',
  'vibrant-lime',
  'imperial-violet',
  'midnight-ocean',
  'crimson-premiere',
  'neon-cyberpunk',
  'elegant-light',
  'clean-daylight',
  'vanilla-cherry',
  'nordic-frost',
  'matcha-cream',
  'sunset-rose',
] as const;

export type Theme = (typeof THEMES)[number];
export type AppFont = AppFontId;

const DEFAULT_THEME: Theme = 'crimson-premiere';
const DEFAULT_FONT: AppFont = 'bricolage';

/** Cloud writes are batched: state changes in bursts, Firestore bills per write. */
const CLOUD_SYNC_DEBOUNCE_MS = 2_500;
const MAX_CONTINUE_WATCHING = 20;
const MAX_TOASTS = 3;
const TOAST_DURATION_MS = 3_000;
/* COMPLETION_THRESHOLD now lives in lib/playback.ts. It was 95 here and 90 in
 * PlayerPage, so a title the player considered finished stayed in the row. */

function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

export interface UserProfile {
  uid?: string;
  name: string;
  email?: string;
  avatar?: string;
  isLoggedIn?: boolean;
  language?: string;
  defaultServer?: string;
  audioPreference?: 'sub' | 'dub';
  filmGrain?: boolean;
  logoStyle?: 'vault' | 'cat';
  showSpoilers: boolean;
  autoPlayNext: boolean;
  reducedMotion: boolean;
}

export interface ProfileItem {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
  maxAgeRating?: string;
  language?: string;
  theme?: Theme;
  appFont?: AppFont;
  watchlist?: WatchlistItem[];
  continueWatching?: ContinueWatchingItem[];
}

export interface Toast {
  id: string;
  message: string;
}

export type AuthStatus = 'loading' | 'signed-in' | 'signed-out';

interface AppContextType {
  watchlist: WatchlistItem[];
  addToWatchlist: (movie: Movie) => void;
  removeFromWatchlist: (movieId: string) => void;
  updateStatus: (movieId: string, status: WatchStatus) => void;
  /** Replaces the whole list. Used by drag-reorder and by backup import, both
   *  of which produce a full validated array rather than a single mutation. */
  replaceWatchlist: (items: WatchlistItem[]) => void;
  isInWatchlist: (movieId: string) => boolean;
  clearWatchlist: () => void;
  toasts: Toast[];
  showToast: (message: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  appFont: AppFont;
  setAppFont: (font: AppFont) => void;
  userProfile: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  clearProfile: () => void;
  resetAllLocalData: () => void;
  continueWatching: ContinueWatchingItem[];
  updateContinueWatching: (item: ContinueWatchingItem) => void;
  clearContinueWatching: () => void;
  removeContinueWatchingItem: (
    id: string,
    mediaType?: 'movie' | 'tv' | 'anime',
    seasonNumber?: number,
    episodeNumber?: number
  ) => void;
  removeFromContinueWatching: (
    id: string,
    mediaType?: 'movie' | 'tv' | 'anime',
    seasonNumber?: number,
    episodeNumber?: number
  ) => void;
  
  /* Multi-Profile Management */
  profiles: ProfileItem[];
  activeProfileId: string;
  activeProfile: ProfileItem;
  switchProfile: (profileId: string) => void;
  createProfile: (newProfile: { name: string; avatar: string; isKids: boolean; maxAgeRating?: string }) => string;
  updateProfile: (profileId: string, updates: Partial<ProfileItem>) => void;
  deleteProfile: (profileId: string) => void;
  isKidsMode: boolean;

  deferredInstallPrompt: BeforeInstallPromptEvent | null;
  setDeferredInstallPrompt: React.Dispatch<React.SetStateAction<BeforeInstallPromptEvent | null>>;
  onboardingComplete: boolean;
  setOnboardingComplete: (value: boolean) => void;
  userPreferences: UserPreference[];
  setUserPreferences: (value: UserPreference[]) => void;
  ambientColor: string | null;
  setAmbientColor: (color: string | null) => void;

  /** 'loading' until Firebase resolves the session. Render a skeleton, not a
   *  signed-out UI, while this is 'loading'. */
  authStatus: AuthStatus;
  /** Sourced from the `admin` custom claim on the ID token, never from email. */
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  syncNow: () => Promise<void>;
  /**
   * False when Firebase is not configured or anonymous sign-in is unavailable.
   * The app then runs entirely from localStorage and writes nothing remotely.
   */
  cloudAvailable: boolean;
  /**
   * Personalised affinity score out of 100, or **null** when too little is
   * known to say anything. Callers must render nothing for null rather than
   * substituting a number -- `MovieCard` used to display a flat "96% Match" for
   * every unrated title.
   */
  getMatchScore: (movie: Movie) => number | null;
  /** Normalized genre affinity score map from user watchlist + preferences. */
  genreAffinity: Record<string, number>;
  /** 'unset' until the visitor answers the telemetry prompt. */
  telemetryConsent: ConsentState;
  setTelemetryConsent: (state: 'granted' | 'denied') => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalMode: 'signin' | 'signup' | 'forgot';
  setAuthModalMode: (mode: 'signin' | 'signup' | 'forgot') => void;
}

/**
 * A homepage row derived from an onboarding answer.
 *
 * This was previously an array of JSON *strings* that App.tsx called
 * `JSON.parse` on during render -- one malformed entry blanked the homepage.
 * It is now parsed and validated once, here.
 */
export interface UserPreference {
  label: string;
  genres: string;
  type?: 'movie' | 'tv';
}

const GENRE_MAP: Record<string, string> = {
  '28': 'Action',
  '878': 'Sci-Fi',
  '10749': 'Romance',
  '27': 'Horror',
  '16': 'Anime',
  '53': 'Thriller',
  '35': 'Comedy',
  '18': 'Drama',
};

export function sanitizeUserPreferences(raw: unknown): UserPreference[] {
  if (!Array.isArray(raw)) return [];
  const results: UserPreference[] = [];
  for (const item of raw) {
    if (!item) continue;
    if (typeof item === 'string') {
      const label = GENRE_MAP[item] || (item !== 'undefined' ? item : '');
      if (label) {
        results.push({ label, genres: item, type: item === '16' ? 'tv' : 'movie' });
      }
    } else if (typeof item === 'object') {
      const rawLabel = (item as any).label;
      const rawName = (item as any).name;
      const rawGenres = String((item as any).genres || (item as any).id || '');
      
      const label =
        typeof rawLabel === 'string' && rawLabel.trim() && rawLabel !== 'undefined'
          ? rawLabel.trim()
          : typeof rawName === 'string' && rawName.trim() && rawName !== 'undefined'
            ? rawName.trim()
            : GENRE_MAP[rawGenres] || null;

      const type = (item as any).type === 'tv' ? 'tv' : 'movie';

      if (label && label !== 'undefined') {
        results.push({ label, genres: rawGenres || label, type });
      }
    }
  }
  return results;
}

/** The non-standard event fired by Chromium for PWA installs. */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * The local-only fallback identity.
 *
 * Guests are Firebase **anonymous** sessions now, so the normal path is a real
 * uid issued by Firebase and covered by `isOwner()` in firestore.rules. The old
 * client-minted `guest_<timestamp>_<random>` string forced the rules to allow
 * `uid.matches('^guest_.*')`, which let any unauthenticated visitor read and
 * overwrite every other guest's profile and watch history.
 *
 * This value is used only when Firebase is unavailable, in which case nothing is
 * ever written to the cloud -- it exists so uid-keyed local state still works.
 * The `local_` prefix is deliberate: it is never sent anywhere, and the store
 * asserts on it before any remote call.
 *
 * Pure: it reads storage but does not write. Persisting is an effect.
 */
function readLocalGuestUid(): string {
  const existing = readString(StorageKeys.guestUid, '');
  if (existing) return existing;
  return `local_${crypto.randomUUID()}`;
}

/** True for the offline fallback identity, which must never reach Firestore. */
function isLocalOnlyUid(uid: string | undefined): boolean {
  return !uid || uid.startsWith('local_') || uid.startsWith('guest_');
}

function buildDefaultProfile(uid: string): UserProfile {
  return {
    uid,
    name: 'Guest',
    email: '',
    avatar: 'default',
    isLoggedIn: false,
    language: 'English (US)',
    defaultServer: 'auto',
    audioPreference: 'sub',
    filmGrain: true,
    logoStyle: 'cat',
    showSpoilers: false,
    autoPlayNext: true,
    reducedMotion: false,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Must precede every state initialiser below; guarded, so it runs once.
  ensureStorageMigrations();

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() =>
    readJSON<WatchlistItem[]>(StorageKeys.watchlist, [], Array.isArray)
  );

  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>(() => {
    const raw = readJSON<ContinueWatchingItem[]>(StorageKeys.continueWatching, [], Array.isArray);
    const map = new Map<string, ContinueWatchingItem>();
    for (const item of raw) {
      if (!item?.id) continue;
      const key = continueWatchingKey(item);
      const existing = map.get(key);
      if (!existing || (item.timestamp ?? 0) > (existing.timestamp ?? 0)) {
        map.set(key, item);
      }
    }
    return Array.from(map.values()).sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  });

  const [deferredInstallPrompt, setDeferredInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [onboardingComplete, setOnboardingCompleteState] = useState<boolean>(
    () => readString(StorageKeys.onboardingComplete, 'false') === 'true'
  );

  const [ambientColor, setAmbientColor] = useState<string | null>(null);

  const [userPreferences, setUserPreferencesState] = useState<UserPreference[]>(() => {
    const raw = readJSON<unknown>(StorageKeys.userPreferences, []);
    return sanitizeUserPreferences(raw);
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [isAdmin, setIsAdmin] = useState(false);
  /** Cleared when Firebase is absent or anonymous sign-in is refused. */
  const [cloudAvailable, setCloudAvailable] = useState(true);
  const [telemetryConsent, setTelemetryConsentState] = useState<ConsentState>(getTelemetryConsent);

  /* Read during render, persisted in an effect. The previous version called a
   * storage-*writing* helper from the render body, which React may run twice or
   * discard entirely under concurrent rendering. */
  const [localGuestUid] = useState<string>(readLocalGuestUid);
  useEffect(() => {
    if (readString(StorageKeys.guestUid, '') !== localGuestUid) {
      writeString(StorageKeys.guestUid, localGuestUid);
    }
  }, [localGuestUid]);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const fallback = buildDefaultProfile(localGuestUid);
    const stored = readJSON<Partial<UserProfile>>(
      StorageKeys.profile,
      {},
      (value) => typeof value === 'object' && value !== null
    );
    const resolvedLogo = stored.logoStyle === 'vault' ? 'vault' : 'cat';
    return { ...fallback, ...stored, logoStyle: resolvedLogo, uid: stored.uid || fallback.uid };
  });

  // ── Multi-Profile Management ─────────────────────────────────────────
  const [profiles, setProfiles] = useState<ProfileItem[]>(() => {
    const stored = readJSON<ProfileItem[]>(StorageKeys.profiles, [], Array.isArray);
    if (stored && stored.length > 0) return stored;
    const legacyWatchlist = readJSON<WatchlistItem[]>(StorageKeys.watchlist, [], Array.isArray);
    const legacyCW = readJSON<ContinueWatchingItem[]>(StorageKeys.continueWatching, [], Array.isArray);
    const legacyProf = readJSON<Partial<UserProfile>>(StorageKeys.profile, {});
    return [
      {
        id: 'default',
        name: legacyProf.name || 'Primary',
        avatar: legacyProf.avatar || 'constellation-orion',
        isKids: false,
        watchlist: legacyWatchlist,
        continueWatching: legacyCW,
      },
      {
        id: 'kids',
        name: 'Kids',
        avatar: 'big-smile',
        isKids: true,
        maxAgeRating: 'PG',
        watchlist: [],
        continueWatching: [],
      },
    ];
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return readString(StorageKeys.activeProfileId, 'default');
  });

  const activeProfile = useMemo<ProfileItem>(() => {
    return (
      profiles.find((p) => p.id === activeProfileId) ||
      profiles[0] || {
        id: 'default',
        name: 'Primary',
        avatar: 'constellation-orion',
        isKids: false,
        watchlist: [],
        continueWatching: [],
      }
    );
  }, [profiles, activeProfileId]);

  const isKidsMode = Boolean(activeProfile.isKids);

  useEffect(() => {
    writeJSON(StorageKeys.profiles, profiles);
  }, [profiles]);

  useEffect(() => {
    writeString(StorageKeys.activeProfileId, activeProfileId);
  }, [activeProfileId]);

  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = readString(StorageKeys.theme, DEFAULT_THEME);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  });

  const [appFont, setAppFontState] = useState<AppFont>(() => {
    const stored = readString(StorageKeys.font, DEFAULT_FONT);
    return normalizeFontId(stored);
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  /* Timers are tracked so they can be cleared on unmount. The previous
   * implementation left a dangling setTimeout per toast. */
  const toastTimers = useRef<Set<number>>(new Set());
  useEffect(
    () => () => {
      toastTimers.current.forEach((timer) => window.clearTimeout(timer));
      toastTimers.current.clear();
    },
    []
  );

  const showToast = useCallback((message: string) => {
    // crypto.randomUUID is collision-free; Math.random().toString(36) was not.
    const id = crypto.randomUUID();
    setToasts((previous) => [...previous, { id, message }].slice(-MAX_TOASTS));

    const timer = window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
      toastTimers.current.delete(timer);
    }, TOAST_DURATION_MS);
    toastTimers.current.add(timer);
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Local persistence                                                       */
  /* ---------------------------------------------------------------------- */

  /**
   * Persists the active profile's lists.
   *
   * These were two effects that each called `setProfiles` with `prev.map(...)`,
   * which always produced a new array -- even when nothing changed. One
   * watchlist mutation therefore wrote `cv:watchlist`, re-rendered with a fresh
   * `profiles` identity, fired the profiles effect and wrote `cv:profiles`, and
   * produced a new `syncSignature` that queued a cloud push. Now: one effect,
   * and `setProfiles` returns `prev` untouched when the lists already match, so
   * the cascade stops.
   */
  useEffect(() => {
    writeJSON(StorageKeys.watchlist, watchlist);
    writeJSON(StorageKeys.continueWatching, continueWatching);
    setProfiles((prev) => {
      const index = prev.findIndex((profile) => profile.id === activeProfileId);
      if (index === -1) return prev;
      const current = prev[index];
      if (current.watchlist === watchlist && current.continueWatching === continueWatching) {
        return prev;
      }
      const next = prev.slice();
      next[index] = { ...current, watchlist, continueWatching };
      return next;
    });
  }, [watchlist, continueWatching, activeProfileId]);

  useEffect(() => {
    const mode = LIGHT_THEME_IDS.has(theme) ? 'light' : 'dark';
    writeString(StorageKeys.theme, theme);
    // Persisted separately so the pre-paint script in index.html does not need
    // its own duplicated copy of the light-theme list.
    writeString(StorageKeys.themeMode, mode);

    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.classList.remove('light', 'dark');
    root.classList.add(mode);
    root.style.colorScheme = mode;
  }, [theme]);

  useEffect(() => {
    writeString(StorageKeys.font, appFont);
    document.documentElement.setAttribute('data-font', appFont);
    // Fetches the stylesheet the first time a face is used, so visitors do not
    // download all eight display families up front.
    loadAppFont(appFont);
  }, [appFont]);

  useEffect(() => {
    writeJSON(StorageKeys.profile, userProfile);
    const root = document.documentElement;
    root.classList.toggle('reduced-motion', Boolean(userProfile.reducedMotion));
    root.classList.toggle('no-film-grain', userProfile.filmGrain === false);
  }, [userProfile]);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Cloud sync                                                              */
  /* ---------------------------------------------------------------------- */

  /* Latest values in refs so the debounced sync and the auth listener can read
   * current state without being re-created on every change. */
  const latest = useRef({ watchlist, continueWatching, userProfile, profiles, activeProfileId, theme, appFont });
  useEffect(() => {
    latest.current = { watchlist, continueWatching, userProfile, profiles, activeProfileId, theme, appFont };
  }, [watchlist, continueWatching, userProfile, profiles, activeProfileId, theme, appFont]);

  const pushToCloud = useCallback(async () => {
    const { userProfile: profile, ...rest } = latest.current;
    if (!profile.isLoggedIn || !profile.uid) return;
    try {
      await syncService.saveUserData(profile.uid, {
        watchlist: rest.watchlist,
        continueWatching: rest.continueWatching,
        profile,
        profiles: rest.profiles,
        activeProfileId: rest.activeProfileId,
        theme: rest.theme,
        appFont: rest.appFont,
      });
    } catch {
      // saveUserData already logs. Sync is best-effort; local state is intact.
    }
  }, []);

  /* Debounced because the previous effect fired a full-document Firestore write
   * on every single state change -- toggling the theme five times meant five
   * whole-document writes. */
  const debouncedPush = useDebouncedCallback(pushToCloud, CLOUD_SYNC_DEBOUNCE_MS, {
    maxWait: 15_000,
  });

  /* A cheap signature of the syncable state. Depending on the objects directly
   * re-ran the effect whenever an unrelated re-render produced a new identity. */
  const syncSignature = useMemo(
    () =>
      JSON.stringify([
        watchlist.map((item) => `${item.movieId}:${item.status}`),
        continueWatching.map((item) => `${continueWatchingKey(item)}:${item.progress_percentage}`),
        profiles.map((p) => `${p.id}:${p.name}:${p.avatar}:${p.isKids}`),
        activeProfileId,
        theme,
        appFont,
        userProfile.isLoggedIn,
        userProfile.uid,
      ]),
    [watchlist, continueWatching, profiles, activeProfileId, theme, appFont, userProfile.isLoggedIn, userProfile.uid]
  );

  useEffect(() => {
    if (!userProfile.isLoggedIn || !userProfile.uid) return;
    debouncedPush();
  }, [syncSignature, userProfile.isLoggedIn, userProfile.uid, debouncedPush]);

  // Flush any pending write when the tab is hidden or closed.
  useEffect(() => {
    const flush = () => {
      if (debouncedPush.isPending()) debouncedPush.flush();
    };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [debouncedPush]);

  /* The service layer cannot read React state, so publish the signed-in flag its
   * consent check needs. */
  useEffect(() => {
    setSignedInHint(Boolean(userProfile.isLoggedIn));
  }, [userProfile.isLoggedIn]);

  /**
   * Directory entry for the current identity.
   *
   * Gated three ways where it used to be unconditional: the uid must be a real
   * Firebase uid (never the offline `local_` fallback), the cloud must be
   * reachable, and telemetry must be permitted. A guest who has not opted in now
   * gets no Firestore document at all -- previously every first paint wrote one.
   */
  useEffect(() => {
    const uid = userProfile.uid;
    if (!cloudAvailable || !uid || isLocalOnlyUid(uid)) return;
    if (!hasTelemetryConsent(Boolean(userProfile.isLoggedIn))) return;
    void watchTrackingService.recordUser({
      uid,
      displayName: userProfile.name || (userProfile.isLoggedIn ? 'User' : 'Guest Viewer'),
      photoURL: userProfile.avatar || null,
      isGuest: !userProfile.isLoggedIn,
    });
  }, [
    userProfile.uid,
    userProfile.name,
    userProfile.avatar,
    userProfile.isLoggedIn,
    cloudAvailable,
    telemetryConsent,
  ]);

  const hydrateFromCloud = useCallback(async (authUser: AuthUser) => {
    const { watchlist: localList, continueWatching: localContinue } = latest.current;
    try {
      const cloud = await syncService.loadUserData(authUser.uid);
      const merged = syncService.mergeData(
        localList,
        cloud?.watchlist ?? [],
        localContinue,
        cloud?.continueWatching ?? []
      );

      if (cloud?.profiles && cloud.profiles.length > 0) {
        setProfiles(cloud.profiles);
        const targetId = cloud.activeProfileId || cloud.profiles[0].id;
        setActiveProfileId(targetId);
        const active = cloud.profiles.find((p: any) => p.id === targetId) || cloud.profiles[0];
        setWatchlist(active.watchlist || []);
        setContinueWatching(active.continueWatching || []);
      } else {
        setWatchlist(merged.watchlist);
        setContinueWatching(merged.continueWatching);
      }
      
      if (cloud?.theme && isTheme(cloud.theme)) setThemeState(cloud.theme);
      if (cloud?.appFont) setAppFontState(normalizeFontId(cloud.appFont));

      setUserProfile((previous) => ({
        ...previous,
        ...cloud?.profile,
        uid: authUser.uid,
        name:
          authUser.displayName || cloud?.profile?.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email ?? previous.email ?? '',
        avatar: authUser.photoURL ?? previous.avatar ?? 'default',
        isLoggedIn: true,
      }));

      /* The directory entry is written by the consent-gated effect above, keyed
       * on uid. Calling `recordUser` here as well meant every sign-in produced
       * two identical Firestore writes, one of them bypassing the consent check. */
    } catch (error) {
      console.error('Could not load cloud data:', error);
    }
  }, []);

  /* Mirrored into a ref so the auth callback can read them without the
   * subscription being torn down and rebuilt on every change. */
  const cloudAvailableRef = useRef(cloudAvailable);
  useEffect(() => {
    cloudAvailableRef.current = cloudAvailable;
  }, [cloudAvailable]);
  const guestSignInInFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = authService.onAuthStateChanged((authUser) => {
      /* `undefined` means Firebase has not resolved the session yet. This
       * contract was documented but never implemented -- only null-or-user was
       * ever emitted, so the header flashed its signed-out state on every load
       * and then swapped. */
      if (authUser === undefined) {
        setAuthStatus('loading');
        return;
      }

      if (authUser === null) {
        setIsAdmin(false);
        setUserProfile((previous) => ({
          ...previous,
          uid: localGuestUid,
          isLoggedIn: false,
        }));

        /* Upgrade the guest to a Firebase anonymous session so they hold a real
         * uid. firestore.rules no longer carries the `uid.matches('^guest_.*')`
         * wildcard that made every guest's profile and history world-readable
         * and world-writable, so without this a guest has no cloud identity at
         * all -- which is the correct failure mode, but the upgrade is the
         * intended path. */
        if (cloudAvailableRef.current && !guestSignInInFlight.current) {
          guestSignInInFlight.current = true;
          void authService
            .signInAsGuest()
            .then((guest) => {
              if (cancelled) return;
              // Success re-enters this callback with the anonymous user.
              if (!guest) setCloudAvailable(false);
            })
            .finally(() => {
              guestSignInInFlight.current = false;
            });
        }

        setAuthStatus('signed-out');
        return;
      }

      /* An anonymous session is a guest: a real uid for scoping, but not an
       * account. `authStatus` stays 'signed-out' so the sign-in call to action
       * still shows and cloud sync stays off. */
      if (authUser.isAnonymous) {
        setIsAdmin(false);
        setAuthStatus('signed-out');
        setUserProfile((previous) => ({
          ...previous,
          uid: authUser.uid,
          isLoggedIn: false,
        }));
        return;
      }

      setAuthStatus('signed-in');
      setIsAdmin(authUser.isAdmin);
      setUserProfile((previous) => ({
        ...previous,
        uid: authUser.uid,
        name: authUser.displayName || authUser.email?.split('@')[0] || 'User',
        email: authUser.email ?? previous.email,
        avatar: authUser.photoURL ?? previous.avatar,
        isLoggedIn: true,
      }));

      void hydrateFromCloud(authUser);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [hydrateFromCloud, localGuestUid]);

  /* ---------------------------------------------------------------------- */
  /* Actions                                                                 */
  /* ---------------------------------------------------------------------- */

  const login = useCallback(async (email: string, password: string) => {
    await authService.login(email, password);
    // The auth listener performs hydration; doing it here too double-synced.
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await authService.register(name, email, password);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    await authService.loginWithGoogle();
  }, []);

  const logout = useCallback(async () => {
    // Flush pending changes before the session goes away.
    if (debouncedPush.isPending()) await debouncedPush.flush();
    await authService.logout();
    setIsAdmin(false);
    /* The library is cleared on sign-out. It used to be left in localStorage, so
     * on a shared device the next visitor inherited the previous account's
     * watchlist and Continue Watching row. The cloud copy is authoritative and
     * is restored on the next sign-in. */
    setWatchlist([]);
    setContinueWatching([]);
    setUserProfile(buildDefaultProfile(localGuestUid));
    remove(StorageKeys.profile);
    showToast('Signed out');
  }, [debouncedPush, localGuestUid, showToast]);

  const resetPassword = useCallback(async (email: string) => {
    await authService.resetPassword(email);
  }, []);

  const syncNow = useCallback(async () => {
    const profile = latest.current.userProfile;
    if (!profile.isLoggedIn || !profile.uid) {
      showToast('Sign in to sync your library');
      return;
    }
    debouncedPush.cancel();
    await pushToCloud();
    showToast('Library synced');
  }, [debouncedPush, pushToCloud, showToast]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const setAppFont = useCallback((next: AppFont) => setAppFontState(normalizeFontId(next)), []);

  const setOnboardingComplete = useCallback((value: boolean) => {
    setOnboardingCompleteState(value);
    writeString(StorageKeys.onboardingComplete, String(value));
  }, []);

  const setUserPreferences = useCallback((value: UserPreference[]) => {
    const sanitized = sanitizeUserPreferences(value);
    setUserPreferencesState(sanitized);
    writeJSON(StorageKeys.userPreferences, sanitized);
  }, []);

  /* All watchlist mutations use the updater form. Reading `watchlist` from the
   * enclosing scope meant two rapid updates lost one of them. The membership
   * test reads the ref rather than mutating a `let` from inside the updater --
   * React may invoke an updater twice, so that pattern was not safe to branch on. */
  const addToWatchlist = useCallback(
    (movie: Movie) => {
      if (latest.current.watchlist.some((item) => item.movieId === movie.id)) {
        showToast('Already in your list');
        return;
      }
      setWatchlist((previous) =>
        previous.some((item) => item.movieId === movie.id)
          ? previous
          : [
              ...previous,
              { movieId: movie.id, movie, addedAt: Date.now(), status: 'Not Started' as WatchStatus },
            ]
      );
      showToast('Added to your list');
    },
    [showToast]
  );

  const removeFromWatchlist = useCallback(
    (movieId: string) => {
      setWatchlist((previous) => previous.filter((item) => item.movieId !== movieId));
      showToast('Removed from your list');
    },
    [showToast]
  );

  const updateStatus = useCallback((movieId: string, status: WatchStatus) => {
    setWatchlist((previous) =>
      previous.map((item) => (item.movieId === movieId ? { ...item, status } : item))
    );
  }, []);

  /**
   * Replaces the entire list with a validated array. Backup files are
   * user-supplied JSON, so entries missing a `movieId`/`movie` are dropped
   * rather than trusted -- the old import path assigned `parsed.watchlist`
   * straight into state.
   */
  const replaceWatchlist = useCallback((items: WatchlistItem[]) => {
    if (!Array.isArray(items)) return;
    setWatchlist(
      items.filter(
        (item): item is WatchlistItem =>
          !!item && typeof item.movieId === 'string' && !!item.movie
      )
    );
  }, []);

  const clearWatchlist = useCallback(() => {
    setWatchlist([]);
    remove(StorageKeys.watchlist);
    showToast('Watchlist cleared');
  }, [showToast]);

  const clearContinueWatching = useCallback(() => {
    setContinueWatching([]);
    remove(StorageKeys.continueWatching);
    showToast('Watch history cleared');
  }, [showToast]);

  const removeContinueWatchingItem = useCallback(
    (
      id: string,
      mediaType?: 'movie' | 'tv' | 'anime',
      seasonNumber?: number,
      episodeNumber?: number
    ) => {
      setContinueWatching((previous) =>
        previous.filter((item) => {
          if (item.id !== id) return true;
          if (mediaType && item.media_type !== mediaType) return true;
          if (seasonNumber !== undefined && item.season_number !== seasonNumber) return true;
          if (episodeNumber !== undefined && item.episode_number !== episodeNumber) return true;
          return false;
        })
      );
      showToast('Removed from Continue Watching');
    },
    [showToast]
  );

  const removeFromContinueWatching = removeContinueWatchingItem;

  /**
   * Merges updates into the profile.
   *
   * The Firestore `recordUser` call that used to sit *inside* the `setUserProfile`
   * updater is gone: state updaters must be pure, and React may run them more
   * than once, so that fired duplicate network writes. The consent-gated effect
   * keyed on `userProfile.uid`/`name`/`avatar` covers it instead.
   */
  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setUserProfile((previous) => ({ ...previous, ...updates }));
  }, []);

  const clearProfile = useCallback(() => {
    setUserProfile(buildDefaultProfile(localGuestUid));
    remove(StorageKeys.profile);
  }, [localGuestUid]);

  /** Removes only this app's keys, not every key on the origin. */
  const resetAllLocalData = useCallback(() => {
    clearAppData();
    setWatchlist([]);
    setContinueWatching([]);
    setUserPreferencesState([]);
    setOnboardingCompleteState(false);
    setUserProfile(buildDefaultProfile(localGuestUid));
    setThemeState(DEFAULT_THEME);
    setAppFontState(DEFAULT_FONT);
    setTelemetryConsentState('unset');
  }, [localGuestUid]);

  const updateContinueWatching = useCallback((item: ContinueWatchingItem) => {
    setContinueWatching((previous) => {
      const key = continueWatchingKey(item);
      // Same identity function as the cloud merge, so local and remote agree
      // on what counts as "the same episode".
      const withoutItem = previous.filter((entry) => continueWatchingKey(entry) !== key);
      if (item.progress_percentage >= COMPLETION_THRESHOLD) return withoutItem;
      return [item, ...withoutItem]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_CONTINUE_WATCHING);
    });
  }, []);

  const isInWatchlist = useCallback(
    (movieId: string) => watchlist.some((item) => item.movieId === movieId),
    [watchlist]
  );

  /**
   * Switches the active profile.
   *
   * The body used to run inside a `setProfiles` updater purely to *read* the
   * profile list -- dispatching four other setState calls and a localStorage
   * write as side effects, then returning `currentProfiles` unchanged. Updaters
   * must be pure, and React may run them twice. The list is read from the ref
   * instead, and `activeProfileId` is persisted by its own effect rather than
   * being written a second time here.
   */
  const switchProfile = useCallback(
    (profileId: string) => {
      const target = latest.current.profiles.find((profile) => profile.id === profileId);
      if (!target) return;
      setActiveProfileId(profileId);
      setWatchlist(target.watchlist ?? []);
      setContinueWatching(target.continueWatching ?? []);
      if (target.theme && isTheme(target.theme)) setThemeState(target.theme);
      if (target.appFont) setAppFontState(normalizeFontId(target.appFont));
      showToast(`Switched to ${target.name}${target.isKids ? ' (Kids Mode)' : ''}`);
    },
    [showToast]
  );

  const createProfile = useCallback(
    (newProf: { name: string; avatar: string; isKids: boolean; maxAgeRating?: string }) => {
      const newId = `prof_${Date.now()}_${crypto.randomUUID().slice(0, 4)}`;
      const created: ProfileItem = {
        id: newId,
        name: newProf.name.trim() || 'New Profile',
        avatar: newProf.avatar || 'constellation-orion',
        isKids: Boolean(newProf.isKids),
        maxAgeRating: newProf.maxAgeRating || (newProf.isKids ? 'PG' : undefined),
        watchlist: [],
        continueWatching: [],
      };
      setProfiles((prev) => [...prev, created]);
      showToast(`Profile "${created.name}" created!`);
      return newId;
    },
    [showToast]
  );

  const updateProfile = useCallback(
    (profileId: string, updates: Partial<ProfileItem>) => {
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, ...updates } : p))
      );
      showToast('Profile updated');
    },
    [showToast]
  );

  /** Same pure-updater fix as `switchProfile`. */
  const deleteProfile = useCallback(
    (profileId: string) => {
      const current = latest.current.profiles;
      if (current.length <= 1) {
        showToast('Cannot delete the only profile');
        return;
      }
      const remaining = current.filter((profile) => profile.id !== profileId);
      if (remaining.length === current.length) return;

      setProfiles(remaining);
      if (latest.current.activeProfileId === profileId) {
        const next = remaining[0];
        setActiveProfileId(next.id);
        setWatchlist(next.watchlist ?? []);
        setContinueWatching(next.continueWatching ?? []);
      }
      showToast('Profile deleted');
    },
    [showToast]
  );

  const setTelemetryConsent = useCallback((state: 'granted' | 'denied') => {
    persistTelemetryConsent(state);
    setTelemetryConsentState(state);
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Personalised match score                                               */
  /* ---------------------------------------------------------------------- */

  /**
   * Genre affinity, weighted by how strong a signal each source is.
   *
   * `MovieCard` rendered `Math.min(99, Math.max(75, rating * 10 + 8))` and fell
   * back to a flat `96` for anything unrated -- a "% Match" with no relationship
   * to the viewer at all. This is derived from what they actually chose during
   * onboarding and what they put in their list.
   */
  const genreAffinity = useMemo<Record<string, number>>(() => {
    const scores: Record<string, number> = {};
    const bump = (genre: string, weight: number) => {
      const key = genre.trim().toLowerCase();
      if (!key) return;
      scores[key] = (scores[key] ?? 0) + weight;
    };

    for (const preference of userPreferences) bump(preference.label, 2);
    for (const item of watchlist) {
      const weight = item.status === 'Watched' ? 3 : item.status === 'In Progress' ? 2 : 1;
      for (const genre of item.movie?.genres ?? []) bump(genre, weight);
    }
    return scores;
  }, [userPreferences, watchlist]);

  const affinityTotal = useMemo(
    () => Object.values(genreAffinity).reduce((sum, value) => sum + value, 0),
    [genreAffinity]
  );

  const getMatchScore = useCallback(
    (movie: Movie): number | null => {
      const genres = movie.genres ?? [];
      // Nothing learned yet, or nothing to compare against: say nothing.
      if (affinityTotal === 0 || genres.length === 0) return null;

      const matched = genres.reduce(
        (sum, genre) => sum + (genreAffinity[genre.trim().toLowerCase()] ?? 0),
        0
      );
      if (matched === 0) return null;

      // Share of the viewer's total affinity this title's genres account for,
      // saturating so a two-genre title can still reach the top of the range.
      const affinity = Math.min(1, (matched / affinityTotal) * 2.5);
      const quality =
        typeof movie.rating === 'number' && movie.rating > 0 ? Math.min(1, movie.rating / 10) : 0.6;
      const blended = affinity * 0.65 + quality * 0.35;
      return Math.round(50 + blended * 49);
    },
    [affinityTotal, genreAffinity]
  );

  /* Memoised: this was an inline object literal, so every consumer of the
   * context re-rendered on any state change anywhere in the app. */
  const value = useMemo<AppContextType>(
    () => ({
      watchlist,
      addToWatchlist,
      removeFromWatchlist,
      updateStatus,
      replaceWatchlist,
      isInWatchlist,
      clearWatchlist,
      toasts,
      showToast,
      theme,
      setTheme,
      appFont,
      setAppFont,
      userProfile,
      updateUserProfile,
      clearProfile,
      resetAllLocalData,
      continueWatching,
      updateContinueWatching,
      clearContinueWatching,
      removeContinueWatchingItem,
      removeFromContinueWatching,
      profiles,
      activeProfileId,
      activeProfile,
      switchProfile,
      createProfile,
      updateProfile,
      deleteProfile,
      isKidsMode,
      deferredInstallPrompt,
      setDeferredInstallPrompt,
      onboardingComplete,
      setOnboardingComplete,
      userPreferences,
      setUserPreferences,
      ambientColor,
      setAmbientColor,
      authStatus,
      isAdmin,
      login,
      register,
      loginWithGoogle,
      logout,
      resetPassword,
      syncNow,
      cloudAvailable,
      getMatchScore,
      genreAffinity,
      telemetryConsent,
      setTelemetryConsent,
      authModalOpen,
      setAuthModalOpen,
      authModalMode,
      setAuthModalMode,
    }),
    [
      watchlist,
      addToWatchlist,
      removeFromWatchlist,
      updateStatus,
      replaceWatchlist,
      isInWatchlist,
      clearWatchlist,
      toasts,
      showToast,
      theme,
      setTheme,
      appFont,
      setAppFont,
      userProfile,
      updateUserProfile,
      clearProfile,
      resetAllLocalData,
      continueWatching,
      updateContinueWatching,
      clearContinueWatching,
      removeContinueWatchingItem,
      removeFromContinueWatching,
      profiles,
      activeProfileId,
      activeProfile,
      switchProfile,
      createProfile,
      updateProfile,
      deleteProfile,
      isKidsMode,
      deferredInstallPrompt,
      setDeferredInstallPrompt,
      onboardingComplete,
      setOnboardingComplete,
      userPreferences,
      setUserPreferences,
      ambientColor,
      setAmbientColor,
      authStatus,
      isAdmin,
      login,
      register,
      loginWithGoogle,
      logout,
      resetPassword,
      syncNow,
      cloudAvailable,
      getMatchScore,
      genreAffinity,
      telemetryConsent,
      setTelemetryConsent,
      authModalOpen,
      setAuthModalOpen,
      authModalMode,
      setAuthModalMode,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
