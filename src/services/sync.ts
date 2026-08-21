import { WatchlistItem, ContinueWatchingItem } from '../types';
import { UserProfile, Theme, AppFont } from '../store';
import { getAuthToken } from './auth';

export interface UserCloudData {
  watchlist: WatchlistItem[];
  continueWatching: ContinueWatchingItem[];
  profile: Partial<UserProfile>;
  theme?: Theme;
  appFont?: AppFont;
  updatedAt?: number;
}

export const syncService = {
  async saveUserData(userId: string, data: Partial<UserCloudData>): Promise<void> {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch('/api/sync/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          watchlist: data.watchlist || [],
          continueWatching: data.continueWatching || [],
          profile: data.profile || {},
          theme: data.theme,
          appFont: data.appFont,
        }),
      });

      if (!response.ok) {
        console.warn('Backend sync save warning:', response.statusText);
      }
    } catch (err) {
      console.warn('Network sync error:', err);
    }
  },

  async loadUserData(userId: string): Promise<UserCloudData | null> {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const response = await fetch('/api/sync/data', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return null;

      const data = await response.json();
      return {
        watchlist: data.watchlist || [],
        continueWatching: data.continueWatching || [],
        profile: {
          language: data.settings?.language,
          defaultServer: data.settings?.default_server,
          audioPreference: data.settings?.audio_preference,
          filmGrain: data.settings?.film_grain === 1,
          logoStyle: data.settings?.logo_style,
          showSpoilers: data.settings?.show_spoilers === 1,
          autoPlayNext: data.settings?.auto_play_next === 1,
          reducedMotion: data.settings?.reduced_motion === 1,
        },
        theme: data.settings?.theme,
        appFont: data.settings?.app_font,
      };
    } catch (err) {
      console.warn('Network load user data error:', err);
      return null;
    }
  },

  async deleteWatchlistItem(movieId: string): Promise<void> {
    const token = getAuthToken();
    if (!token) return;

    try {
      await fetch(`/api/sync/watchlist/${encodeURIComponent(movieId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.warn('Delete watchlist item sync error:', err);
    }
  },

  mergeData(
    localWatchlist: WatchlistItem[],
    cloudWatchlist: WatchlistItem[] = [],
    localContinue: ContinueWatchingItem[],
    cloudContinue: ContinueWatchingItem[] = []
  ): { watchlist: WatchlistItem[]; continueWatching: ContinueWatchingItem[] } {
    // Merge Watchlist by unique movieId
    const watchlistMap = new Map<string, WatchlistItem>();
    for (const item of cloudWatchlist) {
      if (item.movieId) watchlistMap.set(item.movieId, item);
    }
    for (const item of localWatchlist) {
      if (item.movieId) {
        const existing = watchlistMap.get(item.movieId);
        if (!existing || (item.addedAt && item.addedAt >= (existing.addedAt || 0))) {
          watchlistMap.set(item.movieId, item);
        }
      }
    }

    // Merge Continue Watching by unique key
    const continueMap = new Map<string, ContinueWatchingItem>();
    const getKey = (i: ContinueWatchingItem) => `${i.id}_${i.season_number || 0}_${i.episode_number || 0}`;

    for (const item of cloudContinue) {
      if (item.id) continueMap.set(getKey(item), item);
    }
    for (const item of localContinue) {
      if (item.id) {
        const existing = continueMap.get(getKey(item));
        if (!existing || (item.timestamp && item.timestamp >= (existing.timestamp || 0))) {
          continueMap.set(getKey(item), item);
        }
      }
    }

    return {
      watchlist: Array.from(watchlistMap.values()),
      continueWatching: Array.from(continueMap.values()),
    };
  }
};
