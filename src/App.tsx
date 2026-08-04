import { ErrorBoundary } from "./components/ErrorBoundary";
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MovieRow } from './components/MovieRow';
import { FilterBar } from './components/FilterBar';
import { MovieDetail } from './components/MovieDetail';
import { SearchOverlay } from './components/SearchOverlay';
import { MyList } from './components/MyList';
import { Footer } from './components/Footer';
import { PageShell } from './components/PageShell';
import { PlayerPage } from './components/PlayerPage';
import { AnimePlayer } from './components/AnimePlayer';
import { AnimeDetail } from './components/AnimeDetail';
import { ProfilePage } from './components/ProfilePage';
import { MoodFinderOverlay } from './components/MoodFinderOverlay';
import { AppProvider, useApp } from './store';
import { api, kitsuApi } from './api';

import { CinematicIntro } from './components/CinematicIntro';

import { ContinueWatchingRow } from './components/ContinueWatchingRow';
import { OnboardingModal } from './components/OnboardingModal';

function AppContent() {
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [isSurprising, setIsSurprising] = useState(false);
  const [surprisingGenre, setSurprisingGenre] = useState('');
  const [homeFilters, setHomeFilters] = useState<any>({ type: 'movie', country: 'US' });
  const [showResetModal, setShowResetModal] = useState(false);
  const { ambientColor, toasts, userPreferences } = useApp();

  


  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === 'Escape') {
        if (isSearchOpen) setIsSearchOpen(false);
        if (isMoodOpen) setIsMoodOpen(false);
        if (showResetModal) setShowResetModal(false);
      } else if (e.key === 'Backspace') {
        window.history.back();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isMoodOpen, showResetModal]);

  useEffect(() => {
    const handleReset = () => setShowResetModal(true);
    window.addEventListener('trigger-reset', handleReset);
    return () => window.removeEventListener('trigger-reset', handleReset);
  }, []);
  useEffect(() => {
    if (currentRoute === 'home') document.title = "CineVault | Premium Streaming";
    else if (currentRoute === 'movies') document.title = "CineVault | Movies";
    else if (currentRoute === 'tvshows') document.title = "CineVault | TV Shows";
    else if (currentRoute === 'anime') document.title = "CineVault | Anime";
    else if (currentRoute === 'mylist') document.title = "CineVault | My Watchlist";
    else if (currentRoute === 'search') document.title = `CineVault | Search: ${searchQuery}`;
    else if (currentRoute.startsWith('watch/')) document.title = "CineVault | Now Playing";
    else if (currentRoute.startsWith('movie/') || currentRoute.startsWith('tv/') || currentRoute.startsWith('ani/') || currentRoute.startsWith('detail/')) document.title = "CineVault | Title Detail";
    else document.title = "CineVault | 404 Not Found";
  }, [currentRoute, searchQuery]);

  const [introDone, setIntroDone] = useState(() => {
    return sessionStorage.getItem('cinevault_intro_played') === 'true' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const handleIntroComplete = () => {
    setIntroDone(true);
    sessionStorage.setItem('cinevault_intro_played', 'true');
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      if (hash.startsWith('search/')) {
        setCurrentRoute('search');
        setSearchQuery(decodeURIComponent(hash.replace('search/', '')));
      } else {
        setCurrentRoute(hash);
      }
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // initial check
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    const handleSurpriseMe = async () => {
      setIsSurprising(true);
      try {
        const type = Math.random() > 0.5 ? 'movie' : 'tv';
        const genresRes = await api.getGenres(type);
        const genres = genresRes.genres || [];
        const randomGenre = genres[Math.floor(Math.random() * genres.length)];
        setSurprisingGenre(randomGenre ? randomGenre.name : 'Magic');

        const discoverRes = await api.discover(type, {
          with_genres: randomGenre?.id,
          'vote_average.gte': 7.5,
          sort_by: 'popularity.desc'
        });

        setTimeout(() => {
          if (discoverRes.results && discoverRes.results.length > 0) {
            const topResults = discoverRes.results.slice(0, 10);
            const randomMovie = topResults[Math.floor(Math.random() * topResults.length)];
            window.location.hash = `#${type}/${randomMovie.id}`;
          }
          setIsSurprising(false);
        }, 1500); // show animation for 1.5s
      } catch (e) {
        setIsSurprising(false);
      }
    };

    const triggerSurprise = () => handleSurpriseMe();
    const triggerMood = () => setIsMoodOpen(true);
    
    window.addEventListener('trigger-surprise-me', triggerSurprise);
    window.addEventListener('trigger-mood-finder', triggerMood);
    return () => {
      window.removeEventListener('trigger-surprise-me', triggerSurprise);
      window.removeEventListener('trigger-mood-finder', triggerMood);
    };
  }, []);

  const renderHomeContent = () => {
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
            title={`Available on Selected Provider`} 
            fetchFn={(page) => api.discover(homeFilters.type, { page,  
              watch_region: homeFilters.country, 
              with_watch_providers: homeFilters.providerId 
            })} 
            onMovieSelect={(id, type) => { window.location.hash = type === 'anime' ? `#detail/ani/${id}` : `#${type}/${id}`; }} 
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
        <MovieRow title="Trending Now" fetchFn={(page) => api.getTrending('all', 'week', page)} onMovieSelect={(id, type) => { window.location.hash = type === 'anime' ? `#detail/ani/${id}` : `#${type}/${id}`; }} />
        {userPreferences.length > 0 && userPreferences.map((prefStr: string, index: number) => {
          const pref = JSON.parse(prefStr);
          return (
            <MovieRow 
              key={index} 
              title={`Because you like ${pref.label}`} 
              fetchFn={async (page) => {
                if (pref.label === 'Anime') {
                  const res = await kitsuApi.getByCategory("anime", page);
                  return { results: res.data ? res.data.map((item: any) => kitsuApi.mapKitsuToInternal(item, res.included)) : [] };
                }
                return api.discover(pref.type, { with_genres: pref.id, page });
              }} 
              onMovieSelect={(id, type) => { window.location.hash = type === 'anime' ? `#detail/ani/${id}` : `#${type}/${id}`; }} 
            />
          );
        })}

        <MovieRow title="Top Rated Movies" fetchFn={(page) => api.getTopRated('movie', page)} onMovieSelect={(id, type) => { window.location.hash = type === 'anime' ? `#detail/ani/${id}` : `#${type}/${id}`; }} />
        <MovieRow title="Popular TV Shows" fetchFn={(page) => api.getPopular('tv', page)} onMovieSelect={(id, type) => { window.location.hash = type === 'anime' ? `#detail/ani/${id}` : `#${type}/${id}`; }} />
                <MovieRow title="Trending Anime" fetchFn={async (page) => {
          try {
            const res = await kitsuApi.getTrending(page);
            return { results: res.data ? res.data.map((item: any) => kitsuApi.mapKitsuToInternal(item, res.included)) : [] };
          } catch (e) {
            console.error(e);
            return { results: [] };
          }
        }} onMovieSelect={(id, type) => { window.location.hash = type === 'anime' ? `#detail/ani/${id}` : `#${type}/${id}`; }} />
      </motion.div>
    );
  };

  const renderView = () => {
    switch (currentRoute) {
      case 'home':
        return (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Hero onMovieSelect={(id, type) => { window.location.hash = type === 'anime' ? `#detail/ani/${id}` : `#${type}/${id}`; }} />
            <div className="relative z-10 -mt-10 pb-24 max-w-[1600px] mx-auto px-4 md:px-10">
              <ContinueWatchingRow />
              
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
                <div className="w-full md:w-auto">
                  <FilterBar 
                    defaultType="movie" 
                    onFilterChange={setHomeFilters} 
                  />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('trigger-surprise-me'))}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-cv-gold/20 border border-white/10 hover:border-cv-gold/50 text-white rounded-full font-bold transition-all hover:scale-105 backdrop-blur-md"
                  >
                    <span className="text-xl">🎲</span> Surprise Me
                  </button>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('trigger-mood-finder'))}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/50 text-white rounded-full font-bold transition-all hover:scale-105 backdrop-blur-md"
                  >
                    <span className="text-xl">🎭</span> Find by Mood
                  </button>
                </div>
              </div>
              <div className="pt-2">
                <AnimatePresence mode="wait">
                  {renderHomeContent()}
                </AnimatePresence>
              </div>
            </div>
            <Footer />
          </motion.div>
        );
      case 'movies':
        return (
          <motion.div key="movies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PageShell title="Movies" defaultType="movie" onMovieSelect={(id, type) => { window.location.hash = type === 'anime' ? `#detail/ani/${id}` : `#${type}/${id}`; }} />
          </motion.div>
        );
      case 'tvshows':
        return (
          <motion.div key="tvshows" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PageShell title="TV Shows" defaultType="tv" onMovieSelect={(id, type) => { window.location.hash = type === 'anime' ? `#detail/ani/${id}` : `#${type}/${id}`; }} />
          </motion.div>
        );
      case 'anime':
        return (
          <motion.div key="anime" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PageShell title="Anime" defaultType="anime" onMovieSelect={(id, type) => { window.location.hash = `#detail/ani/${id}`; }} />
          </motion.div>
        );
      case 'mylist':
        return (
          <motion.div key="mylist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MyList onMovieSelect={(id, type) => { window.location.hash = type === 'anime' ? `#detail/ani/${id}` : `#${type}/${id}`; }} />
          </motion.div>
        );
      case 'search':
        return (
          <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <PageShell 
              title={`Search Results for "${searchQuery}"`} 
              defaultType="movie"
              isSearch={true}
              searchQuery={searchQuery}
              onMovieSelect={(id, type) => { window.location.hash = type === 'anime' ? `#detail/ani/${id}` : `#${type}/${id}`; }} 
            />
          </motion.div>
        );
      case 'profile':
        return (
          <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProfilePage />
          </motion.div>
        );
      default:
        if (currentRoute.startsWith('watch/')) {
          const parts = currentRoute.split('/');
          const type = parts[1] as 'movie' | 'tv' | 'ani';
          const id = parts[2];
          const season = parts[3];
          const episode = parts[4];
          if (type === 'ani') {
            const epNum = episode ? episode : season;
            const passedMalId = episode ? season : undefined;
            return <AnimePlayer id={id} episode={epNum} malId={passedMalId} />;
          }
          return <PlayerPage type={type} id={id} season={season} episode={episode} />;
        }
        if (currentRoute.startsWith('movie/')) {
          const id = currentRoute.split('/')[1];
          return <MovieDetail type="movie" id={id} />;
        }
        if (currentRoute.startsWith('tv/')) {
          const id = currentRoute.split('/')[1];
          return <MovieDetail type="tv" id={id} />;
        }
        if (currentRoute.startsWith('ani/') || currentRoute.startsWith('detail/ani/')) {
          const id = currentRoute.startsWith('detail/ani/') ? currentRoute.split('/')[2] : currentRoute.split('/')[1];
          return <AnimeDetail id={id} />;
        }
        return (
          <div className="min-h-screen flex items-center justify-center bg-cv-bg pt-20">
            <div className="text-center">
              <h1 className="text-8xl md:text-9xl font-serif font-bold text-cv-cream mb-4 drop-shadow-[0_0_30px_rgba(212,168,83,0.3)]">404</h1>
              <p className="text-xl md:text-2xl text-cv-slate mb-8 font-medium">The scene you are looking for is missing from the vault.</p>
              <button 
                onClick={() => window.location.hash = '#home'}
                className="px-8 py-3 bg-cv-gold text-cv-gold-content font-bold rounded-lg hover:bg-cv-gold-light transition-colors shadow-[0_0_20px_rgba(212,168,83,0.3)]"
              >
                Return to Home
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <a href="#app-container" className="skip-link sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] bg-cv-gold text-black font-bold px-4 py-2 rounded shadow-lg outline-none focus:ring-4 ring-white">
        Skip to main content
      </a>
      
      <div 
        className="fixed inset-0 pointer-events-none z-[-1] transition-colors duration-1000 ease-out" 
        style={{
          background: ambientColor ? `radial-gradient(circle at 50% 20%, ${ambientColor}33 0%, transparent 60%)` : 'transparent'
        }}
      />
      {!introDone && <CinematicIntro onComplete={handleIntroComplete} />}
      <div className={`min-h-screen pb-24 md:pb-0 transition-all duration-1000 ${!introDone ? 'opacity-50 blur-lg scale-105 pointer-events-none' : 'opacity-100 blur-none scale-100 pointer-events-auto'}`}>
        {!currentRoute.startsWith('watch/') && (
          <Navbar onSearchClick={() => setIsSearchOpen(true)} />
        )}
        
        <div id="app-container">
          <AnimatePresence mode="wait">
            {renderView()}
          </AnimatePresence>
        </div>

      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onMovieSelect={(id, type) => { window.location.hash = type === 'anime' ? `#detail/ani/${id}` : `#${type}/${id}`; }} 
      />
      
      <OnboardingModal />
      <MoodFinderOverlay 
        isOpen={isMoodOpen}
        onClose={() => setIsMoodOpen(false)}
      />

      <AnimatePresence>
        {isSurprising && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ rotateY: [0, 180, 360] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-32 h-48 bg-gradient-to-br from-cv-gold to-yellow-600 rounded-xl shadow-[0_0_50px_rgba(212,168,83,0.5)] mb-8 flex items-center justify-center border-2 border-white/20"
            >
              <span className="text-5xl">🎲</span>
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white text-center">
              Shuffling...
            </h2>
            <p className="text-cv-gold mt-4 text-xl animate-pulse">
              Finding a {surprisingGenre} gem for you
            </p>
          </motion.div>
        )}
      </AnimatePresence>

            {/* Reset Modal */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-md glass-panel border border-red-500/30 rounded-2xl p-8 relative shadow-[0_0_50px_rgba(239,68,68,0.15)] text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-cv-cream mb-4">Reset App Data</h3>
              <p className="text-cv-slate mb-8">This will clear your watchlist, watch progress, and preferences. Are you sure?</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold transition-colors border border-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    localStorage.setItem('cinevault_schema_version', '2.0');
                    window.location.hash = '#home';
                    window.location.reload();
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors shadow-lg shadow-red-500/20"
                >
                  Yes, Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Global Toasts */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-[200] flex flex-col gap-2" aria-live="polite" aria-atomic="true">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              layout
              className="glass-panel border border-cv-gold text-cv-cream px-6 py-4 rounded-lg font-medium shadow-[0_0_20px_rgba(212,168,83,0.3)]"
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

export default function App() {
  return (
    <AppProvider>
      <ErrorBoundary><AppContent /></ErrorBoundary>
    </AppProvider>
  );
}
