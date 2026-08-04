import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WatchlistItem, WatchStatus, ContinueWatchingItem } from './types';

export type Theme = 'cinematic-dark' | 'midnight-ocean' | 'crimson-premiere' | 'neon-cyberpunk' | 'elegant-light' | 'clean-daylight';

export interface UserProfile {
  name: string;
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
    name: '',
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
  
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    localStorage.setItem('cv_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem('cinevault_continue_watching', JSON.stringify(continueWatching));
  }, [continueWatching]);

  useEffect(() => {
    localStorage.setItem('cv_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('cinevault_user', JSON.stringify(userProfile));
    if (userProfile.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }, [userProfile]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const showToast = (msg: string) => {
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
    setWatchlist([]); setContinueWatching([]);
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
      userProfile, updateUserProfile, clearProfile, continueWatching, updateContinueWatching, deferredInstallPrompt, setDeferredInstallPrompt, onboardingComplete, setOnboardingComplete, userPreferences, setUserPreferences, ambientColor, setAmbientColor
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
