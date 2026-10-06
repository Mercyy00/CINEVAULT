import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useApp, Theme } from '../store';
import { APP_FONTS, APP_FONT_IDS, loadAppFont } from '../lib/fonts';
import { getUserAvatarUrl, getFallbackAvatarDataUri } from '../lib/avatars';
import {
  Search,
  Palette,
  Settings,
  LogOut,
  Home,
  Film,
  Tv,
  Sparkles,
  Bookmark,
  User,
  Download,
  Type,
  Users,
  ShieldCheck,
  Moon,
  Sun,
  Dice5,
} from 'lucide-react';
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
  { id: 'crimson-premiere', name: '7Movies Clean', mode: 'dark', color: '#f3f0ea', bg: '#0b0b0d' },
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
    logout,
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
    { name: 'Home', href: '/' },
    { name: 'Movies', href: '/movies' },
    { name: 'TV', href: '/tvshows' },
    { name: 'Anime', href: '/anime' },
    { name: 'My List', href: '/mylist' },
  ];

  const mobileNavLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Movies', href: '/movies', icon: Film },
    { name: 'TV', href: '/tvshows', icon: Tv },
    { name: 'Anime', href: '/anime', icon: Sparkles },
    { name: 'My List', href: '/mylist', icon: Bookmark },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const darkThemes = THEMES.filter((t) => t.mode === 'dark');
  const lightThemes = THEMES.filter((t) => t.mode === 'light');

  return (
    <>
      {/* ─── Mobile Top Header: Brand & Search ────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-[100] px-4 py-3 flex items-center justify-between pointer-events-none md:hidden bg-gradient-to-b from-[#0b0b0d]/95 via-[#0b0b0d]/70 to-transparent backdrop-blur-[4px] safe-top">
        <a
          href="/"
          className="pointer-events-auto flex items-center gap-2 group transition-transform active:scale-95"
          aria-label="CineVault Home"
        >
          <span className="footer-brand-badge text-xs min-w-[28px] h-[24px] px-1.5 rounded-[6px]">
            CV
          </span>
          <span className="font-display font-extrabold text-xl text-white tracking-tight">
            CineVault
          </span>
        </a>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onSearchClick}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            aria-label="Search titles"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── 7Movies Desktop Floating Topbar & Pill Navigation ────────── */}
      <header className="topbar hidden md:flex items-center justify-center">
        {/* Left: Brand Logo & Title */}
        <a
          href="/"
          className="desktop-nav-brand group hover:scale-[1.02] transition-transform"
          aria-label="CineVault Home"
        >
          <span className="footer-brand-badge text-sm min-w-[34px] h-[28px] px-2 rounded-[8px] mr-1.5 shadow-sm">
            CV
          </span>
          <span className="font-display font-extrabold text-[22px] tracking-tight text-white group-hover:text-[#f3f0ea] transition-colors">
            CineVault
          </span>
        </a>

        {/* Center: 7movies Floating Nav Pill */}
        <nav className="nav-pill" aria-label="Primary navigation">
          {/* Tab Links with Animated Active Capsule */}
          <div className="tab-links">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? currentPath === '/'
                  : currentPath.startsWith(link.href);

              return (
                <a
                  key={link.name}
                  href={link.href}
                  className={cn(
                    'relative px-4 py-2 font-body text-[13px] font-bold transition-colors select-none',
                    isActive ? 'active text-[#111]' : 'text-white/75 hover:text-[#f3f0ea]'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <motion.span
                      layoutId="7movies-nav-indicator"
                      className="nav-indicator inset-0 w-full"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 32,
                      }}
                    />
                  )}
                  <span className="relative z-10">{link.name}</span>
                </a>
              );
            })}
          </div>

          {/* Divider */}
          <span className="nav-divider" aria-hidden="true" />

          {/* Nav Actions (Search, Palette, Profile/Settings) */}
          <div className="nav-actions">
            {/* Search Button */}
            <button
              type="button"
              onClick={onSearchClick}
              className="nav-action"
              aria-label="Search"
              title="Search (Ctrl + K)"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Customizer (Themes & Fonts) Toggle */}
            <div className="relative header-popup-container">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCustomizer(!showCustomizer);
                  setShowProfile(false);
                }}
                className={cn('nav-action', showCustomizer && 'active-action')}
                aria-label="Customize theme and typography"
                title="Themes & Typography"
              >
                <Palette className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showCustomizer && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-72 sm:w-80 max-h-[80vh] overflow-y-auto custom-scrollbar bg-[#111215]/95 backdrop-blur-2xl rounded-2xl shadow-[0_18px_50px_rgba(0,0,0,0.8)] p-3.5 border border-white/12 origin-top-right flex flex-col gap-3 z-[110]"
                  >
                    {/* Tab bar */}
                    <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/5">
                      <button
                        onClick={() => setCustomizerTab('themes')}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                          customizerTab === 'themes'
                            ? 'bg-white/15 text-[#f3f0ea] shadow-sm'
                            : 'text-[#929093] hover:text-[#f3f0ea]'
                        )}
                      >
                        <Palette className="w-3.5 h-3.5" /> Themes ({THEMES.length})
                      </button>
                      <button
                        onClick={() => setCustomizerTab('fonts')}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                          customizerTab === 'fonts'
                            ? 'bg-white/15 text-[#f3f0ea] shadow-sm'
                            : 'text-[#929093] hover:text-[#f3f0ea]'
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
                              'flex-1 py-1 rounded-md font-medium transition-all text-center',
                              themeModeFilter === 'all'
                                ? 'bg-[#f3f0ea] text-[#0b0b0d] font-bold shadow-sm'
                                : 'text-[#929093] hover:text-[#f3f0ea]'
                            )}
                          >
                            All ({THEMES.length})
                          </button>
                          <button
                            onClick={() => setThemeModeFilter('dark')}
                            className={cn(
                              'flex-1 py-1 rounded-md font-medium transition-all text-center flex items-center justify-center gap-1',
                              themeModeFilter === 'dark'
                                ? 'bg-[#f3f0ea] text-[#0b0b0d] font-bold shadow-sm'
                                : 'text-[#929093] hover:text-[#f3f0ea]'
                            )}
                          >
                            <Moon className="w-3 h-3" /> Dark ({darkThemes.length})
                          </button>
                          <button
                            onClick={() => setThemeModeFilter('light')}
                            className={cn(
                              'flex-1 py-1 rounded-md font-medium transition-all text-center flex items-center justify-center gap-1',
                              themeModeFilter === 'light'
                                ? 'bg-[#f3f0ea] text-[#0b0b0d] font-bold shadow-sm'
                                : 'text-[#929093] hover:text-[#f3f0ea]'
                            )}
                          >
                            <Sun className="w-3 h-3" /> Light ({lightThemes.length})
                          </button>
                        </div>

                        {/* Dark Themes Group */}
                        {(themeModeFilter === 'all' || themeModeFilter === 'dark') && (
                          <div className="flex flex-col gap-1.5 pt-1">
                            <div className="flex items-center justify-between px-1">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-[#929093] flex items-center gap-1 font-mono">
                                <Moon className="w-3 h-3" /> Dark Themes
                              </span>
                              <span className="text-[10px] text-[#929093] font-mono">
                                {darkThemes.length}
                              </span>
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
                                    'flex items-center gap-2 p-2 rounded-xl border transition-all text-left group cursor-pointer',
                                    theme === t.id
                                      ? 'bg-white/15 border-white/40 ring-1 ring-white/20'
                                      : 'border-white/5 bg-white/5 hover:bg-white/10'
                                  )}
                                >
                                  <div
                                    className="w-4 h-4 rounded-full shrink-0 border border-white/20 shadow-sm flex items-center justify-center relative overflow-hidden"
                                    style={{ backgroundColor: t.bg }}
                                  >
                                    <div
                                      className="w-1.5 h-1.5 rounded-full"
                                      style={{ backgroundColor: t.color }}
                                    />
                                  </div>
                                  <span className="text-[11px] font-medium text-[#f3f0ea] truncate">
                                    {t.name}
                                  </span>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Light Themes Group */}
                        {(themeModeFilter === 'all' || themeModeFilter === 'light') && (
                          <div className="flex flex-col gap-1.5 pt-1.5">
                            <div className="flex items-center justify-between px-1">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-[#929093] flex items-center gap-1 font-mono">
                                <Sun className="w-3 h-3" /> Light Themes
                              </span>
                              <span className="text-[10px] text-[#929093] font-mono">
                                {lightThemes.length}
                              </span>
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
                                    'flex items-center gap-2 p-2 rounded-xl border transition-all text-left group cursor-pointer',
                                    theme === t.id
                                      ? 'bg-white/15 border-white/40 ring-1 ring-white/20'
                                      : 'border-white/5 bg-white/5 hover:bg-white/10'
                                  )}
                                >
                                  <div
                                    className="w-4 h-4 rounded-full shrink-0 border border-white/20 shadow-sm flex items-center justify-center relative overflow-hidden"
                                    style={{ backgroundColor: t.bg }}
                                  >
                                    <div
                                      className="w-1.5 h-1.5 rounded-full"
                                      style={{ backgroundColor: t.color }}
                                    />
                                  </div>
                                  <span className="text-[11px] font-medium text-[#f3f0ea] truncate">
                                    {t.name}
                                  </span>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Fonts Tab */
                      <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#929093] px-1 font-mono">
                          Display & Heading Font
                        </span>
                        <div className="grid grid-cols-1 gap-1">
                          {FONTS.map((f) => (
                            <button
                              key={f.id}
                              onClick={() => {
                                setAppFont(f.id as any);
                                showToast(`Typography set: ${f.name}`);
                              }}
                              className={cn(
                                'flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer',
                                appFont === f.id
                                  ? 'bg-white/15 border-white/30 text-[#f3f0ea]'
                                  : 'border-white/5 bg-white/5 hover:bg-white/10 text-white/80'
                              )}
                            >
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold">{f.name}</span>
                                <span className="text-[10px] text-[#929093]">{f.tag}</span>
                              </div>
                              <span className="text-sm font-black opacity-60">Ag</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar & Menu Toggle */}
            <div className="relative header-popup-container">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfile(!showProfile);
                  setShowCustomizer(false);
                }}
                className={cn(
                  'w-8 h-8 rounded-full border overflow-hidden flex items-center justify-center transition-all cursor-pointer relative',
                  showProfile
                    ? 'border-white ring-2 ring-white/30'
                    : isKidsMode
                    ? 'border-pink-500/60 ring-2 ring-pink-500/20'
                    : 'border-white/20 hover:border-white/50'
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
                    className="absolute right-0 mt-3 w-64 bg-[#111215]/95 backdrop-blur-2xl rounded-2xl shadow-[0_18px_50px_rgba(0,0,0,0.8)] py-2 border border-white/12 origin-top-right flex flex-col z-[200] text-[#f3f0ea]"
                  >
                    {/* Current Active Profile Banner */}
                    <div className="px-4 py-2.5 border-b border-white/10 mb-1 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl overflow-hidden bg-black/60 border border-white/20 flex items-center justify-center p-0.5 shrink-0 shadow-sm relative">
                        <img
                          src={getUserAvatarUrl(
                            activeProfile.avatar,
                            activeProfile.name || 'Cinephile'
                          )}
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
                          <p className="text-sm font-bold text-foreground truncate">
                            {activeProfile.name || 'Guest'}
                          </p>
                          {isKidsMode && (
                            <span className="px-1.5 py-px rounded text-[9px] font-black bg-pink-500/20 text-pink-400 border border-pink-500/30">
                              KIDS
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {userProfile.isLoggedIn ? userProfile.email : 'Local Household'}
                        </p>
                      </div>
                    </div>

                    {/* Switch Profile Action */}
                    <a
                      href="/profiles"
                      onClick={() => setShowProfile(false)}
                      className="flex items-center justify-between px-4 py-2 text-xs font-semibold text-foreground hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-brand" />
                        <span>Switch Profile</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full font-mono">
                        {profiles.length} profiles
                      </span>
                    </a>

                    {/* Quick Profile Switcher Row */}
                    {profiles.length > 1 && (
                      <div className="px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto border-y border-white/5 bg-white/[0.02]">
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
                                'w-8 h-8 rounded-xl p-0.5 border transition-all shrink-0 cursor-pointer overflow-hidden flex items-center justify-center relative',
                                isCurrent
                                  ? 'border-white ring-1 ring-white bg-white/10'
                                  : 'border-white/10 opacity-70 hover:opacity-100 hover:border-white/40'
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
                          className="w-full py-2 px-3 rounded-xl bg-[#f3f0ea] text-[#0b0b0d] font-bold text-xs hover:bg-white transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
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
                        className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-white hover:bg-white/10 transition-colors text-left border-y border-white/5 bg-white/5 cursor-pointer"
                      >
                        <Download className="w-4 h-4" /> Install App
                      </button>
                    )}

                    <a
                      href="/profile"
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-[#929093] hover:text-[#f3f0ea] hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4" /> Profile & Settings
                    </a>

                    {isAdmin && (
                      <a
                        href="/admin"
                        onClick={() => setShowProfile(false)}
                        className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" /> Admin Dashboard
                      </a>
                    )}

                    {/* Display Mode Switcher */}
                    <div className="px-4 py-2.5 border-t border-white/5 flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold text-[#929093] uppercase tracking-wider font-mono">
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
                                'flex-1 py-1 text-[10px] font-semibold rounded-lg capitalize transition-all text-center cursor-pointer',
                                active
                                  ? 'bg-[#f3f0ea] text-[#0b0b0d] font-bold shadow-sm'
                                  : 'text-[#929093] hover:text-[#f3f0ea]'
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
                      className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-[#929093] hover:text-[#f3f0ea] hover:bg-white/5 transition-colors text-left cursor-pointer"
                    >
                      <Dice5 className="w-4 h-4" /> Surprise Me
                    </button>

                    {userProfile.isLoggedIn ? (
                      <button
                        onClick={() => {
                          setShowProfile(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors text-left border-t border-white/10 mt-1 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowProfile(false);
                          clearProfile();
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-xs text-[#929093] hover:text-red-400 hover:bg-white/5 transition-colors text-left border-t border-white/10 mt-1 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Reset App Data
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </nav>
      </header>

      {/* ─── Mobile Floating Dock Navigation ─────────────────────────── */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-[100] md:hidden pointer-events-auto select-none safe-bottom pb-2 flex justify-center px-3"
      >
        <div className="nav-pill w-full max-w-md flex items-center justify-between px-2 py-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.85)]">
          {mobileNavLinks.map((link) => {
            const isActive =
              link.href === '/'
                ? currentPath === '/'
                : currentPath.startsWith(link.href);
            const Icon = link.icon;

            return (
              <a
                key={link.name}
                href={link.href}
                className={cn(
                  'relative flex flex-col items-center justify-center flex-1 h-10 rounded-full transition-all duration-200 cursor-pointer tap-active',
                  isActive ? 'text-[#111]' : 'text-white/60 hover:text-white'
                )}
                aria-label={link.name}
              >
                {isActive && (
                  <motion.div
                    layoutId="7movies-mobile-pill"
                    className="absolute inset-0 rounded-full bg-[#f3f0ea]"
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 32,
                    }}
                  />
                )}
                <Icon
                  className={cn(
                    'relative z-10 w-4 h-4 transition-transform',
                    isActive ? 'text-[#111] stroke-[2.5]' : 'text-white/70'
                  )}
                />
                <span
                  className={cn(
                    'relative z-10 text-[9px] font-bold leading-none mt-0.5 tracking-tight',
                    isActive ? 'text-[#111]' : 'text-white/60'
                  )}
                >
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
