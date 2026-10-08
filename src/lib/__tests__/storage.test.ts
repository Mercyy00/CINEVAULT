import { describe, it, expect, beforeEach } from 'vitest';
import { runStorageMigrations, StorageKeys } from '../storage';

describe('runStorageMigrations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('migrates legacy keys to cv: namespace', () => {
    localStorage.setItem('cv_watchlist', '["movie_1"]');
    localStorage.setItem('cv_guest_uid', 'guest_123');

    runStorageMigrations();

    expect(localStorage.getItem(StorageKeys.watchlist)).toBe('["movie_1"]');
    expect(localStorage.getItem(StorageKeys.guestUid)).toBe('guest_123');
    // should remove old keys
    expect(localStorage.getItem('cv_watchlist')).toBeNull();
    expect(localStorage.getItem('cv_guest_uid')).toBeNull();
  });

  it('removes obsolete keys', () => {
    localStorage.setItem('cv_firebase_api_key', 'old_key');
    localStorage.setItem('cv_admin_authenticated', 'true');

    runStorageMigrations();

    expect(localStorage.getItem('cv_firebase_api_key')).toBeNull();
    expect(localStorage.getItem('cv_admin_authenticated')).toBeNull();
  });

  it('is idempotent (running twice doesn\'t break anything)', () => {
    localStorage.setItem('cv_watchlist', '["movie_1"]');
    
    runStorageMigrations();
    runStorageMigrations();

    expect(localStorage.getItem(StorageKeys.watchlist)).toBe('["movie_1"]');
    expect(localStorage.getItem('cv_watchlist')).toBeNull();
  });

  it('sets schema version', () => {
    runStorageMigrations();
    expect(localStorage.getItem('cv:schemaVersion')).toBe('2');
  });
});

describe('download history storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns empty array when no downloads have been saved', async () => {
    const { getDownloadHistory } = await import('../storage');
    expect(getDownloadHistory()).toEqual([]);
  });

  it('saves and retrieves download items with timestamps', async () => {
    const { addDownloadHistoryItem, getDownloadHistory } = await import('../storage');

    addDownloadHistoryItem({
      id: 'dl-1',
      mediaId: '101',
      title: 'Inception',
      type: 'movie',
      quality: '1080p',
      provider: 'VidVault',
    });

    const items = getDownloadHistory();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('dl-1');
    expect(items[0].title).toBe('Inception');
    expect(items[0].quality).toBe('1080p');
    expect(typeof items[0].downloadedAt).toBe('number');
  });

  it('deduplicates identical downloads and moves newest to the front', async () => {
    const { addDownloadHistoryItem, getDownloadHistory } = await import('../storage');

    addDownloadHistoryItem({
      id: 'dl-1',
      mediaId: '101',
      title: 'Inception',
      type: 'movie',
      quality: '1080p',
    });

    addDownloadHistoryItem({
      id: 'dl-2',
      mediaId: '202',
      title: 'Interstellar',
      type: 'movie',
      quality: '4K',
    });

    // Re-download inception with same quality
    addDownloadHistoryItem({
      id: 'dl-1-again',
      mediaId: '101',
      title: 'Inception',
      type: 'movie',
      quality: '1080p',
    });

    const items = getDownloadHistory();
    expect(items).toHaveLength(2);
    expect(items[0].mediaId).toBe('101');
    expect(items[0].id).toBe('dl-1-again');
    expect(items[1].mediaId).toBe('202');
  });

  it('caps history list at 50 items max', async () => {
    const { addDownloadHistoryItem, getDownloadHistory } = await import('../storage');

    for (let i = 0; i < 60; i += 1) {
      addDownloadHistoryItem({
        id: `dl-${i}`,
        mediaId: `media-${i}`,
        title: `Movie ${i}`,
        type: 'movie',
        quality: '1080p',
      });
    }

    const items = getDownloadHistory();
    expect(items).toHaveLength(50);
    expect(items[0].mediaId).toBe('media-59');
  });

  it('clears download history completely', async () => {
    const { addDownloadHistoryItem, clearDownloadHistory, getDownloadHistory } = await import('../storage');

    addDownloadHistoryItem({
      id: 'dl-1',
      mediaId: '101',
      title: 'Inception',
      type: 'movie',
    });

    expect(getDownloadHistory()).toHaveLength(1);
    clearDownloadHistory();
    expect(getDownloadHistory()).toEqual([]);
  });
});

describe('getStorageEstimate', () => {
  it('formats storage metrics correctly when navigator.storage is available', async () => {
    const { getStorageEstimate } = await import('../storage');

    const originalStorage = navigator.storage;
    Object.defineProperty(navigator, 'storage', {
      value: {
        estimate: async () => ({
          usage: 100 * 1024 * 1024, // 100 MB
          quota: 10 * 1024 * 1024 * 1024, // 10 GB
        }),
      },
      configurable: true,
    });

    const result = await getStorageEstimate();
    expect(result).not.toBeNull();
    expect(result?.formattedUsage).toBe('100.0 MB');
    expect(result?.formattedQuota).toBe('10.00 GB');
    expect(result?.usagePercent).toBeCloseTo(1, 0);

    // Restore
    Object.defineProperty(navigator, 'storage', {
      value: originalStorage,
      configurable: true,
    });
  });
});
