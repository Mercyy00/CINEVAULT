import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  ExternalLink,
  Film,
  Lock,
  Search,
  ShieldCheck,
  Trash2,
  Tv,
  Unlock,
  Users,
  X,
} from 'lucide-react';
import {
  watchTrackingService,
  type UserProfileDoc,
  type WatchSession,
} from '../services/watchTracking';
import { isFirebaseConfigured } from '../services/firebase';
import { useApp } from '../store';
import { cn } from '../lib/utils';
import { formatDuration } from '../types';
import { PosterImage } from './PosterImage';
import { isBirthdayLocallyEnabled, setBirthdayLocallyEnabled, isBirthdayBuildEnabled } from '../config/birthdayAccess';

/**
 * Admin dashboard.
 *
 * Authorisation changed completely. The previous gate hashed a typed passcode
 * with SHA-256 in the browser and compared it against three hardcoded digests,
 * then set `sessionStorage.cv_admin_authenticated = 'true'`. Both halves were
 * decorative: the digests shipped in the bundle and were brute-forceable
 * offline, and anyone could set the sessionStorage flag from the console. It
 * also gated nothing real — the Firestore reads underneath it succeeded or
 * failed on their own rules regardless of what the UI showed.
 *
 * Access is now the `admin` custom claim on the Firebase ID token, minted
 * server-side, which is the same thing the Firestore security rules check. If
 * the claim is absent the reads fail, and the UI says so instead of pretending.
 *
 * The Firebase config modal is gone with it: letting the client rewrite the
 * project's credentials at runtime was a backend-repointing vector.
 */

const LIVE_WINDOW_MS = 5 * 60 * 1000;
const WATCHING_NOW_MS = 3 * 60 * 1000;
const COMPLETION_THRESHOLD = 90;
const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w200';

type SessionFilter = 'all' | 'movie' | 'tv' | 'anime';

function posterSrc(path: string | null | undefined): string | null {
  if (!path) return null;
  return path.startsWith('http') ? path : `${TMDB_POSTER_BASE}${path}`;
}

function formatRelative(timestamp: number | undefined): string {
  if (!timestamp) return 'Unknown';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

/** Renders a position as "12:04", or an em dash when the duration is unknown. */
function formatPosition(session: WatchSession): string {
  const position = formatDuration(session.currentTime);
  return session.duration > 0 ? `${position} / ${formatDuration(session.duration)}` : position;
}

export function AdminDashboard() {
  const { showToast, isAdmin, authStatus, userProfile, loginWithGoogle } = useApp();

  const [activeSessions, setActiveSessions] = useState<WatchSession[]>([]);
  const [users, setUsers] = useState<UserProfileDoc[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfileDoc | null>(null);
  const [userWatchHistory, setUserWatchHistory] = useState<WatchSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>('all');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'registered' | 'guest'>('all');
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [birthdayEnabled, setBirthdayEnabled] = useState(isBirthdayLocallyEnabled);

  useEffect(() => {
    if (!isAdmin) return;
    setSubscriptionError(null);

    // Errors surface instead of leaving the dashboard silently empty, which is
    // exactly what a missing admin claim looked like before.
    const onError = (error: Error) => setSubscriptionError(error.message);

    const unsubscribeSessions = watchTrackingService.subscribeToActiveSessions(
      setActiveSessions,
      onError
    );
    const unsubscribeUsers = watchTrackingService.subscribeToUsers(setUsers, onError);

    return () => {
      unsubscribeSessions();
      unsubscribeUsers();
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedUser) {
      setUserWatchHistory([]);
      return;
    }

    let active = true;
    setLoadingHistory(true);

    watchTrackingService
      .getUserWatchHistory(selectedUser.uid)
      .then((history) => {
        if (active) setUserWatchHistory(history);
      })
      .catch((cause) => {
        console.error('Failed to load user watch history:', cause);
        if (active) setUserWatchHistory([]);
      })
      .finally(() => {
        if (active) setLoadingHistory(false);
      });

    return () => {
      active = false;
    };
  }, [selectedUser]);

  const handleToggleBirthday = () => {
    const next = !birthdayEnabled;
    setBirthdayEnabled(next);
    setBirthdayLocallyEnabled(next);
    showToast(
      next ? 'Birthday section is visible in this browser' : 'Birthday section is hidden again'
    );
  };

  const handleDeleteSession = useCallback(
    async (id: string) => {
      try {
        await watchTrackingService.deleteSession(id);
        showToast('Watch session removed');
      } catch {
        // The service already logged the cause.
        showToast('Could not remove that session');
      }
    },
    [showToast]
  );

  const now = Date.now();

  const liveCount = useMemo(
    () => activeSessions.filter((session) => now - session.updatedAt < LIVE_WINDOW_MS).length,
    [activeSessions, now]
  );

  const completedCount = useMemo(
    () =>
      activeSessions.filter(
        (session) =>
          session.status === 'completed' || session.progressPercentage >= COMPLETION_THRESHOLD
      ).length,
    [activeSessions]
  );

  const filteredSessions = useMemo(
    () =>
      sessionFilter === 'all'
        ? activeSessions
        : activeSessions.filter((session) => session.mediaType === sessionFilter),
    [activeSessions, sessionFilter]
  );

  const filteredUsers = useMemo(() => {
    let result = users;
    if (userTypeFilter === 'registered') {
      result = result.filter((u) => !u.isGuest);
    } else if (userTypeFilter === 'guest') {
      result = result.filter((u) => u.isGuest);
    }
    const term = userSearch.trim().toLowerCase();
    if (!term) return result;
    return result.filter(
      (user) =>
        user.displayName.toLowerCase().includes(term) || user.uid.toLowerCase().includes(term)
    );
  }, [users, userSearch, userTypeFilter]);

  /* ---------------------------------------------------------------------- */
  /* Gate                                                                   */
  /* ---------------------------------------------------------------------- */

  if (authStatus === 'loading') {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background"
        role="status"
        aria-label="Checking permissions"
      >
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center bg-background text-foreground">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md p-8 rounded-3xl bg-card border border-border shadow-2xl text-center backdrop-blur-xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand/15 border border-brand/30 flex items-center justify-center text-brand mx-auto mb-5">
            <ShieldCheck className="w-8 h-8" aria-hidden="true" />
          </div>

          <h1 className="text-2xl font-display font-black mb-2">Admin access required</h1>
          <p className="text-sm text-muted-foreground mb-6">
            This dashboard is restricted to accounts with the <code>admin</code> claim. The claim is
            granted server-side; signing in is not sufficient on its own.
          </p>

          {authStatus === 'signed-out' ? (
            <button
              type="button"
              onClick={() => void loginWithGoogle()}
              className="w-full py-3 bg-brand text-background font-bold text-sm rounded-xl hover:opacity-95 transition-opacity cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" aria-hidden="true" />
              <span>Sign in</span>
            </button>
          ) : (
            <p className="text-xs text-muted-foreground font-mono px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              Signed in as {userProfile.name || 'unknown'} — no admin claim on this account.
            </p>
          )}

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center text-xs">
            <button
              type="button"
              onClick={() => {
                window.location.hash = '#home';
              }}
              className="text-brand hover:underline font-semibold"
            >
              Return home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Dashboard                                                              */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 sm:px-8 max-w-7xl mx-auto w-full text-foreground space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-brand/20 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-brand/20 text-brand border border-brand/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1',
                  isFirebaseConfigured()
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                )}
              >
                <Database className="w-3 h-3" aria-hidden="true" />
                <span>{isFirebaseConfigured() ? 'Firestore connected' : 'Local only'}</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black truncate">
              Watch activity
            </h1>
          </div>
        </div>

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleToggleBirthday}
              aria-pressed={birthdayEnabled}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border',
                birthdayEnabled
                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 hover:bg-pink-500/30'
                  : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10'
              )}
              title="Local-only display toggle for the birthday section"
            >
              {birthdayEnabled ? (
                <Unlock className="w-3.5 h-3.5 text-pink-400" aria-hidden="true" />
              ) : (
                <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>Birthday section: {birthdayEnabled ? 'shown (local)' : 'hidden (local)'}</span>
            </button>
            {isBirthdayBuildEnabled && (
              <p className="text-[10px] text-amber-400/80 max-w-[200px] leading-tight">
                VITE_ENABLE_BIRTHDAY is true. Section is visible globally, overriding this toggle.
              </p>
            )}
          </div>
      </header>

      {subscriptionError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-sm text-red-200 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-bold mb-1">Firestore rejected a read.</p>
            <p className="font-mono text-xs opacity-80 break-words">{subscriptionError}</p>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Users"
          value={users.length}
          hint="In the directory"
          icon={<Users className="w-6 h-6" aria-hidden="true" />}
          tone="brand"
        />
        <MetricCard
          label="Watching now"
          value={liveCount}
          hint="Updated in the last 5 minutes"
          icon={<Activity className="w-6 h-6" aria-hidden="true" />}
          tone="emerald"
        />
        <MetricCard
          label="Sessions"
          value={activeSessions.length}
          hint="Most recent 100"
          icon={<Tv className="w-6 h-6" aria-hidden="true" />}
          tone="purple"
        />
        <MetricCard
          label="Completed"
          value={completedCount}
          hint={`${COMPLETION_THRESHOLD}% or more watched`}
          icon={<CheckCircle2 className="w-6 h-6" aria-hidden="true" />}
          tone="amber"
        />
      </div>

      {/* Sessions */}
      <section className="space-y-4" aria-label="Watch sessions">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-display font-black">
            Watch sessions ({filteredSessions.length})
          </h2>

          <div
            className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-semibold"
            role="group"
            aria-label="Filter by media type"
          >
            {(['all', 'movie', 'tv', 'anime'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSessionFilter(option)}
                aria-pressed={sessionFilter === option}
                className={cn(
                  'px-3 py-1 rounded-lg capitalize transition-colors cursor-pointer',
                  sessionFilter === option
                    ? 'bg-brand text-background font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-card border border-border text-muted-foreground">
            <Film className="w-10 h-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
            <p className="text-sm font-semibold">No watch sessions recorded.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 list-none m-0 p-0">
            {filteredSessions.map((session) => {
              const watchingNow = now - session.updatedAt < WATCHING_NOW_MS;
              const complete =
                session.status === 'completed' ||
                session.progressPercentage >= COMPLETION_THRESHOLD;

              return (
                <motion.li
                  key={session.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-card border border-border hover:border-brand/40 transition-colors flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center font-bold text-brand text-xs uppercase shrink-0">
                        {session.userName?.charAt(0) || 'U'}
                      </div>
                      {/* The second line here used to be the viewer's email
                          address. Telemetry no longer collects it. */}
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">
                          {session.userName || 'Anonymous'}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">
                          {session.uid || 'no uid'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0',
                        watchingNow
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white/5 text-muted-foreground border border-white/10'
                      )}
                    >
                      {watchingNow ? 'Active' : formatRelative(session.updatedAt)}
                    </span>
                  </div>

                  <div className="flex gap-3 items-start">
                    <div className="w-14 h-20 rounded-xl overflow-hidden shrink-0 border border-border">
                      <PosterImage
                        src={posterSrc(session.posterPath)}
                        title={session.title}
                        decorative
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-brand/10 text-brand font-mono font-bold text-[9px] uppercase">
                          {session.mediaType}
                        </span>
                        {session.seasonNumber ? (
                          <span className="text-[10px] font-mono text-brand font-bold bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                            S{session.seasonNumber} E{session.episodeNumber ?? '?'}
                          </span>
                        ) : session.episodeNumber ? (
                          <span className="text-[10px] font-mono text-brand font-bold bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                            E{session.episodeNumber}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="text-sm font-bold truncate">{session.title}</h3>

                      {/* One progress readout. The previous markup rendered the
                          same numbers twice, in two different formats, stacked. */}
                      <div className="mt-2 text-[11px] font-mono font-semibold flex items-center justify-between gap-2">
                        <span className={complete ? 'text-emerald-400' : 'text-amber-400'}>
                          {complete
                            ? 'Completed'
                            : `${Math.round(session.progressPercentage)}%`}
                        </span>
                        <span className="text-muted-foreground truncate">
                          {formatPosition(session)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.round(session.progressPercentage)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${session.title} progress`}
                  >
                    <div
                      className="h-full bg-brand rounded-full transition-[width] duration-500"
                      style={{ width: `${Math.min(100, session.progressPercentage)}%` }}
                    />
                  </div>

                  <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash =
                          session.mediaType === 'anime'
                            ? `#watch/ani/${session.mediaId}/${session.episodeNumber || 1}`
                            : session.mediaType === 'tv'
                              ? `#watch/tv/${session.mediaId}/${session.seasonNumber || 1}/${session.episodeNumber || 1}`
                              : `#watch/movie/${session.mediaId}`;
                      }}
                      className="text-brand hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      <span>Open</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDeleteSession(session.id)}
                      className="text-muted-foreground hover:text-red-400 transition-colors p-1"
                      aria-label={`Delete session for ${session.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Directory */}
      <section className="space-y-4 pt-4" aria-label="User directory">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg sm:text-xl font-display font-black flex items-center gap-2.5">
              <Users className="w-5 h-5 text-brand" aria-hidden="true" />
              Users ({filteredUsers.length})
            </h2>

            <div
              className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-semibold"
              role="group"
              aria-label="Filter by user type"
            >
              <button
                type="button"
                onClick={() => setUserTypeFilter('all')}
                aria-pressed={userTypeFilter === 'all'}
                className={cn(
                  'px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px]',
                  userTypeFilter === 'all'
                    ? 'bg-brand text-background font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                All ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setUserTypeFilter('registered')}
                aria-pressed={userTypeFilter === 'registered'}
                className={cn(
                  'px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px]',
                  userTypeFilter === 'registered'
                    ? 'bg-brand text-background font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Accounts ({users.filter((u) => !u.isGuest).length})
              </button>
              <button
                type="button"
                onClick={() => setUserTypeFilter('guest')}
                aria-pressed={userTypeFilter === 'guest'}
                className={cn(
                  'px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px]',
                  userTypeFilter === 'guest'
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-amber-400/80 hover:text-amber-300'
                )}
              >
                Guests ({users.filter((u) => u.isGuest).length})
              </button>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <label className="sr-only" htmlFor="admin-user-search">
              Search users
            </label>
            <input
              id="admin-user-search"
              type="search"
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Name or uid…"
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-foreground text-xs focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Registered users, most recently active first</caption>
            <thead className="bg-white/5 border-b border-border text-muted-foreground font-mono uppercase text-[10px]">
              <tr>
                <th scope="col" className="py-3 px-4">
                  User
                </th>
                <th scope="col" className="py-3 px-4">
                  UID
                </th>
                <th scope="col" className="py-3 px-4">
                  Type
                </th>
                <th scope="col" className="py-3 px-4">
                  Joined
                </th>
                <th scope="col" className="py-3 px-4">
                  Last active
                </th>
                <th scope="col" className="py-3 px-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No users match that search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center font-bold text-brand text-xs uppercase shrink-0">
                          {user.displayName?.charAt(0) || 'U'}
                        </div>
                        <span className="font-bold">{user.displayName || 'Unnamed'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono">{user.uid}</td>
                    <td className="py-3 px-4">
                      {/* Was a `role` badge fed by a client-written field, so
                          any user could label themselves "admin". Admin is a
                          server-side claim and is not stored here at all. */}
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase',
                          user.isGuest
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-white/5 text-muted-foreground'
                        )}
                      >
                        {user.isGuest ? 'guest' : 'account'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground font-mono">
                      {formatRelative(user.lastActiveAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedUser(user)}
                        className="px-2.5 py-1 rounded-lg bg-brand/10 hover:bg-brand text-brand hover:text-background font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        History
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* History drawer */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedUser(null)}
            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`Watch history for ${selectedUser.displayName}`}
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-2xl bg-card border border-border rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between gap-3 pb-4 border-b border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-brand/20 border border-brand/30 flex items-center justify-center font-bold text-brand text-lg shrink-0">
                    {selectedUser.displayName?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold truncate">{selectedUser.displayName}</h3>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {selectedUser.uid}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  aria-label="Close history"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* The device / browser / screen-size / timezone badge row that
                  used to sit here is gone: none of it is collected any more. */}

              <div className="flex-1 overflow-y-auto py-4 space-y-3 custom-scrollbar min-h-[250px]">
                {loadingHistory ? (
                  <div
                    className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground text-xs"
                    role="status"
                  >
                    <div className="w-7 h-7 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                    <span>Loading history…</span>
                  </div>
                ) : userWatchHistory.length === 0 ? (
                  <div className="text-center py-14 text-muted-foreground text-sm space-y-1">
                    <Film className="w-10 h-10 mx-auto mb-2 opacity-30 text-brand" aria-hidden="true" />
                    <p className="font-semibold text-foreground">No watch records</p>
                  </div>
                ) : (
                  <ul className="space-y-3 list-none m-0 p-0">
                    {userWatchHistory.map((session) => {
                      const complete =
                        session.status === 'completed' ||
                        session.progressPercentage >= COMPLETION_THRESHOLD;
                      return (
                        <li
                          key={session.id}
                          className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-3 min-w-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                                <PosterImage
                                  src={posterSrc(session.posterPath)}
                                  title={session.title}
                                  decorative
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                  <span className="px-1.5 py-0.5 rounded bg-brand/15 text-brand font-mono font-bold text-[9px] uppercase">
                                    {session.mediaType}
                                  </span>
                                  {session.seasonNumber ? (
                                    <span className="text-[10px] font-mono text-brand font-bold bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                                      S{session.seasonNumber} E{session.episodeNumber ?? '?'}
                                    </span>
                                  ) : null}
                                </div>
                                <p className="font-bold truncate text-sm">{session.title}</p>
                                <p className="text-muted-foreground font-mono mt-1 text-[11px]">
                                  {formatPosition(session)}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {formatRelative(session.updatedAt || session.createdAt)}
                              </span>
                              <span
                                className={cn(
                                  'px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase',
                                  complete
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                )}
                              >
                                {complete
                                  ? 'Completed'
                                  : `${Math.round(session.progressPercentage)}%`}
                              </span>
                            </div>
                          </div>

                          <div
                            className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden"
                            role="progressbar"
                            aria-valuenow={Math.round(session.progressPercentage)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${session.title} progress`}
                          >
                            <div
                              className="h-full bg-brand rounded-full"
                              style={{
                                width: `${Math.max(2, Math.min(100, session.progressPercentage))}%`,
                              }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TONES = {
  brand: 'bg-brand/15 text-brand',
  emerald: 'bg-emerald-500/15 text-emerald-400',
  purple: 'bg-purple-500/15 text-purple-400',
  amber: 'bg-amber-500/15 text-amber-400',
} as const;

function MetricCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
  tone: keyof typeof TONES;
}) {
  return (
    <div className="p-5 rounded-2xl bg-card/70 border border-border flex items-center justify-between gap-3">
      <div className="min-w-0">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
          {label}
        </span>
        <p className="text-3xl font-display font-black mt-1">{value}</p>
        <span className="text-[11px] text-muted-foreground mt-1 block">{hint}</span>
      </div>
      <div
        className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', TONES[tone])}
      >
        {icon}
      </div>
    </div>
  );
}
