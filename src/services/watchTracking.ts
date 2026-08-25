import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { getFirebase } from './firebase';
import { readJSON, writeJSON } from '../lib/storage';

/**
 * Watch-session telemetry.
 *
 * What changed and why:
 *
 * - **No more PII.** The previous version recorded `email`, `deviceInfo`,
 *   `browserInfo`, `screenSize`, `timezone` and `document.referrer` for every
 *   visitor, including guests who never signed up, with no notice and no way
 *   to opt out. A watch-progress feature needs none of it. What remains is a
 *   uid, a display name the user chose, and what they watched.
 * - **No client-written `role`.** The client used to send `role: 'admin'`,
 *   which any user could forge. Admin is a server-minted custom claim.
 * - **Writes are throttled.** `logWatchProgress` fired three Firestore writes
 *   every five seconds of playback (~2,160 writes/hour/viewer). It now
 *   coalesces to one write per document per 30 s, plus an immediate flush on
 *   pause/complete.
 * - **Errors are not silently swallowed.** Six empty `catch {}` blocks meant a
 *   permissions failure looked identical to success.
 */

export interface WatchSession {
  id: string;
  uid: string;
  userName: string;
  userAvatar?: string | null;
  mediaId: string;
  mediaType: 'movie' | 'tv' | 'anime';
  title: string;
  seriesName?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  /** Playback position in seconds. */
  currentTime: number;
  /** Total runtime in seconds. 0 when unknown -- never guess. */
  duration: number;
  progressPercentage: number;
  status: 'watching' | 'paused' | 'completed';
  createdAt: number;
  updatedAt: number;
}

export interface UserProfileDoc {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  isGuest?: boolean;
  createdAt: number;
  lastActiveAt: number;
}

const LOCAL_SESSIONS_KEY = 'cv:localWatchSessions';
const MAX_LOCAL_SESSIONS = 100;
const MAX_LIVE_SESSIONS = 100;
const MAX_USERS = 200;

/** One remote write per session per this interval, unless forced. */
const WRITE_THROTTLE_MS = 30_000;

function getLocalSessions(): WatchSession[] {
  return readJSON<WatchSession[]>(LOCAL_SESSIONS_KEY, [], Array.isArray);
}

function saveLocalSessions(sessions: WatchSession[]): void {
  writeJSON(LOCAL_SESSIONS_KEY, sessions.slice(0, MAX_LOCAL_SESSIONS));
}

/** sessionId -> epoch ms of the last remote write. */
const lastWriteAt = new Map<string, number>();

function buildSessionId(uid: string, mediaType: string, mediaId: string, season = 0, episode = 0) {
  return `${uid}_${mediaType}_${mediaId}_s${season}_e${episode}`;
}

export const watchTrackingService = {
  /**
   * Records playback progress locally, and remotely at most once per
   * `WRITE_THROTTLE_MS` unless `flush` is set (pause, seek, completion, unload).
   */
  async logWatchProgress(
    session: Omit<WatchSession, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
    flush = false
  ): Promise<void> {
    const season = session.seasonNumber ?? 0;
    const episode = session.episodeNumber ?? 0;
    const sessionId =
      session.id ?? buildSessionId(session.uid, session.mediaType, session.mediaId, season, episode);
    const now = Date.now();

    const progressPercentage =
      session.duration > 0
        ? Math.min(100, Math.max(0, Math.round((session.currentTime / session.duration) * 1000) / 10))
        : (session.progressPercentage ?? 0);

    const local = getLocalSessions();
    const existingIndex = local.findIndex((entry) => entry.id === sessionId);
    const createdAt = existingIndex >= 0 ? local[existingIndex].createdAt : now;

    const fullSession: WatchSession = {
      ...session,
      id: sessionId,
      progressPercentage,
      createdAt,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      local[existingIndex] = fullSession;
    } else {
      local.unshift(fullSession);
    }
    saveLocalSessions(local);

    const since = now - (lastWriteAt.get(sessionId) ?? 0);
    if (!flush && since < WRITE_THROTTLE_MS) return;

    const { db } = getFirebase();
    if (!db) return;

    lastWriteAt.set(sessionId, now);

    try {
      await Promise.all([
        setDoc(doc(db, 'watch_sessions', sessionId), fullSession, { merge: true }),
        session.uid
          ? setDoc(doc(db, 'users', session.uid, 'history', sessionId), fullSession, { merge: true })
          : Promise.resolve(),
      ]);
    } catch (error) {
      // Allow the next tick to retry rather than pinning the throttle window.
      lastWriteAt.delete(sessionId);
      console.error('Watch session write failed:', error);
    }
  },

  /**
   * Upserts the signed-in user's directory entry.
   *
   * Only fields the user has themselves provided (display name, avatar) are
   * stored. No email, device fingerprint, screen size, timezone or referrer.
   */
  async recordUser(user: {
    uid: string;
    displayName: string | null;
    photoURL?: string | null;
    isGuest?: boolean;
  }): Promise<void> {
    const { db } = getFirebase();
    if (!db || !user.uid) return;

    const now = Date.now();
    const reference = doc(db, 'users', user.uid);

    try {
      // `createdAt` is written only when the document is new. Including it in
      // every merge overwrote the original signup date on each sign-in.
      const existing = await getDoc(reference);
      await setDoc(
        reference,
        {
          uid: user.uid,
          displayName: user.displayName || 'Cinephile',
          photoURL: user.photoURL ?? null,
          isGuest: user.isGuest ?? false,
          lastActiveAt: now,
          ...(existing.exists() ? {} : { createdAt: now }),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('recordUser failed:', error);
    }
  },

  /** Live view of recent sessions. Admin-only per the Firestore rules. */
  subscribeToActiveSessions(
    onData: (sessions: WatchSession[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    onData(getLocalSessions());

    const { db } = getFirebase();
    if (!db) return () => {};

    const q = query(
      collection(db, 'watch_sessions'),
      orderBy('updatedAt', 'desc'),
      limit(MAX_LIVE_SESSIONS)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const sessions = snapshot.docs.map((entry) => entry.data() as WatchSession);
        saveLocalSessions(sessions);
        onData(sessions);
      },
      (error) => {
        console.error('watch_sessions subscription failed:', error);
        onError?.(error);
      }
    );
  },

  /**
   * Live view of the user directory.
   *
   * Bounded and ordered. The previous version subscribed to the entire `users`
   * collection with no limit, so the payload grew without bound and the client
   * paid for a full read of every user document on every change.
   */
  subscribeToUsers(
    onData: (users: UserProfileDoc[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const { db } = getFirebase();
    if (!db) {
      onData([]);
      return () => {};
    }

    const q = query(collection(db, 'users'), orderBy('lastActiveAt', 'desc'), limit(MAX_USERS));

    return onSnapshot(
      q,
      (snapshot) => {
        onData(
          snapshot.docs.map((entry) => {
            const data = entry.data() as UserProfileDoc;
            return { ...data, uid: data.uid || entry.id };
          })
        );
      },
      (error) => {
        console.error('users subscription failed:', error);
        onError?.(error);
      }
    );
  },

  /**
   * Watch history for one user.
   *
   * Reads the user's own `history` subcollection, then falls back to the global
   * collection filtered by uid. The old implementation also queried by email
   * and synthesised entries out of `user_sync`, inventing a `duration: 7200`
   * ("every unknown title is exactly two hours") for anything without one.
   */
  async getUserWatchHistory(uid: string): Promise<WatchSession[]> {
    const results = new Map<string, WatchSession>();

    for (const session of getLocalSessions()) {
      if (session.uid === uid) results.set(session.id, session);
    }

    const { db } = getFirebase();
    if (!db || !uid) return sortByRecency(results);

    try {
      const historySnapshot = await getDocs(
        query(collection(db, 'users', uid, 'history'), orderBy('updatedAt', 'desc'), limit(200))
      );
      historySnapshot.forEach((entry) => {
        const data = entry.data() as WatchSession;
        results.set(data.id ?? entry.id, data);
      });
    } catch (error) {
      console.error('History subcollection read failed:', error);
    }

    try {
      const globalSnapshot = await getDocs(
        query(collection(db, 'watch_sessions'), where('uid', '==', uid), limit(200))
      );
      globalSnapshot.forEach((entry) => {
        const data = entry.data() as WatchSession;
        results.set(data.id ?? entry.id, data);
      });
    } catch (error) {
      console.error('watch_sessions read failed:', error);
    }

    return sortByRecency(results);
  },

  async deleteSession(sessionId: string): Promise<void> {
    saveLocalSessions(getLocalSessions().filter((entry) => entry.id !== sessionId));
    lastWriteAt.delete(sessionId);

    const { db } = getFirebase();
    if (!db) return;

    try {
      await deleteDoc(doc(db, 'watch_sessions', sessionId));
    } catch (error) {
      console.error('Delete session failed:', error);
      throw error;
    }
  },
};

function sortByRecency(map: Map<string, WatchSession>): WatchSession[] {
  return Array.from(map.values()).sort(
    (a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)
  );
}
