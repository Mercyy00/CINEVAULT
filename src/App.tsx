import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MovieRow } from './components/MovieRow';
import { FilterBar } from './components/FilterBar';
import { SearchOverlay } from './components/SearchOverlay';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider, useApp } from './store';
import { api, kitsuApi } from './api';
import { CinematicIntro } from './components/CinematicIntro';
import { ContinueWatchingRow } from './components/ContinueWatchingRow';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthModal } from './components/AuthModal';
import { BirthdayMusicProvider } from './context/BirthdayMusicContext';
import { goToDetail } from './lib/navigation';
import { isBirthdayVisible, rememberBirthdayUnlock } from './config/birthdayAccess';

const MovieDetail = lazy(() =>
  import('./components/MovieDetail').then((m) => ({ default: m.MovieDetail }))
);
const AnimeDetail = lazy(() =>
  import('./components/AnimeDetail').then((m) => ({ default: m.AnimeDetail }))
);
const PlayerPage = lazy(() =>
  import('./components/PlayerPage').then((m) => ({ default: m.PlayerPage }))
);
const AnimePlayer = lazy(() =>
  import('./components/AnimePlayer').then((m) => ({ default: m.AnimePlayer }))
);
const PageShell = lazy(() =>
  import('./components/PageShell').then((m) => ({ default: m.PageShell }))
);
const MyList = lazy(() => import('./components/MyList').then((m) => ({ default: m.MyList })));
const ProfilePage = lazy(() =>
  import('./components/ProfilePage').then((m) => ({ default: m.ProfilePage }))
);
const MoodFinderOverlay = lazy(() =>
  import('./components/MoodFinderOverlay').then((m) => ({ default: m.MoodFinderOverlay }))
);
const BirthdayPage = lazy(() =>
  import('./components/BirthdayPage').then((m) => ({ default: m.BirthdayPage }))
);
const AdminDashboard = lazy(() =>
  import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);

interface HomeFilters {
  type: string;
  country: string;
  providerId?: string;
  genreId?: string;
  language?: string;
}

const INTRO_KEY = 'cv:introPlayed';

const ROUTE_TITLES: Record<string, string> = {
  home: 'CineVault — Stream movies, TV and anime',
  movies: 'Movies — CineVault',
  tvshows: 'TV Shows — CineVault',
  anime: 'Anime — CineVault',
  mylist: 'My Watchlist — CineVault',
  birthday: 'Birthday — CineVault',
  admin: 'Watch activity — CineVault',
  profile: 'Profile — CineVault',
};

function documentTitleFor(route: string, searchQuery: string): string {
  if (ROUTE_TITLES[route]) return ROUTE_TITLES[route];
  if (route === 'search') return `Search: ${searchQuery} — CineVault`;
  if (route.startsWith('watch/')) return 'Now playing — CineVault';
  if (/^(movie|tv|ani|detail)\//.test(route)) return 'CineVault';
  return 'Not found — CineVault';
}

function RouteLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background"
      role="status"
      aria-label="Loading page"
    >
      <div className="w-10 h-10 border-4 border-brand/30 border-t-brand rounded-full animate-spin" />
    </div>
  );
}

function AppContent() {
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [isSurprising, setIsSurprising] = useState(false);
  const [surprisingGenre, setSurprisingGenre] = useState('');
  const [homeFilters, setHomeFilters] = useState<HomeFilters>({ type: 'movie', country: 'US' });
  const [showResetModal, setShowResetModal] = useState(false);
  const [lastBaseRoute, setLastBaseRoute] = useState<string>('home');

  const {
    ambientColor,
    toasts,
    userPreferences,
    authModalOpen,
    setAuthModalOpen,
    authModalMode,
    resetAllLocalData,
  } = useApp();

  const anyOverlayOpen = isSearchOpen || isMoodOpen || showResetModal || authModalOpen;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        !!target &&
        (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable);

      if (typing) {
        if (event.key === 'Escape') target.blur();
        return;
      }

      if (event.key === 'Escape') {
        if (isSearchOpen) setIsSearchOpen(false);
        if (isMoodOpen) setIsMoodOpen(false);
        if (showResetModal) setShowResetModal(false);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        window.location.hash = '#admin';
        return;
      }

      // Backspace used to call history.back() unconditionally, so pressing it
      // anywhere outside a text field navigated away -- including with a modal
      // open, and including inside contenteditable regions and selects, which
      // the old INPUT/TEXTAREA check missed.
      if (event.key === 'Backspace' && !anyOverlayOpen) {
        window.history.back();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isMoodOpen, showResetModal, anyOverlayOpen]);

  useEffect(() => {
    const handleReset = () => setShowResetModal(true);
    window.addEventListener('trigger-reset', handleReset);
    return () => window.removeEventListener('trigger-reset', handleReset);
  }, []);

  useEffect(() => {
    document.title = documentTitleFor(currentRoute, searchQuery);
  }, [currentRoute, searchQuery]);

  const [introDone, setIntroDone] = useState(
    () =>
      sessionStorage.getItem(INTRO_KEY) === 'true' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const handleIntroComplete = useCallback(() => {
    setIntroDone(true);
    sessionStorage.setItem(INTRO_KEY, 'true');
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      if (hash.startsWith('search/')) {
        setCurrentRoute('search');
        setSearchQuery(decodeURIComponent(hash.replace('search/', '')));
        setLastBaseRoute('search');
      } else {
        if (hash !== 'profile') setLastBaseRoute(hash);
        setCurrentRoute(hash);
      }
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  /**
   * The birthday route used to redirect from inside the render function via
   * `setTimeout(..., 10)` and write to localStorage in the same breath. Both
   * are side effects, so both belong here.
   */
  const birthdayVisible = currentRoute === 'birthday' && isBirthdayVisible();

  useEffect(() => {
    if (currentRoute !== 'birthday') return;
    if (isBirthdayVisible()) {
      rememberBirthdayUnlock();
    } else {
      window.location.replace('#home');
    }
  }, [currentRoute]);

  useEffect(() => {
    let cancelled = false;

    const handleSurpriseMe = async () => {
      setIsSurprising(true);
      try {
        const type = Math.random() > 0.5 ? 'movie' : 'tv';
        const genresRes = await api.getGenres(type);
        const genres = genresRes.genres ?? [];
        const randomGenre = genres[Math.floor(Math.random() * genres.length)];
        if (!cancelled) setSurprisingGenre(randomGenre ? randomGenre.name : 'hidden gem');

        const discoverRes = await api.discover(type, {
          with_genres: randomGenre?.id,
          'vote_average.gte': 7.5,
          sort_by: 'popularity.desc',
        });

        const results = discoverRes.results ?? [];
        if (results.length === 0) {
          if (!cancelled) setIsSurprising(false);
          return;
        }

        const pick = results.slice(0, 10)[Math.floor(Math.random() * Math.min(10, results.length))];
        // The old version always waited 1.5s "to show the animation" even when
        // the request had already failed, then navigated with no null check.
        window.setTimeout(() => {
          if (cancelled) return;
          goToDetail(pick.id, type);
          setIsSurprising(false);
        }, 900);
      } catch (cause) {
        console.error('Surprise Me failed:', cause);
        if (!cancelled) setIsSurprising(false);
      }
    };

    const triggerSurprise = () => void handleSurpriseMe();
    const triggerMood = () => setIsMoodOpen(true);

    window.addEventListener('trigger-surprise-me', triggerSurprise);
    window.addEventListener('trigger-mood-finder', triggerMood);
    return () => {
      cancelled = true;
      window.removeEventListener('trigger-surprise-me', triggerSurprise);
      window.removeEventListener('trigger-mood-finder', triggerMood);
    };
  }, []);

  const handleReset = useCallback(() => {
    // Was `localStorage.clear()`, which wiped every key on the origin --
    // including any unrelated app served from the same host -- and then wrote
    // back a schema-version stamp by hand.
    resetAllLocalData();
    setShowResetModal(false);
    window.location.hash = '#home';
  }, [resetAllLocalData]);

  const homeRows = useMemo(() => {
    if (homeFilters.providerId) {
      return (
        <motion.div
          key={`filtered-${homeFilters.providerId}-${homeFilters.type}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <MovieRow
            title="Available on selected provider"
            fetchFn={(page) =>
              api.discover(homeFilters.type, {
                page,
                watch_region: homeFilters.country,
                with_watch_providers: homeFilters.providerId ?? '',
              })
            }
            onMovieSelect={goToDetail}
          />
        </motion.div>
      );
    }

    return (
      <motion.div
        key="default-rows"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <MovieRow
          title="Trending now"
          fetchFn={(page) => api.getTrending('all', 'week', page)}
          onMovieSelect={goToDetail}
        />

        {/* `userPreferences` used to be an array of JSON *strings* that this map
            called `JSON.parse` on during render: one malformed entry threw and
            blanked the whole homepage. The store parses and validates them now. */}
        {userPreferences
          .filter((pref) => pref && typeof pref.label === 'string' && pref.label.trim() !== '' && pref.label !== 'undefined')
          .map((pref) => (
            <MovieRow
              key={`${pref.label}-${pref.genres}`}
              title={`Because you like ${pref.label}`}
              fetchFn={async (page) => {
                if (pref.label === 'Anime') {
                  const res = await kitsuApi.getByCategory('anime', page);
                  return {
                    results: (res.data ?? []).map((item) =>
                      kitsuApi.mapKitsuToInternal(item, res.included ?? [])
                    ),
                  };
                }
                return api.discover(pref.type ?? 'movie', { with_genres: pref.genres, page });
              }}
              onMovieSelect={goToDetail}
            />
          ))}

        <MovieRow
          title="Top rated movies"
          fetchFn={(page) => api.getTopRated('movie', page)}
          onMovieSelect={goToDetail}
        />
        <MovieRow
          title="Popular TV shows"
          fetchFn={(page) => api.getPopular('tv', page)}
          onMovieSelect={goToDetail}
        />
        <MovieRow
          title="Trending anime"
          fetchFn={async (page) => {
            const res = await kitsuApi.getTrending(page);
            return {
              results: (res.data ?? []).map((item) =>
                kitsuApi.mapKitsuToInternal(item, res.included ?? [])
              ),
            };
          }}
          onMovieSelect={goToDetail}
        />
      </motion.div>
    );
  }, [homeFilters, userPreferences]);

  const renderRouteContent = (route: string) => {
    switch (route) {
      case 'home':
        return (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Hero onMovieSelect={goToDetail} />
            <div className="relative z-10 -mt-10 pb-24 w-full px-4 sm:px-8 lg:px-12">
              <ContinueWatchingRow />

              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
                <div className="w-full md:w-auto">
                  <FilterBar defaultType="movie" onFilterChange={setHomeFilters} />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('trigger-surprise-me'))}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-brand/20 border border-white/10 hover:border-brand/50 text-foreground rounded-full font-bold transition-all hover:scale-105 backdrop-blur-md cursor-pointer"
                  >
                    <span className="text-xl" aria-hidden="true">
                      🎲
                    </span>
                    Surprise me
                  </button>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('trigger-mood-finder'))}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/50 text-foreground rounded-full font-bold transition-all hover:scale-105 backdrop-blur-md cursor-pointer"
                  >
                    <span className="text-xl" aria-hidden="true">
                      🎭
                    </span>
                    Find by mood
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <AnimatePresence mode="wait">{homeRows}</AnimatePresence>
              </div>
            </div>
            <Footer />
          </motion.div>
        );

      case 'movies':
        return (
          <motion.div
            key="movies"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PageShell title="Movies" defaultType="movie" onMovieSelect={goToDetail} />
          </motion.div>
        );

      case 'tvshows':
        return (
          <motion.div
            key="tvshows"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PageShell title="TV Shows" defaultType="tv" onMovieSelect={goToDetail} />
          </motion.div>
        );

      case 'anime':
        return (
          <motion.div
            key="anime"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PageShell
              title="Anime"
              defaultType="anime"
              onMovieSelect={(id) => goToDetail(id, 'anime')}
            />
          </motion.div>
        );

      case 'mylist':
        return (
          <motion.div
            key="mylist"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MyList onMovieSelect={goToDetail} />
          </motion.div>
        );

      case 'admin':
        return (
          <motion.div
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AdminDashboard />
          </motion.div>
        );

      case 'birthday':
        if (!birthdayVisible) return <RouteLoading />;
        return (
          <motion.div
            key="birthday"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <BirthdayPage />
          </motion.div>
        );

      case 'search':
        return (
          <motion.div
            key="search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PageShell
              title={`Search results for "${searchQuery}"`}
              defaultType="movie"
              isSearch
              searchQuery={searchQuery}
              onMovieSelect={goToDetail}
            />
          </motion.div>
        );

      default: {
        if (route.startsWith('watch/')) {
          const parts = route.split('/');
          const type = parts[1] as 'movie' | 'tv' | 'ani';
          const id = parts[2];
          const season = parts[3];
          const episode = parts[4];

          if (!id) break;

          if (type === 'ani') {
            // #watch/ani/<id>/<episode> or #watch/ani/<id>/<malId>/<episode>
            return (
              <AnimePlayer
                id={id}
                episode={episode ?? season ?? '1'}
                malId={episode ? season : undefined}
              />
            );
          }
          return <PlayerPage type={type} id={id} season={season} episode={episode} />;
        }

        if (route.startsWith('movie/')) {
          const id = route.split('/')[1];
          if (id) return <MovieDetail type="movie" id={id} />;
        }

        if (route.startsWith('tv/')) {
          const id = route.split('/')[1];
          if (id) return <MovieDetail type="tv" id={id} />;
        }

        if (route.startsWith('ani/') || route.startsWith('detail/ani/')) {
          const id = route.startsWith('detail/ani/')
            ? route.split('/')[2]
            : route.split('/')[1];
          if (id) return <AnimeDetail id={id} />;
        }
        break;
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-20 px-4">
        <div className="text-center">
          <h1 className="text-8xl md:text-9xl font-display font-bold text-foreground mb-4">404</h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 font-medium">
            That page is not in the vault.
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#home';
            }}
            className="px-8 py-3 bg-brand text-background font-bold rounded-full hover:opacity-90 transition-opacity shadow-card cursor-pointer"
          >
            Return home
          </button>
        </div>
      </div>
    );
  };

  const renderView = () => {
    if (currentRoute === 'profile') {
      return (
        <div key="profile-view-wrapper" className="relative">
          <div className="filter blur-md pointer-events-none select-none" aria-hidden="true">
            {renderRouteContent(lastBaseRoute)}
          </div>
          <ProfilePage />
        </div>
      );
    }
    return renderRouteContent(currentRoute);
  };

  return (
    <>
      <a
        href="#app-container"
        className="skip-link sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] bg-brand text-background font-bold px-4 py-2 rounded shadow-lg outline-none focus:ring-4 ring-white"
      >
        Skip to main content
      </a>

      <div
        className="fixed inset-0 pointer-events-none z-[-1] transition-colors duration-1000 ease-out"
        style={{
          background: ambientColor
            ? `radial-gradient(circle at 50% 20%, ${ambientColor}33 0%, transparent 60%)`
            : 'transparent',
        }}
      />

      {!introDone && <CinematicIntro onComplete={handleIntroComplete} />}

      {!currentRoute.startsWith('watch/') && (
        <Navbar onSearchClick={() => setIsSearchOpen(true)} />
      )}

      <div
        className={`min-h-screen pb-32 transition-opacity duration-700 ${
          introDone ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <main id="app-container">
          <Suspense fallback={<RouteLoading />}>
            <AnimatePresence mode="wait">{renderView()}</AnimatePresence>
          </Suspense>
        </main>

        <SearchOverlay
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onMovieSelect={goToDetail}
        />

        <OnboardingModal />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
        />
        <MoodFinderOverlay isOpen={isMoodOpen} onClose={() => setIsMoodOpen(false)} />

        <AnimatePresence>
          {isSurprising && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center px-4"
              role="status"
            >
              <motion.div
                animate={{ rotateY: [0, 180, 360] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-32 h-48 bg-gradient-to-br from-brand to-orange-600 rounded-xl shadow-glow mb-8 flex items-center justify-center border-2 border-white/20"
              >
                <span className="text-5xl" aria-hidden="true">
                  🎲
                </span>
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white text-center">
                Shuffling…
              </h2>
              <p className="text-brand mt-4 text-xl">Finding a {surprisingGenre} pick for you</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showResetModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="reset-modal-title"
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="w-full max-w-md glass border border-red-500/30 rounded-2xl p-8 relative text-center"
              >
                <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl" aria-hidden="true">
                    ⚠️
                  </span>
                </div>
                <h3
                  id="reset-modal-title"
                  className="text-2xl font-display font-bold text-foreground mb-4"
                >
                  Reset app data
                </h3>
                <p className="text-muted-foreground mb-8">
                  This clears your watchlist, watch progress and preferences stored in this browser.
                  Your account and synced data are not affected.
                </p>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-foreground rounded-xl font-bold transition-colors border border-white/10 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-500/20 cursor-pointer"
                  >
                    Yes, reset
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="fixed bottom-24 right-6 z-[200] flex flex-col gap-2"
          aria-live="polite"
          aria-atomic="true"
        >
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, x: 20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                layout
                className="glass border border-brand/30 text-foreground px-6 py-4 rounded-xl font-medium shadow-card"
              >
                {toast.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

/**
 * `ErrorBoundary` sits *outside* the providers now. It used to be the innermost
 * wrapper, so a crash thrown while `AppProvider` was initialising -- the most
 * likely place for one, since it reads localStorage and Firebase -- escaped the
 * boundary entirely and left a blank white page.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BirthdayMusicProvider>
          <AppContent />
        </BirthdayMusicProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}
