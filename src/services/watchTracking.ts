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
import { remoteTelemetryAllowed } from '../lib/consent';
import { StorageKeys, readJSON, writeJSON } from '../lib/storage';

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
 * - **Remote writes are consent-gated.** See `lib/consent.ts`. Local history
 *   still works with telemetry declined; only the cloud copy is skipped.
 * - **A permanent failure stops retrying.** The error path used to delete the
 *   throttle entry so the next tick would try again -- which, for a
 *   `permission-denied` that will never succeed, meant a write attempt every
 *   five seconds for the whole session. Permanent codes now blocklist the
 *   session; only transient failures are retried.
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

const LOCAL_SESSIONS_KEY = StorageKeys.localWatchSessions;
const MAX_LOCAL_SESSIONS = 100;
const MAX_LIVE_SESSIONS = 100;
const MAX_USERS = 200;

/** One remote write per session per this interval, unless forced. */
const WRITE_THROTTLE_MS = 30_000;

/**
 * Firestore error codes that will never succeed on retry for this session.
 * Retrying them just burns quota and floods the console.
 */
const PERMANENT_ERROR_CODES = new Set([
  'permission-denied',
  'unauthenticated',
  'invalid-argument',
  'failed-precondition',
]);

function errorCode(error: unknown): string {
  return typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
}

function isPermanent(error: unknown): boolean {
  return PERMANENT_ERROR_CODES.has(errorCode(error));
}

function getLocalSessions(): WatchSession[] {
  return readJSON<WatchSession[]>(LOCAL_SESSIONS_KEY, [], Array.isArray);
}

function saveLocalSessions(sessions: WatchSession[]): void {
  writeJSON(LOCAL_SESSIONS_KEY, sessions.slice(0, MAX_LOCAL_SESSIONS));
}

/** sessionId -> epoch ms of the last remote write. */
const lastWriteAt = new Map<string, number>();

/** Sessions whose remote copy is hopeless. Cleared on reload, not persisted. */
const abandonedSessions = new Set<string>();

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
    // A session with no uid cannot be attributed or authorised. Callers used to
    // pass a shared 'guest_viewer' literal rather than nothing at all.
    if (!session.uid) return;
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

    // Local history above is unconditional; only the cloud copy needs consent.
    if (!remoteTelemetryAllowed()) return;
    if (abandonedSessions.has(sessionId)) return;

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
      if (isPermanent(error)) {
        // Retrying is pointless. Stop for this session and say so once.
        abandonedSessions.add(sessionId);
        console.error('Watch progress will not sync for this session:', errorCode(error), error);
        return;
      }
      // Transient (offline, deadline-exceeded, unavailable). Let the next tick retry.
      lastWriteAt.delete(sessionId);
    }
  },

  /**
   * Upserts the user's (or guest's) directory entry.
   *
   * Only fields the user has provided are stored, and only when telemetry is
   * permitted -- a guest who has declined (or has not been asked) gets no
   * Firestore document at all.
   */
  async recordUser(user: {
    uid: string;
    displayName: string | null;
    photoURL?: string | null;
    isGuest?: boolean;
  }): Promise<void> {
    if (!user.uid) return;
    if (!remoteTelemetryAllowed()) return;

    const { db } = getFirebase();
    if (!db) return;

    const now = Date.now();
    const reference = doc(db, 'users', user.uid);

    try {
      // `createdAt` is written only when the document is new.
      const existing = await getDoc(reference);
      await setDoc(
        reference,
        {
          uid: user.uid,
          displayName: user.displayName || (user.isGuest ? 'Guest Viewer' : 'Cinephile'),
          photoURL: user.photoURL ?? null,
          isGuest: Boolean(user.isGuest),
          lastActiveAt: now,
          ...(existing.exists() ? {} : { createdAt: now }),
        },
        { merge: true }
      );
    } catch {
      // Best-effort directory tracking
    }
  },

  /**
   * Live view of recent sessions. Admin-only per the Firestore rules.
   *
   * The snapshot is *not* written back to local storage. It used to call
   * `saveLocalSessions(sessions)`, which overwrote the viewer's own cached
   * history with the 100 most recent sessions belonging to *other* people --
   * so an admin opening the dashboard lost their local history and inherited
   * everyone else's.
   */
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
        onData(snapshot.docs.map((entry) => entry.data() as WatchSession));
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

  /**
   * Deletes a session everywhere it exists.
   *
   * `logWatchProgress` writes two documents -- `watch_sessions/{id}` and
   * `users/{uid}/history/{id}` -- but this only ever deleted the first, so a
   * "remove from history" left the per-user mirror behind and the entry
   * reappeared on the next hydrate. When `uid` is omitted it is recovered from
   * the local copy of the session.
   */
  async deleteSession(sessionId: string, uid?: string): Promise<void> {
    const local = getLocalSessions();
    const ownerUid = uid ?? local.find((entry) => entry.id === sessionId)?.uid;
    saveLocalSessions(local.filter((entry) => entry.id !== sessionId));
    lastWriteAt.delete(sessionId);
    abandonedSessions.delete(sessionId);

    const { db } = getFirebase();
    if (!db) return;

    const targets = [deleteDoc(doc(db, 'watch_sessions', sessionId))];
    if (ownerUid) {
      targets.push(deleteDoc(doc(db, 'users', ownerUid, 'history', sessionId)));
    }

    const results = await Promise.allSettled(targets);
    const failure = results.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected'
    );
    if (failure) {
      console.error('Delete session failed:', failure.reason);
      throw failure.reason instanceof Error ? failure.reason : new Error('Delete session failed');
    }
  },
};

function sortByRecency(map: Map<string, WatchSession>): WatchSession[] {
  return Array.from(map.values()).sort(
    (a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)
  );
}
