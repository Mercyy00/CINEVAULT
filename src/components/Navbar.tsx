import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useApp, Theme } from '../store';
import { APP_FONTS, APP_FONT_IDS, loadAppFont } from '../lib/fonts';
import { getUserAvatarUrl } from '../lib/avatars';
import { Search, Palette, Settings, LogOut, Home, Film, Tv, Sparkles, Bookmark, User, Download, Type, ArrowLeft, Music, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { BirthdayCountdown } from './BirthdayCountdown';
import { isBirthdayVisible } from '../config/birthdayAccess';
import { useBirthdayMusic } from '../context/BirthdayMusicContext';

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
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);

  const [customizerTab, setCustomizerTab] = useState<'themes' | 'fonts'>('themes');
  const [themeModeFilter, setThemeModeFilter] = useState<'all' | 'dark' | 'light'>('all');
  const { 
    theme, 
    setTheme, 
    appFont, 
    setAppFont, 
    showToast, 
    userProfile, 
    clearProfile, 
    deferredInstallPrompt, 
    setDeferredInstallPrompt,
    setAuthModalOpen,
    setAuthModalMode,
    logout
  } = useApp();
  const [currentHash, setCurrentHash] = useState('#home');

  const {
    playlist: BIRTHDAY_PLAYLIST,
    currentTrackIndex,
    isPlaying: isPlayingMusic,
    progress: trackProgress,
    duration: trackDuration,
    togglePlay: toggleMusic,
    playTrack: startMusic,
    nextTrack: handleNextTrack,
    prevTrack: handlePrevTrack,
    seekTo,
    formatTime
  } = useBirthdayMusic();

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seekTo(time);
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash || '#home';
      setCurrentHash(hash.split('/')[0]);
      setShowMusicPlayer(false);
      setShowCustomizer(false);
      setShowProfile(false);
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.header-popup-container')) {
        setShowMusicPlayer(false);
        setShowCustomizer(false);
        setShowProfile(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMusicPlayer(false);
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
    { name: 'Home', href: '#home', icon: Home },
    { name: 'Movies', href: '#movies', icon: Film },
    { name: 'TV Shows', href: '#tvshows', icon: Tv },
    { name: 'Anime', href: '#anime', icon: Sparkles },
    { name: 'My List', href: '#mylist', icon: Bookmark },
    { name: 'Profile', href: '#profile', icon: User }
  ];

  const darkThemes = THEMES.filter(t => t.mode === 'dark');
  const lightThemes = THEMES.filter(t => t.mode === 'light');

  // Shared with App.tsx and AdminDashboard via config/birthdayAccess. This used
  // to be a third copy of the raw localStorage-key check.
  const isBirthdayActive = isBirthdayVisible(currentHash);

  return (
    <>
      {/* Top Header */}
      <header className="fixed top-0 inset-x-0 z-[100] bg-gradient-to-b from-background/90 via-background/40 to-transparent py-2.5 sm:py-4 px-3 sm:px-8 flex items-center justify-between gap-1.5 sm:gap-4 pointer-events-none backdrop-blur-[2px] max-w-full">
        {currentHash === '#birthday' ? (
          <a
            href="#home"
            className="pointer-events-auto flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full glass border border-white/10 hover:border-brand/40 text-xs sm:text-sm font-semibold text-foreground hover:text-brand transition-all shadow-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to CineVault</span>
          </a>
        ) : (
          <a 
            href="#home" 
            className="pointer-events-auto font-display font-black text-xl sm:text-3xl lg:text-4xl text-brand tracking-tight flex items-center gap-1.5 sm:gap-3 group transition-transform hover:scale-[1.02] drop-shadow-md shrink-0"
          >
            <div 
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 bg-brand transition-all shrink-0 drop-shadow-md group-hover:rotate-6",
                userProfile.logoStyle === 'cat' ? "brand-logo-cat" : "brand-logo-vault"
              )} 
            />
            <span className="hidden sm:inline text-brand">
              CineVault
            </span>
          </a>
        )}

        {/* Center: Birthday Countdown Widget (Hidden on Birthday Page & Gated) */}
        <div className="flex items-center justify-center pointer-events-auto min-w-0">
          {isBirthdayActive && currentHash !== '#birthday' && <BirthdayCountdown />}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 pointer-events-auto shrink-0">
          {/* Customizer (Themes & Fonts) Toggle */}
          <div className="relative header-popup-container">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setShowCustomizer(!showCustomizer); 
                setShowProfile(false); 
                setShowMusicPlayer(false); 
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
                              style={{ fontFamily: `'${f.name}', sans-serif` }}
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

          {/* Music Button on Birthday Page, Search on other pages */}
          {currentHash === '#birthday' ? (
            <div className="relative header-popup-container">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMusicPlayer(!showMusicPlayer);
                  setShowProfile(false);
                  setShowCustomizer(false);
                }}
                className={cn(
                  "h-9 w-9 sm:h-10 sm:w-10 rounded-full glass border flex items-center justify-center transition-all shadow-card cursor-pointer relative",
                  isPlayingMusic 
                    ? "border-brand/60 text-brand bg-brand/15 shadow-[0_0_15px_var(--theme-accent-glow,rgba(232,133,42,0.35))]" 
                    : "border-white/10 text-foreground hover:text-brand hover:border-brand/30"
                )}
                aria-label="Birthday Music Player"
                title="Divu's Birthday Mixtape 🎵"
              >
                <Music className={cn("w-4 h-4 sm:w-5 sm:h-5 transition-transform", isPlayingMusic && "scale-110 text-brand animate-pulse")} />
                {isPlayingMusic && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-pink-500 rounded-full animate-ping" />
                )}
              </button>

              {/* Music Player Popover */}
              <AnimatePresence>
                {showMusicPlayer && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-80 sm:w-88 glass bg-card/95 border border-border rounded-3xl p-4 sm:p-5 shadow-2xl z-[220] origin-top-right backdrop-blur-2xl"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-brand/15 border border-brand/30 text-brand flex items-center justify-center">
                          <Music className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-display font-bold text-foreground">Divu's 21st Mixtape</h4>
                          <p className="text-[10px] text-muted-foreground">Our Special Soundtrack 💖</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowMusicPlayer(false)}
                        className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-white/5"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Active Track Highlight */}
                    <div className="glass border border-brand/25 rounded-2xl p-3.5 mb-3.5 bg-brand/5 relative overflow-hidden flex items-center gap-3">
                      {/* Rotating Vinyl */}
                      <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                        <motion.div 
                          animate={{ rotate: isPlayingMusic ? 360 : 0 }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                          className="w-full h-full rounded-full bg-black border-2 border-brand/40 flex items-center justify-center shadow-md relative"
                        >
                          <div className="w-4 h-4 rounded-full bg-brand/30 border border-brand flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                          </div>
                        </motion.div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {BIRTHDAY_PLAYLIST[currentTrackIndex].title}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {BIRTHDAY_PLAYLIST[currentTrackIndex].artist}
                        </p>
                        <span className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full bg-brand/15 border border-brand/30 text-brand font-medium">
                          {BIRTHDAY_PLAYLIST[currentTrackIndex].tag}
                        </span>
                      </div>
                    </div>

                    {/* Track Progress Seekbar */}
                    <div className="mb-3 px-1">
                      <input
                        type="range"
                        min={0}
                        max={trackDuration || 100}
                        value={trackProgress}
                        onChange={handleSeek}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-muted-foreground mt-1">
                        <span>{formatTime(trackProgress)}</span>
                        <span>{formatTime(trackDuration)}</span>
                      </div>
                    </div>

                    {/* Player Controls */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <button
                        onClick={handlePrevTrack}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-foreground flex items-center justify-center border border-white/10 transition-transform active:scale-95 cursor-pointer"
                        title="Previous Song"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>
                      <button
                        onClick={toggleMusic}
                        className="w-11 h-11 rounded-full bg-brand text-background flex items-center justify-center font-bold shadow-lg shadow-brand/25 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                        title={isPlayingMusic ? "Pause" : "Play"}
                      >
                        {isPlayingMusic ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                      </button>
                      <button
                        onClick={handleNextTrack}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-foreground flex items-center justify-center border border-white/10 transition-transform active:scale-95 cursor-pointer"
                        title="Next Song"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Track Selection List */}
                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                      {BIRTHDAY_PLAYLIST.map((track, idx) => (
                        <button
                          key={track.id}
                          onClick={() => startMusic(idx)}
                          className={cn(
                            "w-full flex items-center justify-between p-2 rounded-xl text-left transition-all text-xs cursor-pointer",
                            currentTrackIndex === idx
                              ? "bg-brand/15 border border-brand/30 text-brand font-semibold"
                              : "hover:bg-white/5 text-foreground/80 hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-[10px] font-mono text-muted-foreground w-3.5">{idx + 1}</span>
                            <span className="truncate">{track.title}</span>
                          </div>
                          {currentTrackIndex === idx && isPlayingMusic ? (
                            <span className="text-[10px] text-pink-500 animate-pulse font-bold shrink-0">Playing 🎵</span>
                          ) : (
                            <span className="text-[9px] text-muted-foreground shrink-0">{track.mood}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button 
              onClick={() => {
                setShowCustomizer(false);
                setShowProfile(false);
                setShowMusicPlayer(false);
                onSearchClick();
              }}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full glass border border-white/10 flex items-center justify-center text-foreground hover:text-brand transition-colors shadow-card"
              aria-label="Search"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" />
            </button>
          )}
          
          <div className="relative header-popup-container">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setShowProfile(!showProfile); 
                setShowCustomizer(false); 
                setShowMusicPlayer(false); 
              }}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full glass border border-white/15 flex items-center justify-center text-foreground hover:border-brand/40 transition-all shadow-card cursor-pointer p-0.5 hover:scale-105 active:scale-95 overflow-hidden"
              aria-label="User Account"
            >
              <img
                src={getUserAvatarUrl(userProfile.avatar, userProfile.name || 'Cinephile')}
                alt="Profile Avatar"
                className="w-full h-full object-contain rounded-full"
              />
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-3 w-56 bg-card rounded-2xl shadow-2xl py-2 border border-border origin-top-right flex flex-col z-[200] text-foreground"
                >
                  <div className="px-4 py-2.5 border-b border-border mb-1 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-black/60 border border-brand/40 flex items-center justify-center p-0.5 shrink-0 shadow-sm">
                      <img
                        src={getUserAvatarUrl(userProfile.avatar, userProfile.name || 'Cinephile')}
                        alt="User Avatar"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate">{userProfile.name || 'Guest'}</p>
                      <p className="text-xs text-muted-foreground truncate">{userProfile.isLoggedIn ? userProfile.email : 'Local Session'}</p>
                    </div>
                  </div>

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

                  <a href="#profile" onClick={() => setShowProfile(false)} className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                    <Settings className="w-4 h-4" /> Profile & Settings
                  </a>
                  
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
                      onClick={() => { setShowProfile(false); clearProfile(); window.location.hash='#home'; }} 
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

      {/* Bottom Floating Dock (Hidden on Birthday Page) */}
      {currentHash !== '#birthday' && (
        <nav
          aria-label="Main Navigation"
          className="fixed bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto select-none"
        >
          <div className="rounded-full p-1.5 sm:p-2 flex items-center gap-1 sm:gap-2 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)] backdrop-blur-3xl bg-[#0a0b10]/85 ring-1 ring-brand/30 transition-all duration-300">
            {navLinks.map((link) => {
              const isActive = currentHash === link.href;
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "relative h-11 w-11 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all duration-300 group cursor-pointer",
                    isActive
                      ? "text-brand-foreground"
                      : "text-white/70 hover:text-white hover:bg-white/10 active:scale-95"
                  )}
                  aria-label={link.name}
                  title={link.name}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-dock-pill"
                      className="absolute inset-0 rounded-full bg-brand shadow-[0_0_24px_var(--theme-accent-glow,rgba(232,133,42,0.6))] ring-1 ring-brand/50"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 28,
                      }}
                    />
                  )}
                  <Icon
                    className={cn(
                      "relative z-10 w-5 h-5 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-brand-foreground font-bold" : "text-white/75 group-hover:text-white"
                    )}
                  />

                  {/* Micro Tooltip on Hover */}
                  <span className="absolute -top-9 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200 pointer-events-none px-2.5 py-1 rounded-full text-[10px] font-bold font-display uppercase tracking-wider bg-black/80 backdrop-blur-md text-white border border-white/15 shadow-xl whitespace-nowrap">
                    {link.name}
                  </span>
                </a>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}
