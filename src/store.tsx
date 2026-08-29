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
import { isAppFontId, loadAppFont, type AppFontId } from './lib/fonts';
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

// Migrate legacy localStorage keys before any state initialiser reads them.
runStorageMigrations();

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
/** Above this, a title counts as finished and leaves the continue row. */
const COMPLETION_THRESHOLD = 95;

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
  removeContinueWatchingItem: (id: string, mediaType?: 'movie' | 'tv' | 'anime') => void;
  
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

function createGuestUid(): string {
  const existing = readString(StorageKeys.guestUid, '');
  if (existing) return existing;
  const generated = `guest_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  writeString(StorageKeys.guestUid, generated);
  return generated;
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
    logoStyle: 'vault',
    showSpoilers: false,
    autoPlayNext: true,
    reducedMotion: false,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
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

  /* The guest uid is generated once, in a ref, rather than by calling a
   * localStorage-writing helper inside a `defaultProfile` object that was
   * rebuilt on every render. Writing to storage during render is a side effect
   * that React may run twice or discard under concurrent rendering. */
  const guestUidRef = useRef<string>('');
  if (!guestUidRef.current) guestUidRef.current = createGuestUid();

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const fallback = buildDefaultProfile(guestUidRef.current);
    const stored = readJSON<Partial<UserProfile>>(
      StorageKeys.profile,
      {},
      (value) => typeof value === 'object' && value !== null
    );
    return { ...fallback, ...stored, uid: stored.uid || fallback.uid };
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
    return isAppFontId(stored) ? stored : DEFAULT_FONT;
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

  useEffect(() => {
    writeJSON(StorageKeys.watchlist, watchlist);
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === activeProfileId ? { ...p, watchlist } : p
      )
    );
  }, [watchlist, activeProfileId]);

  useEffect(() => {
    writeJSON(StorageKeys.continueWatching, continueWatching);
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === activeProfileId ? { ...p, continueWatching } : p
      )
    );
  }, [continueWatching, activeProfileId]);

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

  // Keep all users (including guests) recorded in the directory for real-time tracking
  useEffect(() => {
    const uid = userProfile.uid || guestUidRef.current;
    if (!uid) return;
    void watchTrackingService.recordUser({
      uid,
      displayName: userProfile.name || (userProfile.isLoggedIn ? 'User' : 'Guest Viewer'),
      photoURL: userProfile.avatar || null,
      isGuest: !userProfile.isLoggedIn,
    });
  }, [userProfile.uid, userProfile.name, userProfile.avatar, userProfile.isLoggedIn]);

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
      if (cloud?.appFont && isAppFontId(cloud.appFont)) setAppFontState(cloud.appFont);

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

      /* recordUser no longer sends a role. Admin is a server-minted custom
       * claim; letting the client write `role: 'admin'` to its own document was
       * a privilege-escalation hole. */
      await watchTrackingService.recordUser({
        uid: authUser.uid,
        displayName: authUser.displayName,
        photoURL: authUser.photoURL,
      });
    } catch (error) {
      console.error('Could not load cloud data:', error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((authUser) => {
      if (!authUser) {
        setAuthStatus('signed-out');
        setIsAdmin(false);
        setUserProfile((previous) => ({
          ...previous,
          uid: guestUidRef.current,
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

    return unsubscribe;
  }, [hydrateFromCloud]);

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
    setUserProfile(buildDefaultProfile(guestUidRef.current));
    setIsAdmin(false);
    showToast('Signed out');
  }, [debouncedPush, showToast]);

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
  const setAppFont = useCallback((next: AppFont) => setAppFontState(next), []);

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
   * enclosing scope meant two rapid updates lost one of them. */
  const addToWatchlist = useCallback(
    (movie: Movie) => {
      let added = false;
      setWatchlist((previous) => {
        if (previous.some((item) => item.movieId === movie.id)) return previous;
        added = true;
        return [...previous, { movieId: movie.id, movie, addedAt: Date.now(), status: 'Not Started' }];
      });
      // Deferred so the toast is not queued during the state update.
      queueMicrotask(() => showToast(added ? 'Added to your list' : 'Already in your list'));
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
    (id: string, mediaType?: 'movie' | 'tv' | 'anime') => {
      setContinueWatching((previous) =>
        previous.filter((item) => {
          if (mediaType) {
            return !(item.id === id && item.media_type === mediaType);
          }
          return item.id !== id;
        })
      );
      showToast('Removed from watch history');
    },
    [showToast]
  );

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setUserProfile((previous) => {
      const updated = { ...previous, ...updates };
      const uid = updated.uid || guestUidRef.current;
      if (uid) {
        void watchTrackingService.recordUser({
          uid,
          displayName: updated.name || (updated.isLoggedIn ? 'User' : 'Guest Viewer'),
          photoURL: updated.avatar || null,
          isGuest: !updated.isLoggedIn,
        });
      }
      return updated;
    });
  }, []);

  const clearProfile = useCallback(() => {
    setUserProfile(buildDefaultProfile(guestUidRef.current));
    remove(StorageKeys.profile);
  }, []);

  /** Removes only this app's keys, not every key on the origin. */
  const resetAllLocalData = useCallback(() => {
    clearAppData();
    setWatchlist([]);
    setContinueWatching([]);
    setUserPreferencesState([]);
    setOnboardingCompleteState(false);
    setUserProfile(buildDefaultProfile(createGuestUid()));
    setThemeState(DEFAULT_THEME);
    setAppFontState(DEFAULT_FONT);
  }, []);

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

  const switchProfile = useCallback((profileId: string) => {
    setProfiles((currentProfiles) => {
      const target = currentProfiles.find((p) => p.id === profileId);
      if (!target) return currentProfiles;
      setActiveProfileId(profileId);
      writeString(StorageKeys.activeProfileId, profileId);
      setWatchlist(target.watchlist || []);
      setContinueWatching(target.continueWatching || []);
      if (target.theme && isTheme(target.theme)) setThemeState(target.theme);
      if (target.appFont && isAppFontId(target.appFont)) setAppFontState(target.appFont);
      showToast(`Switched to ${target.name}${target.isKids ? ' (Kids Mode)' : ''}`);
      return currentProfiles;
    });
  }, [showToast]);

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

  const deleteProfile = useCallback(
    (profileId: string) => {
      setProfiles((prev) => {
        if (prev.length <= 1) {
          showToast('Cannot delete the only profile');
          return prev;
        }
        const filtered = prev.filter((p) => p.id !== profileId);
        if (activeProfileId === profileId) {
          const nextActive = filtered[0].id;
          setActiveProfileId(nextActive);
          writeString(StorageKeys.activeProfileId, nextActive);
          setWatchlist(filtered[0].watchlist || []);
          setContinueWatching(filtered[0].continueWatching || []);
        }
        showToast('Profile deleted');
        return filtered;
      });
    },
    [activeProfileId, showToast]
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
      profiles,
      activeProfileId,
      activeProfile,
      switchProfile,
      createProfile,
      updateProfile,
      deleteProfile,
      isKidsMode,
      deferredInstallPrompt,
      onboardingComplete,
      setOnboardingComplete,
      userPreferences,
      setUserPreferences,
      ambientColor,
      authStatus,
      isAdmin,
      login,
      register,
      loginWithGoogle,
      logout,
      resetPassword,
      syncNow,
      authModalOpen,
      authModalMode,
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
