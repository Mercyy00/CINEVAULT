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
