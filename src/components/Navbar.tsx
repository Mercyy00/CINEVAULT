import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useApp, Theme } from '../store';
import { APP_FONTS, APP_FONT_IDS, loadAppFont } from '../lib/fonts';
import { getUserAvatarUrl, getFallbackAvatarDataUri } from '../lib/avatars';
import { Search, Palette, Settings, LogOut, Home, Film, Tv, Sparkles, Bookmark, User, Download, Type, Users, ShieldCheck } from 'lucide-react';
import { navigate } from '../lib/navigation';

interface ThemeOption {
  id: Theme;
  name: string;
  mode: 'dark' | 'light';
  color: string;
  bg: string;
}

const THEMES: ThemeOption[] = [
  // Dark Themes
  { id: 'crimson-premiere', name: 'Crimson Premiere', mode: 'dark', color: '#ffffff', bg: '#141414' },
  { id: 'cinematic-dark', name: 'Cinematic Dark', mode: 'dark', color: '#e8852a', bg: '#0a0a0a' },
  { id: 'cherry-cola', name: 'Cherry & Vanilla', mode: 'dark', color: '#efe6dd', bg: '#1a0305' },
  { id: 'butter-green', name: 'Butter & Forest', mode: 'dark', color: '#ffefb3', bg: '#013e37' },
  { id: 'bistre-aureolin', name: 'Bistre & Gold', mode: 'dark', color: '#fbe311', bg: '#190e04' },
  { id: 'vibrant-lime', name: 'Lime & Black', mode: 'dark', color: '#d3f00a', bg: '#0b0e02' },
  { id: 'imperial-violet', name: 'Imperial Violet', mode: 'dark', color: '#e2cbff', bg: '#190b24' },
  { id: 'midnight-ocean', name: 'Midnight Ocean', mode: 'dark', color: '#00f5d4', bg: '#0a1128' },
  { id: 'neon-cyberpunk', name: 'Neon Cyberpunk', mode: 'dark', color: '#05d9e8', bg: '#1a0b2e' },
  // Light Themes
  { id: 'elegant-light', name: 'Elegant Ivory', mode: 'light', color: '#3e2723', bg: '#f5f0e8' },
  { id: 'clean-daylight', name: 'Clean Daylight', mode: 'light', color: '#0f172a', bg: '#ffffff' },
  { id: 'vanilla-cherry', name: 'Vanilla & Cherry', mode: 'light', color: '#9a0002', bg: '#fdfaf7' },
  { id: 'nordic-frost', name: 'Nordic Frost', mode: 'light', color: '#0284c7', bg: '#f0f4f8' },
  { id: 'matcha-cream', name: 'Matcha & Cream', mode: 'light', color: '#2d6a4f', bg: '#f4f7f2' },
  { id: 'sunset-rose', name: 'Sunset Rose', mode: 'light', color: '#e11d48', bg: '#fdf6f6' },
];

/**
 * Font options are derived from the single source of truth in `lib/fonts.ts`.
 * The old local list hardcoded ids ("dinko", "inklab", "odida"…) and preview
 * family names for faces that were never loaded from anywhere, so every preview
 * fell through to a system fallback and selecting them changed nothing.
 */
const FONTS = APP_FONT_IDS.map((id) => ({
  id,
  name: APP_FONTS[id].name,
  tag: APP_FONTS[id].tag,
}));

export function Navbar({ onSearchClick }: { onSearchClick: () => void }) {
  const [showProfile, setShowProfile] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);

  const [customizerTab, setCustomizerTab] = useState<'themes' | 'fonts'>('themes');
  const [themeModeFilter, setThemeModeFilter] = useState<'all' | 'dark' | 'light'>('all');
  const { 
    theme, 
    setTheme, 
    appFont, 
    setAppFont, 
    showToast, 
    userProfile, 
    updateUserProfile,
    profiles,
    activeProfile,
    switchProfile,
    isKidsMode,
    clearProfile, 
    deferredInstallPrompt, 
    setDeferredInstallPrompt,
    setAuthModalOpen,
    setAuthModalMode,
    isAdmin,
    logout
  } = useApp();
  const [currentPath, setCurrentPath] = useState('/');

  useEffect(() => {
    const handleLocation = () => {
      let path = window.location.pathname || '/';
      if (window.location.hash && window.location.hash.length > 1) {
        path = '/' + window.location.hash.replace(/^#\/?/, '');
      }
      if (path === '/home') path = '/';
      setCurrentPath(path);
      setShowCustomizer(false);
      setShowProfile(false);
    };
    window.addEventListener('popstate', handleLocation);
    window.addEventListener('hashchange', handleLocation);
    handleLocation();
    return () => {
      window.removeEventListener('popstate', handleLocation);
      window.removeEventListener('hashchange', handleLocation);
    };
  }, []);

  useEffect(() => {
    if (showCustomizer && customizerTab === 'fonts') {
      APP_FONT_IDS.forEach(loadAppFont);
    }
  }, [showCustomizer, customizerTab]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.header-popup-container')) {
        setShowCustomizer(false);
        setShowProfile(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCustomizer(false);
        setShowProfile(false);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Movies', href: '/movies', icon: Film },
    { name: 'TV Shows', href: '/tvshows', icon: Tv },
    { name: 'Anime', href: '/anime', icon: Sparkles },
    { name: 'My List', href: '/mylist', icon: Bookmark },
    { name: 'Profile', href: '/profile', icon: User }
  ];

  const darkThemes = THEMES.filter(t => t.mode === 'dark');
  const lightThemes = THEMES.filter(t => t.mode === 'light');

  return (
    <>
      {/* Top Header */}
      <header className="fixed top-0 inset-x-0 z-[100] bg-gradient-to-b from-background/90 via-background/40 to-transparent py-2 sm:py-4 px-3 sm:px-8 flex items-center justify-between gap-1.5 sm:gap-4 pointer-events-none backdrop-blur-[2px] max-w-full safe-top">
        <a 
          href="/" 
          className="pointer-events-auto font-display font-black text-xl sm:text-3xl lg:text-4xl text-brand tracking-tight flex items-center gap-1.5 sm:gap-3 group transition-transform hover:scale-[1.02] drop-shadow-md shrink-0"
        >
            <div 
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 bg-brand transition-all shrink-0 drop-shadow-md group-hover:rotate-6",
                userProfile.logoStyle === 'vault' ? "brand-logo-vault" : "brand-logo-cat"
              )} 
            />
            {currentPath !== '/' && (
              <span className="hidden sm:inline text-brand">
                CineVault
              </span>
            )}
          </a>

        <div className="flex items-center gap-1.5 sm:gap-3 pointer-events-auto shrink-0">
          {/* Customizer (Themes & Fonts) Toggle */}
          <div className="relative header-popup-container">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setShowCustomizer(!showCustomizer); 
                setShowProfile(false); 
              }}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full glass border border-white/10 flex items-center justify-center text-foreground hover:text-brand transition-colors shadow-card"
              aria-label="Customize theme and typography"
            >
              <Palette className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" />
            </button>
            <AnimatePresence>
              {showCustomizer && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-4 w-72 sm:w-80 max-h-[80vh] overflow-y-auto custom-scrollbar glass rounded-2xl shadow-card p-3.5 border border-white/10 origin-top-right flex flex-col gap-3 z-[110]"
                >
                  {/* Tab bar */}
                  <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/5">
                    <button
                      onClick={() => setCustomizerTab('themes')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        customizerTab === 'themes' ? "bg-white/15 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Palette className="w-3.5 h-3.5" /> Themes ({THEMES.length})
                    </button>
                    <button
                      onClick={() => setCustomizerTab('fonts')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        customizerTab === 'fonts' ? "bg-white/15 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Type className="w-3.5 h-3.5" /> Fonts
                    </button>
                  </div>

                  {customizerTab === 'themes' ? (
                    <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                      {/* Dark/Light Segment Filter */}
                      <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5 text-[11px]">
                        <button
                          onClick={() => setThemeModeFilter('all')}
                          className={cn(
                            "flex-1 py-1 rounded-md font-medium transition-all text-center",
                            themeModeFilter === 'all' ? "bg-brand text-background font-bold shadow-sm" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          All ({THEMES.length})
                        </button>
                        <button
                          onClick={() => setThemeModeFilter('dark')}
                          className={cn(
                            "flex-1 py-1 rounded-md font-medium transition-all text-center flex items-center justify-center gap-1",
                            themeModeFilter === 'dark' ? "bg-brand text-background font-bold shadow-sm" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          🌙 Dark ({darkThemes.length})
                        </button>
                        <button
                          onClick={() => setThemeModeFilter('light')}
                          className={cn(
                            "flex-1 py-1 rounded-md font-medium transition-all text-center flex items-center justify-center gap-1",
                            themeModeFilter === 'light' ? "bg-brand text-background font-bold shadow-sm" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          ☀️ Light ({lightThemes.length})
                        </button>
                      </div>

                      {/* Dark Themes Group */}
                      {(themeModeFilter === 'all' || themeModeFilter === 'dark') && (
                        <div className="flex flex-col gap-1.5 pt-1">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                              🌙 Dark Themes
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">{darkThemes.length}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {darkThemes.map((t, idx) => (
                              <motion.button
                                key={t.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.02 }}
                                onClick={() => {
                                  setTheme(t.id);
                                  showToast(`Theme updated: ${t.name}`);
                                }}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-xl border transition-all text-left group cursor-pointer",
                                  theme === t.id ? "bg-white/15 border-brand ring-1 ring-brand/30" : "border-white/5 bg-white/5 hover:bg-white/10"
                                )}
                              >
                                <div 
                                  className="w-4 h-4 rounded-full shrink-0 border border-white/20 shadow-sm flex items-center justify-center relative overflow-hidden" 
                                  style={{ backgroundColor: t.bg }}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                                </div>
                                <span className="text-[11px] font-medium text-foreground truncate">{t.name}</span>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Light Themes Group */}
                      {(themeModeFilter === 'all' || themeModeFilter === 'light') && (
                        <div className="flex flex-col gap-1.5 pt-1.5">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1">
                              ☀️ Light Themes
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">{lightThemes.length}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {lightThemes.map((t, idx) => (
                              <motion.button
                                key={t.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.02 }}
                                onClick={() => {
                                  setTheme(t.id);
                                  showToast(`Theme updated: ${t.name}`);
                                }}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-xl border transition-all text-left group cursor-pointer",
                                  theme === t.id ? "bg-white/15 border-brand ring-1 ring-brand/30" : "border-white/5 bg-white/5 hover:bg-white/10"
                                )}
                              >
                                <div 
                                  className="w-4 h-4 rounded-full shrink-0 border border-white/20 shadow-sm flex items-center justify-center relative overflow-hidden" 
                                  style={{ backgroundColor: t.bg }}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                                </div>
                                <span className="text-[11px] font-medium text-foreground truncate">{t.name}</span>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                      {FONTS.map((f, idx) => (
                        <motion.button
                          key={f.id}
                          type="button"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          // Load the face when the row is hovered so its preview
                          // renders in the real typeface, without eagerly
                          // loading every family when the picker opens.
                          onMouseEnter={() => loadAppFont(f.id)}
                          onFocus={() => loadAppFont(f.id)}
                          onClick={() => {
                            setAppFont(f.id);
                            showToast(`Font updated: ${f.name}`);
                          }}
                          aria-pressed={appFont === f.id}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-xl border transition-all text-left",
                            appFont === f.id ? "bg-white/15 border-brand ring-1 ring-brand/30" : "border-white/5 bg-white/5 hover:bg-white/10"
                          )}
                        >
                          <div className="flex flex-col">
                            <span
                              className="text-xs font-bold text-foreground"
                              style={{ fontFamily: APP_FONTS[f.id]?.fontFamily || `'${f.name}', sans-serif` }}
                            >
                              {f.name}
                            </span>
                            <span className="text-[9px] text-muted-foreground">{f.tag}</span>
                          </div>
                          {appFont === f.id && (
                            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                          )}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Button */}
          <button 
            onClick={() => {
              setShowCustomizer(false);
              setShowProfile(false);
              onSearchClick();
            }}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full glass border border-white/10 flex items-center justify-center text-foreground hover:text-brand transition-colors shadow-card cursor-pointer"
            aria-label="Search"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" />
          </button>
          
          <div className="relative header-popup-container">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setShowProfile(!showProfile); 
                setShowCustomizer(false); 
              }}
              className={cn(
                "h-9 w-9 sm:h-10 sm:w-10 rounded-full glass border flex items-center justify-center text-foreground hover:border-brand/40 transition-all shadow-card cursor-pointer p-0.5 hover:scale-105 active:scale-95 overflow-hidden relative",
                isKidsMode ? "border-pink-500/60 ring-2 ring-pink-500/20" : "border-white/15"
              )}
              aria-label="User Account"
              title={`${activeProfile.name}${isKidsMode ? ' (Kids Mode)' : ''}`}
            >
              <img
                src={getUserAvatarUrl(activeProfile.avatar, activeProfile.name || 'Cinephile')}
                alt="Profile Avatar"
                className="w-full h-full object-contain rounded-full"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = getFallbackAvatarDataUri(activeProfile.name);
                }}
              />
              {isKidsMode && (
                <span className="absolute -bottom-0.5 -right-0.5 px-1 py-px bg-pink-500 text-[8px] font-black text-white rounded-full leading-none shadow">
                  K
                </span>
              )}
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-64 bg-card rounded-2xl shadow-2xl py-2 border border-border origin-top-right flex flex-col z-[200] text-foreground"
                >
                  {/* Current Active Profile Banner */}
                  <div className="px-4 py-2.5 border-b border-border mb-1 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl overflow-hidden bg-black/60 border border-brand/40 flex items-center justify-center p-0.5 shrink-0 shadow-sm relative">
                      <img
                        src={getUserAvatarUrl(activeProfile.avatar, activeProfile.name || 'Cinephile')}
                        alt="User Avatar"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = getFallbackAvatarDataUri(activeProfile.name);
                        }}
                      />
                      {isKidsMode && (
                        <div className="absolute top-0.5 left-0.5 px-1 py-px rounded bg-pink-500 text-[7px] font-black text-white uppercase">
                          KIDS
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-foreground truncate">{activeProfile.name || 'Guest'}</p>
                        {isKidsMode && (
                          <span className="px-1.5 py-px rounded text-[9px] font-black bg-pink-500/20 text-pink-400 border border-pink-500/30">
                            KIDS
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{userProfile.isLoggedIn ? userProfile.email : 'Local Household'}</p>
                    </div>
                  </div>

                  {/* Switch Profile Action */}
                  <a
                    href="/profiles"
                    onClick={() => setShowProfile(false)}
                    className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-foreground hover:bg-brand/10 hover:text-brand transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-brand" />
                      <span>Switch Profile</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                      {profiles.length} profiles
                    </span>
                  </a>

                  {/* Quick Profile Switcher Row */}
                  {profiles.length > 1 && (
                    <div className="px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto border-y border-border/50 bg-white/[0.02]">
                      {profiles.map((p) => {
                        const isCurrent = p.id === activeProfile.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              switchProfile(p.id);
                              setShowProfile(false);
                            }}
                            title={`Switch to ${p.name}`}
                            className={cn(
                              "w-8 h-8 rounded-xl p-0.5 border transition-all shrink-0 cursor-pointer overflow-hidden flex items-center justify-center relative",
                              isCurrent 
                                ? "border-brand ring-1 ring-brand bg-brand/10" 
                                : "border-white/10 opacity-70 hover:opacity-100 hover:border-white/40"
                            )}
                          >
                            <img
                              src={getUserAvatarUrl(p.avatar, p.name)}
                              alt={p.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = getFallbackAvatarDataUri(p.name);
                              }}
                            />
                            {p.isKids && (
                              <span className="absolute bottom-0 right-0 w-2 h-2 bg-pink-500 rounded-full" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {!userProfile.isLoggedIn && (
                    <div className="px-3 py-1.5">
                      <button
                        onClick={() => {
                          setShowProfile(false);
                          setAuthModalMode('signin');
                          setAuthModalOpen(true);
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-brand text-brand-foreground font-bold text-xs hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Sign In / Sign Up
                      </button>
                    </div>
                  )}

                  {deferredInstallPrompt && (
                    <button 
                      onClick={async () => {
                        deferredInstallPrompt.prompt();
                        const { outcome } = await deferredInstallPrompt.userChoice;
                        if (outcome === 'accepted') {
                          setDeferredInstallPrompt(null);
                        }
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-brand hover:text-brand/80 hover:bg-brand/10 transition-colors text-left border-y border-brand/10 bg-brand/5 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Install App
                    </button>
                  )}

                  <a href="/profile" onClick={() => setShowProfile(false)} className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                    <Settings className="w-4 h-4" /> Profile & Settings
                  </a>

                  {/* The dashboard used to be reachable only by a hidden
                      Ctrl+Shift+A chord, which also collided with the browser's
                      own shortcut. Admins get a visible entry point instead; the
                      route itself is still gated on the custom claim. */}
                  {isAdmin && (
                    <a
                      href="/admin"
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-brand hover:bg-brand/10 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" /> Admin Dashboard
                    </a>
                  )}
                  
                  {/* Display Mode Switcher */}
                  <div className="px-4 py-2.5 border-t border-white/5 flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Display Mode
                    </span>
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                      {(['auto', 'mobile', 'desktop'] as const).map((mode) => {
                        const active = (userProfile.displayMode || 'auto') === mode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => {
                              updateUserProfile({ displayMode: mode });
                              showToast(`Display mode: ${mode.toUpperCase()}`);
                            }}
                            className={cn(
                              "flex-1 py-1 text-[10px] font-semibold rounded-lg capitalize transition-all text-center cursor-pointer",
                              active
                                ? "bg-brand text-background font-bold shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {mode === 'auto' ? 'Auto' : mode === 'mobile' ? 'Mobile' : 'Desktop'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setShowProfile(false);
                      window.dispatchEvent(new CustomEvent('trigger-surprise-me'));
                    }} 
                    className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left cursor-pointer"
                  >
                    <span className="text-base leading-none">🎲</span> Surprise Me
                  </button>

                  {userProfile.isLoggedIn ? (
                    <button 
                      onClick={() => {
                        setShowProfile(false);
                        logout();
                      }} 
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors text-left border-t border-border mt-1 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  ) : (
                    <button 
                      onClick={() => { setShowProfile(false); clearProfile(); navigate('/'); }} 
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs text-muted-foreground hover:text-red-500 hover:bg-muted/50 transition-colors text-left border-t border-border mt-1 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Reset App Data
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Bottom Floating/Docked Navigation */}
      <nav
        aria-label="Main Navigation"
        className="fixed bottom-0 inset-x-0 sm:bottom-7 sm:left-1/2 sm:-translate-x-1/2 sm:inset-x-auto z-[100] pointer-events-auto select-none safe-bottom"
      >
          <div className="w-full sm:w-auto px-1.5 py-1 sm:p-2 sm:rounded-full flex items-center justify-around sm:justify-start gap-0.5 sm:gap-2 border-t sm:border border-white/10 sm:border-white/20 shadow-[0_-8px_30px_rgba(0,0,0,0.85)] sm:shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)] backdrop-blur-3xl bg-[#0a0b10]/95 sm:bg-[#0a0b10]/85 sm:ring-1 sm:ring-brand/30 transition-all duration-300">
            {navLinks.map((link) => {
              const isActive = link.href === '/' ? currentPath === '/' : currentPath.startsWith(link.href);
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "relative flex flex-col sm:flex-row items-center justify-center transition-all duration-200 group cursor-pointer tap-active",
                    "flex-1 sm:flex-none py-1 sm:py-0 h-12 sm:h-12 w-auto sm:w-12 sm:rounded-full",
                    isActive
                      ? "text-brand sm:text-brand-foreground"
                      : "text-white/60 hover:text-white sm:hover:bg-white/10 active:scale-95"
                  )}
                  aria-label={link.name}
                  title={link.name}
                >
                  {/* Desktop active pill */}
                  {isActive && (
                    <motion.div
                      layoutId="active-dock-pill"
                      className="hidden sm:block absolute inset-0 rounded-full bg-brand shadow-[0_0_24px_var(--theme-accent-glow,rgba(232,133,42,0.6))] ring-1 ring-brand/50"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 28,
                      }}
                    />
                  )}

                  {/* Mobile top active indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="active-mobile-bar"
                      className="sm:hidden absolute top-0 inset-x-2 h-0.5 rounded-full bg-brand shadow-[0_0_8px_var(--theme-accent-glow,rgba(232,133,42,0.9))]"
                    />
                  )}

                  <Icon
                    className={cn(
                      "relative z-10 w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-brand sm:text-brand-foreground font-bold" : "text-white/70 group-hover:text-white"
                    )}
                  />

                  {/* Micro label for mobile screens */}
                  <span
                    className={cn(
                      "sm:hidden text-[9px] font-medium tracking-tight mt-0.5 leading-none transition-colors truncate max-w-[56px] text-center",
                      isActive ? "text-brand font-bold" : "text-white/60"
                    )}
                  >
                    {link.name}
                  </span>

                  {/* Micro Tooltip on Hover for desktop */}
                  <span className="hidden sm:block absolute -top-9 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200 pointer-events-none px-2.5 py-1 rounded-full text-[10px] font-bold font-display uppercase tracking-wider bg-black/80 backdrop-blur-md text-white border border-white/15 shadow-xl whitespace-nowrap">
                    {link.name}
                  </span>
                </a>
              );
            })}
          </div>
        </nav>

    </>
  );
}
