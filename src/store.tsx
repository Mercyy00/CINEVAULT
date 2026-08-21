import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { WatchlistItem, WatchStatus, ContinueWatchingItem } from './types';
import { authService, AuthUser } from './services/auth';
import { syncService } from './services/sync';

export type Theme = 
  | 'cinematic-dark' 
  | 'butter-green' 
  | 'cherry-cola' 
  | 'bistre-aureolin' 
  | 'vibrant-lime' 
  | 'imperial-violet' 
  | 'midnight-ocean' 
  | 'crimson-premiere' 
  | 'neon-cyberpunk' 
  | 'elegant-light' 
  | 'clean-daylight'
  | 'vanilla-cherry'
  | 'nordic-frost'
  | 'matcha-cream'
  | 'sunset-rose';

export type AppFont = 
  | 'bricolage' 
  | 'dinko' 
  | 'inklab' 
  | 'gunken' 
  | 'odida' 
  | 'melodrama' 
  | 'talina' 
  | 'grind';

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

export interface Toast {
  id: string;
  message: string;
}

interface AppContextType {
  watchlist: WatchlistItem[];
  setWatchlist: React.Dispatch<React.SetStateAction<WatchlistItem[]>>;
  addToWatchlist: (movie: any) => void;
  removeFromWatchlist: (movieId: string) => void;
  updateStatus: (movieId: string, status: WatchStatus) => void;
  isInWatchlist: (movieId: string) => boolean;
  clearWatchlist: () => void;
  toasts: Toast[];
  showToast: (msg: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  appFont: AppFont;
  setAppFont: (font: AppFont) => void;
  userProfile: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  clearProfile: () => void;
  continueWatching: ContinueWatchingItem[];
  updateContinueWatching: (item: ContinueWatchingItem) => void;
  deferredInstallPrompt: any;
  setDeferredInstallPrompt: React.Dispatch<React.SetStateAction<any>>;
  onboardingComplete: boolean;
  setOnboardingComplete: (val: boolean) => void;
  userPreferences: string[];
  ambientColor: string | null;
  setAmbientColor: (color: string | null) => void;
  setUserPreferences: (val: string[]) => void;
  
  // Real Auth & Cloud Sync
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  syncNow: () => Promise<void>;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalMode: 'signin' | 'signup' | 'forgot';
  setAuthModalMode: (mode: 'signin' | 'signup' | 'forgot') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const stored = localStorage.getItem('cv_watchlist');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>(() => {
    try {
      const stored = localStorage.getItem('cinevault_continue_watching');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  const [onboardingComplete, setOnboardingCompleteState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cinevault_onboarding_complete') === 'true';
    } catch {
      return false;
    }
  });

  const [ambientColor, setAmbientColor] = useState<string | null>(null);
  const [userPreferences, setUserPreferencesState] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('user_preferences');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const setOnboardingComplete = (val: boolean) => {
    setOnboardingCompleteState(val);
    localStorage.setItem('cinevault_onboarding_complete', String(val));
  };

  const setUserPreferences = (val: string[]) => {
    setUserPreferencesState(val);
    localStorage.setItem('user_preferences', JSON.stringify(val));
  };
  
  const defaultProfile: UserProfile = {
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

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem('cinevault_user');
      return stored ? { ...defaultProfile, ...JSON.parse(stored) } : defaultProfile;
    } catch {
      return defaultProfile;
    }
  });
  
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('cv_theme') as Theme) || 'cinematic-dark';
    } catch {
      return 'cinematic-dark';
    }
  });

  const [appFont, setAppFontState] = useState<AppFont>(() => {
    try {
      return (localStorage.getItem('cv_font') as AppFont) || 'bricolage';
    } catch {
      return 'bricolage';
    }
  });
  
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((msg: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => {
      const next = [...prev, { id, message: msg }];
      if (next.length > 3) {
        return next.slice(next.length - 3);
      }
      return next;
    });
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    localStorage.setItem('cv_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem('cinevault_continue_watching', JSON.stringify(continueWatching));
  }, [continueWatching]);

  const LIGHT_THEMES: Theme[] = [
    'elegant-light',
    'clean-daylight',
    'vanilla-cherry',
    'nordic-frost',
    'matcha-cream',
    'sunset-rose'
  ];

  useEffect(() => {
    localStorage.setItem('cv_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (LIGHT_THEMES.includes(theme)) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('cv_font', appFont);
    document.documentElement.setAttribute('data-font', appFont);
  }, [appFont]);

  useEffect(() => {
    localStorage.setItem('cinevault_user', JSON.stringify(userProfile));
    if (userProfile.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
    if (userProfile.filmGrain === false) {
      document.documentElement.classList.add('no-film-grain');
    } else {
      document.documentElement.classList.remove('no-film-grain');
    }
  }, [userProfile]);

  // Sync to Cloud automatically when logged in
  const syncToCloud = useCallback(async (
    uid: string, 
    wList: WatchlistItem[], 
    cWatch: ContinueWatchingItem[], 
    prof: UserProfile, 
    th: Theme, 
    font: AppFont
  ) => {
    if (!uid) return;
    try {
      await syncService.saveUserData(uid, {
        watchlist: wList,
        continueWatching: cWatch,
        profile: prof,
        theme: th,
        appFont: font,
      });
    } catch (err) {
      console.warn('Auto cloud sync failed:', err);
    }
  }, []);

  useEffect(() => {
    if (userProfile.isLoggedIn && userProfile.uid) {
      syncToCloud(userProfile.uid, watchlist, continueWatching, userProfile, theme, appFont);
    }
  }, [watchlist, continueWatching, userProfile, theme, appFont, syncToCloud]);

  // Handle post-login data hydration and merging
  const handleAuthUserSync = useCallback(async (authUser: AuthUser) => {
    try {
      const cloudData = await syncService.loadUserData(authUser.uid);
      const merged = syncService.mergeData(
        watchlist, 
        cloudData?.watchlist || [], 
        continueWatching, 
        cloudData?.continueWatching || []
      );

      setWatchlist(merged.watchlist);
      setContinueWatching(merged.continueWatching);

      if (cloudData?.theme) setThemeState(cloudData.theme);
      if (cloudData?.appFont) setAppFontState(cloudData.appFont);

      setUserProfile(prev => ({
        ...prev,
        ...cloudData?.profile,
        uid: authUser.uid,
        name: authUser.displayName || prev.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || prev.email || '',
        avatar: authUser.photoURL || prev.avatar || 'default',
        isLoggedIn: true,
      }));

      // Immediately save back the merged state to ensure cloud is up to date
      await syncService.saveUserData(authUser.uid, {
        watchlist: merged.watchlist,
        continueWatching: merged.continueWatching,
        profile: {
          name: authUser.displayName || userProfile.name,
          email: authUser.email || userProfile.email,
        },
        theme: cloudData?.theme || theme,
        appFont: cloudData?.appFont || appFont,
      });
    } catch (err) {
      console.error('Error hydrating user cloud data:', err);
    }
  }, [watchlist, continueWatching, theme, appFont, userProfile.name, userProfile.email]);

  // Listen to auth state
  useEffect(() => {
    const unsub = authService.onAuthStateChanged((authUser) => {
      if (authUser) {
        setUserProfile(prev => ({
          ...prev,
          uid: authUser.uid,
          name: authUser.displayName || prev.name,
          email: authUser.email || prev.email,
          avatar: authUser.photoURL || prev.avatar,
          isLoggedIn: true,
        }));
      }
    });
    return () => unsub();
  }, []);

  const login = async (email: string, pass: string) => {
    const authUser = await authService.login(email, pass);
    await handleAuthUserSync(authUser);
  };

  const register = async (name: string, email: string, pass: string) => {
    const authUser = await authService.register(name, email, pass);
    await handleAuthUserSync(authUser);
  };

  const loginWithGoogle = async () => {
    const authUser = await authService.loginWithGoogle();
    await handleAuthUserSync(authUser);
  };

  const logout = async () => {
    await authService.logout();
    setUserProfile(defaultProfile);
    showToast('Signed out successfully');
  };

  const resetPassword = async (email: string) => {
    await authService.resetPassword(email);
  };

  const syncNow = async () => {
    if (!userProfile.isLoggedIn || !userProfile.uid) {
      showToast('Please sign in to sync with the cloud');
      return;
    }
    await syncToCloud(userProfile.uid, watchlist, continueWatching, userProfile, theme, appFont);
    showToast('Cloud sync complete');
  };

  const setAppFont = (font: AppFont) => {
    setAppFontState(font);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const addToWatchlist = (movie: any) => {
    if (!watchlist.find(i => i.movieId === movie.id)) {
      setWatchlist([...watchlist, { movieId: movie.id, movie, addedAt: Date.now(), status: 'Not Started' }]);
      showToast('Added to Watchlist');
    }
  };

  const removeFromWatchlist = (movieId: string) => {
    setWatchlist(watchlist.filter(i => i.movieId !== movieId));
    showToast('Removed from Watchlist');
  };

  const updateStatus = (movieId: string, status: WatchStatus) => {
    setWatchlist(watchlist.map(i => i.movieId === movieId ? { ...i, status } : i));
  };

  const isInWatchlist = (movieId: string) => {
    return watchlist.some(i => i.movieId === movieId);
  };

  const clearWatchlist = () => {
    setWatchlist([]); 
    setContinueWatching([]);
    showToast('Watchlist cleared');
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...updates }));
  };

  const clearProfile = () => {
    setUserProfile(defaultProfile);
    localStorage.removeItem('cinevault_user');
  };

  const updateContinueWatching = (item: ContinueWatchingItem) => {
    setContinueWatching(prev => {
      if (item.progress_percentage > 95) {
        return prev.filter(i => i.id !== item.id);
      }
      const existingIdx = prev.findIndex(i => i.id === item.id);
      let next = [...prev];
      if (existingIdx !== -1) {
        next[existingIdx] = item;
      } else {
        next.unshift(item);
      }
      next.sort((a, b) => b.timestamp - a.timestamp);
      return next.slice(0, 20); // Keep max 20 items
    });
  };

  return (
    <AppContext.Provider value={{
      watchlist, setWatchlist, addToWatchlist, removeFromWatchlist, updateStatus, isInWatchlist, clearWatchlist, toasts, showToast, theme, setTheme,
      appFont, setAppFont,
      userProfile, updateUserProfile, clearProfile, continueWatching, updateContinueWatching, deferredInstallPrompt, setDeferredInstallPrompt, onboardingComplete, setOnboardingComplete, userPreferences, setUserPreferences, ambientColor, setAmbientColor,
      login, register, loginWithGoogle, logout, resetPassword, syncNow,
      authModalOpen, setAuthModalOpen, authModalMode, setAuthModalMode
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
