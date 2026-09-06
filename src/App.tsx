import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MovieRow } from './components/MovieRow';
import { Top10Row } from './components/Top10Row';
import { FilterBar } from './components/FilterBar';
import { SearchOverlay } from './components/SearchOverlay';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppProvider, useApp } from './store';
import { api, anilistApi } from './api';
import { CinematicIntro } from './components/CinematicIntro';
import { ContinueWatchingRow } from './components/ContinueWatchingRow';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthModal } from './components/AuthModal';
import { BirthdayMusicProvider, useBirthdayMusic } from './context/BirthdayMusicContext';
import { goToDetail, isSyntheticNavigation, navigate } from './lib/navigation';
import { isBirthdayVisible, rememberBirthdayUnlock } from './config/birthdayAccess';
import { useScrollRestoration } from './hooks/useScrollRestoration';
import { ConsentBanner } from './components/ConsentBanner';

import { ROUTE_SEO, updateSeoMetadata } from './lib/seo';
import { BackToTop } from './components/BackToTop';

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
const ProfileSwitcher = lazy(() =>
  import('./components/ProfileSwitcher').then((m) => ({ default: m.ProfileSwitcher }))
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
const NotFoundPage = lazy(() =>
  import('./components/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

interface HomeFilters {
  type: string;
  country: string;
  providerId?: string;
  genreId?: string;
  language?: string;
  sortBy?: string;
}

const INTRO_KEY = 'cv:introPlayed';

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

/**
 * Fallback for the route-scoped boundary.
 *
 * The only boundary in the app wrapped the whole tree, so a render error in one
 * page -- a malformed episode list, a detail response missing a field -- replaced
 * the entire application with a full-screen error and lost the navbar with it.
 * This keeps the chrome intact and offers a way out that isn't a reload.
 */
function RouteError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="text-5xl mb-5" aria-hidden="true">
        🎬
      </div>
      <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3">
        This page didn’t load.
      </h1>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        Something in this view failed to render. The rest of CineVault is still working — try again,
        or head back to the home page.
      </p>

      <p className="mb-8 max-w-lg font-mono text-xs text-red-300/80 break-words">{error.message}</p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="px-6 py-3 bg-brand text-background font-bold rounded-full text-sm hover:brightness-110 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => {
            onRetry();
            navigate('/');
          }}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-foreground font-bold rounded-full text-sm transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Back to home
        </button>
      </div>
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

  const {
    ambientColor,
    toasts,
    showToast,
    userPreferences,
    genreAffinity,
    continueWatching,
    isKidsMode,
    authModalOpen,
    setAuthModalOpen,
    authModalMode,
    authStatus,
    resetAllLocalData,
  } = useApp();

  const { applyForNavigation } = useScrollRestoration();

  const { pauseTrack } = useBirthdayMusic();

  // Stop birthday music immediately whenever user leaves the birthday special route
  useEffect(() => {
    if (currentRoute !== 'birthday') {
      pauseTrack();
    }
  }, [currentRoute, pauseTrack]);

  const anyOverlayOpen = isSearchOpen || isMoodOpen || showResetModal || authModalOpen;

  /* Nothing stopped the page scrolling behind an open overlay: flicking the
   * search panel scrolled the homepage underneath it, and closing the panel left
   * the user somewhere they never chose to be. The scrollbar's width is replaced
   * with padding so locking doesn't shift the layout sideways. */
  useEffect(() => {
    if (!anyOverlayOpen) return;
    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const gutter = window.innerWidth - documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (gutter > 0) body.style.paddingRight = `${gutter}px`;
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }, [anyOverlayOpen]);

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

      /* Two bindings were removed here rather than fixed.
       *
       * `Ctrl/Cmd+Shift+A` jumped to /admin. It was undiscoverable, it took a
       * chord the browser already owns (Chrome selects all tabs with it), and
       * the dashboard now has a visible entry in the profile menu for accounts
       * that actually hold the admin claim.
       *
       * `Backspace` called `history.back()`. Browsers dropped that binding
       * deliberately -- Chrome in 52 -- because it discards work when focus is
       * anywhere but a text field, and no amount of guarding makes an unlabelled
       * destructive shortcut a good default. Alt+Left and the back button still
       * work, and the in-app back control is in the navbar. */
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isMoodOpen, showResetModal]);

  useEffect(() => {
    const handleReset = () => setShowResetModal(true);
    window.addEventListener('trigger-reset', handleReset);
    return () => window.removeEventListener('trigger-reset', handleReset);
  }, []);

  // Warm up the anime trending catalogue in idle time so clicking the Anime tab renders instantly
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          anilistApi.getTrending(1, 20).catch(() => {});
        });
      } else {
        anilistApi.getTrending(1, 20).catch(() => {});
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ROUTE_SEO[currentRoute]) {
      updateSeoMetadata(ROUTE_SEO[currentRoute]);
    } else if (currentRoute === 'search') {
      updateSeoMetadata({
        title: searchQuery ? `Search: ${searchQuery}` : 'Search Movies, TV & Anime',
        description: searchQuery
          ? `Discover search results for "${searchQuery}" in the CineVault streaming catalogue.`
          : 'Search across thousands of movies, television series, and anime on CineVault.',
        ogType: 'website',
      });
    } else if (currentRoute.startsWith('watch/')) {
      updateSeoMetadata({
        title: 'Now Playing',
        description: 'Streaming in high definition on CineVault.',
        ogType: 'video.other',
      });
    } else if (!/^(movie|tv|ani|detail)\//.test(currentRoute)) {
      updateSeoMetadata({
        title: '404 Page Not Found',
        description: 'That page is not in the vault.',
        ogType: 'website',
      });
    }
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

  const safeDecode = (str: string) => {
    try {
      return decodeURIComponent(str);
    } catch {
      return str;
    }
  };

  const parseCurrentLocation = useCallback((): { route: string; query: string } => {
    if (typeof window === 'undefined') return { route: 'home', query: '' };

    let pathname = window.location.pathname.replace(/\/+$/, '') || '/';
    const rawHash = window.location.hash.replace(/^#\/?/, '');

    if (rawHash && rawHash !== 'app-container') {
      // Strip legacy hashtag and normalize URL via history.replaceState
      const cleanTarget = rawHash.startsWith('/') ? rawHash : '/' + rawHash;
      window.history.replaceState(null, '', cleanTarget);
      pathname = cleanTarget.replace(/\/+$/, '') || '/';
    } else if (rawHash === 'app-container') {
      window.history.replaceState(null, '', pathname);
    }

    const path = pathname.toLowerCase();

    // Home
    if (path === '/' || path === '/home') {
      return { route: 'home', query: '' };
    }

    // Top-level tabs
    if (path === '/movies') return { route: 'movies', query: '' };
    if (path === '/tvshows') return { route: 'tvshows', query: '' };
    if (path === '/anime') return { route: 'anime', query: '' };
    if (path === '/mylist') return { route: 'mylist', query: '' };
    if (path === '/admin') return { route: 'admin', query: '' };
    if (path === '/birthday') return { route: 'birthday', query: '' };
    if (path === '/profile') return { route: 'profile', query: '' };
    if (path === '/profiles') return { route: 'profiles', query: '' };

    // Search: /search or /search/<term> or /search?q=<term>
    if (path === '/search' || path.startsWith('/search/')) {
      const searchParams = new URLSearchParams(window.location.search);
      const qParam = searchParams.get('q');
      let q = '';
      if (qParam) {
        q = qParam;
      } else if (path.startsWith('/search/')) {
        q = safeDecode(pathname.slice(8));
      }
      return { route: 'search', query: q };
    }

    // Watch player: /watch/movie/:id, /watch/tv/:id/:season/:episode, /watch/ani/:id/:episode, etc.
    if (path.startsWith('/watch/')) {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length >= 3 && ['movie', 'tv', 'ani'].includes(parts[1].toLowerCase())) {
        return { route: parts.join('/'), query: '' };
      }
      return { route: '404', query: '' };
    }

    // Movie detail: /movie/:id
    if (path.startsWith('/movie/')) {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length === 2 && parts[1]) {
        return { route: `movie/${parts[1]}`, query: '' };
      }
      return { route: '404', query: '' };
    }

    // TV detail: /tv/:id
    if (path.startsWith('/tv/')) {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length === 2 && parts[1]) {
        return { route: `tv/${parts[1]}`, query: '' };
      }
      return { route: '404', query: '' };
    }

    // Anime detail: /ani/:id or /detail/ani/:id
    if (path.startsWith('/ani/')) {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length === 2 && parts[1]) {
        return { route: `ani/${parts[1]}`, query: '' };
      }
      return { route: '404', query: '' };
    }
    if (path.startsWith('/detail/ani/')) {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length === 3 && parts[2]) {
        return { route: `ani/${parts[2]}`, query: '' };
      }
      return { route: '404', query: '' };
    }

    // Non-existent route
    return { route: '404', query: '' };
  }, []);

  useEffect(() => {
    const handleLocationChange = () => {
      const { route, query } = parseCurrentLocation();
      if (route === 'search') {
        setCurrentRoute('search');
        setSearchQuery(query);
      } else {
        setCurrentRoute(route);
      }
      /* Was an unconditional `window.scrollTo(0, 0)`, which threw away the
       * user's place in a grid every time they came back to it. A push still
       * starts at the top; a Back or Forward returns to the saved offset. */
      applyForNavigation(isSyntheticNavigation());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    handleLocationChange();
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [parseCurrentLocation, applyForNavigation]);

  // Global internal link interceptor
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (!href) return;

      if (
        target.target === '_blank' ||
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        target.hasAttribute('download')
      ) {
        return;
      }

      if (href === '#app-container' || href.startsWith('#app-')) {
        return;
      }

      if (href.startsWith('/') || href.startsWith('#')) {
        e.preventDefault();
        const cleanPath = href.startsWith('#') ? '/' + href.replace(/^#\/?/, '') : href;
        navigate(cleanPath);
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
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
      navigate('/', { replace: true });
      showToast('🔒 The Birthday Special unlocks on 2nd September! Counting down the seconds ✨🎂');
    }
  }, [currentRoute, showToast]);

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
    navigate('/', { replace: true });
  }, [resetAllLocalData]);

  const homeRows = useMemo(() => {
    if (homeFilters.providerId || (homeFilters.sortBy && homeFilters.sortBy !== 'popularity.desc')) {
      const sortTitle =
        homeFilters.sortBy === 'vote_average.desc'
          ? 'Highest Rated'
          : homeFilters.sortBy === 'primary_release_date.desc'
          ? 'New Releases'
          : 'Filtered titles';
      const rowTitle = homeFilters.providerId ? 'Available on selected provider' : sortTitle;
      return (
        <motion.div
          key={`filtered-${homeFilters.providerId || 'none'}-${homeFilters.type}-${homeFilters.sortBy || 'pop'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <MovieRow
            index={0}
            title={rowTitle}
            fetchFn={(page) =>
              api.discover(homeFilters.type, {
                page,
                watch_region: homeFilters.country,
                with_watch_providers: homeFilters.providerId || '',
                sort_by: homeFilters.sortBy || 'popularity.desc',
              })
            }
            onMovieSelect={goToDetail}
          />
        </motion.div>
      );
    }

    if (isKidsMode) {
      return (
        <motion.div
          key="kids-home-rows"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <MovieRow
            index={0}
            title="✨ Animated & Family Favorites"
            fetchFn={(page) =>
              api.discover('movie', {
                page,
                with_genres: '16,10751',
                sort_by: 'popularity.desc',
              })
            }
            onMovieSelect={goToDetail}
          />
          <MovieRow
            index={1}
            title="🍿 Family Movie Night"
            fetchFn={(page) =>
              api.discover('movie', {
                page,
                with_genres: '10751',
                sort_by: 'vote_average.desc',
                'vote_count.gte': 100,
              })
            }
            onMovieSelect={goToDetail}
          />
          <MovieRow
            index={2}
            title="📺 Popular Kids & Cartoon TV"
            fetchFn={(page) =>
              api.discover('tv', {
                page,
                with_genres: '16,10762',
                sort_by: 'popularity.desc',
              })
            }
            onMovieSelect={goToDetail}
          />
          <MovieRow
            index={3}
            title="🎌 Kid-Friendly Anime"
            fetchFn={async (page) => {
              const res = await anilistApi.getByCategory('kids', page);
              return { results: res.results };
            }}
            onMovieSelect={goToDetail}
          />
          <MovieRow
            index={4}
            title="🚀 Fantasy & Adventure"
            fetchFn={(page) =>
              api.discover('movie', {
                page,
                with_genres: '12,14',
                sort_by: 'popularity.desc',
              })
            }
            onMovieSelect={goToDetail}
          />
        </motion.div>
      );
    }

    /* `index` is the row's position down the page. MovieRow uses it to decide
     * which rows may fetch on mount and which wait for the viewport, so the
     * count has to include the Top 10 row's slot even though it isn't one. */
    const becauseWatched = continueWatching.slice(0, 2);
    /* `userPreferences` used to be an array of JSON *strings* that the map below
     * called `JSON.parse` on during render: one malformed entry threw and
     * blanked the whole homepage. The store parses and validates them now. */
    const likedRows = userPreferences.filter(
      (pref) =>
        pref &&
        typeof pref.label === 'string' &&
        pref.label.trim() !== '' &&
        pref.label !== 'undefined'
    );
    const sortedLikedRows = [...likedRows].sort((a, b) => {
      const affA = genreAffinity[a.label.trim().toLowerCase()] ?? 0;
      const affB = genreAffinity[b.label.trim().toLowerCase()] ?? 0;
      return affB - affA;
    });
    const likedOffset = 2 + becauseWatched.length;
    const tailOffset = likedOffset + sortedLikedRows.length;

    return (
      <motion.div
        key="default-rows"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <MovieRow
          index={0}
          title="Trending now"
          fetchFn={(page) => api.getTrending('all', 'week', page)}
          onMovieSelect={goToDetail}
        />

        <Top10Row
          onMovieSelect={goToDetail}
          region={homeFilters.country}
        />

        {/* Dynamic 'Because you watched' personalized rows */}
        {becauseWatched.map((item, position) => (
          <MovieRow
            key={`because-watched-${item.media_type}-${item.id}`}
            index={2 + position}
            title={`Because you watched ${item.title}`}
            fetchFn={async (page) => {
              if (item.media_type === 'anime') {
                const res = await anilistApi.getTrending(page);
                return { results: res.results };
              }
              return api.getRecommendations(item.media_type, item.id, page);
            }}
            onMovieSelect={goToDetail}
          />
        ))}

        {sortedLikedRows.map((pref, position) => (
          <MovieRow
            key={`${pref.label}-${pref.genres}`}
            index={likedOffset + position}
            title={`Because you like ${pref.label}`}
            fetchFn={async (page) => {
              if (pref.label === 'Anime') {
                const res = await anilistApi.getByCategory('anime', page);
                return { results: res.results };
              }
              return api.discover(pref.type ?? 'movie', { with_genres: pref.genres, page });
            }}
            onMovieSelect={goToDetail}
          />
        ))}

        <MovieRow
          index={tailOffset}
          title="Top rated movies"
          fetchFn={(page) => api.getTopRated('movie', page)}
          onMovieSelect={goToDetail}
        />
        <MovieRow
          index={tailOffset + 1}
          title="Popular TV shows"
          fetchFn={(page) => api.getPopular('tv', page)}
          onMovieSelect={goToDetail}
        />
        <MovieRow
          index={tailOffset + 2}
          title="Trending anime"
          fetchFn={async (page) => {
            const res = await anilistApi.getTrending(page);
            return { results: res.results };
          }}
          onMovieSelect={goToDetail}
        />
      </motion.div>
    );
  }, [homeFilters, userPreferences, isKidsMode, continueWatching]);

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

      case 'profiles':
        if (authStatus === 'loading') return <RouteLoading key="profiles-loading" />;
        return (
          <motion.div
            key="profiles"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ProfileSwitcher onClose={() => { navigate('/'); }} />
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

      case '404':
        return (
          <motion.div
            key="notfound"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <NotFoundPage />
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

    return <NotFoundPage />;
  };

  const renderView = () => {
    if (currentRoute === 'profile') {
      /* Firebase resolves auth asynchronously, and `authStatus` starts at
       * 'loading'. Rendering settings straight away meant the panel painted as
       * "Guest / Sign in" for a beat and then swapped to the real account --
       * with the sign-in call to action briefly clickable on an account that was
       * already signed in. */
      if (authStatus === 'loading') return <RouteLoading key="profile-loading" />;

      /* This used to render `renderRouteContent(lastBaseRoute)` behind the
       * settings panel purely to have something to blur: a second full route
       * tree, mounting a second Hero and every row on it, firing the same API
       * requests again and holding a duplicate of the whole DOM -- for a
       * backdrop. A gradient does the same job for nothing. */
      return (
        <div key="profile-view-wrapper" className="relative">
          <div
            aria-hidden="true"
            className="fixed inset-0 -z-10 bg-background bg-[radial-gradient(circle_at_20%_0%,rgba(232,133,42,0.16),transparent_55%),radial-gradient(circle_at_85%_25%,rgba(120,80,200,0.14),transparent_50%)]"
          />
          <ProfilePage />
        </div>
      );
    }
    return renderRouteContent(currentRoute);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          const el = document.getElementById('app-container');
          if (el) {
            el.tabIndex = -1;
            el.focus();
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        className="skip-link sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] bg-brand text-background font-bold px-4 py-2 rounded shadow-lg outline-none focus:ring-4 ring-white cursor-pointer"
      >
        Skip to main content
      </button>

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
          {/* One boundary per route, keyed on the route itself: a crash inside a
              page no longer takes the navbar, the overlays and the toasts with
              it, and navigating away clears the error instead of stranding the
              user on a fallback until they reload. */}
          <ErrorBoundary
            resetKey={currentRoute}
            fallback={(error, reset) => <RouteError error={error} onRetry={reset} />}
          >
            <Suspense fallback={<RouteLoading />}>
              <AnimatePresence mode="wait">{renderView()}</AnimatePresence>
            </Suspense>
          </ErrorBoundary>
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

        {/* Floating Back to Top */}
        <BackToTop />

        {/* Remote sync has been consent-gated since the services pass, but the
            question was never actually put to anyone. */}
        <ConsentBanner route={currentRoute} />

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
