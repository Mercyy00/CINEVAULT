import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useApp, Theme, AppFont } from '../store';
import { Search, Palette, Settings, LogOut, Home, Film, Tv, Sparkles, Bookmark, User, Download, Type } from 'lucide-react';
import { BirthdayCountdown } from './BirthdayCountdown';

interface ThemeOption {
  id: Theme;
  name: string;
  mode: 'dark' | 'light';
  color: string;
  bg: string;
}

const THEMES: ThemeOption[] = [
  // Dark Themes
  { id: 'cinematic-dark', name: 'Cinematic Dark', mode: 'dark', color: '#e8852a', bg: '#0a0a0a' },
  { id: 'cherry-cola', name: 'Cherry & Vanilla', mode: 'dark', color: '#efe6dd', bg: '#1a0305' },
  { id: 'butter-green', name: 'Butter & Forest', mode: 'dark', color: '#ffefb3', bg: '#013e37' },
  { id: 'bistre-aureolin', name: 'Bistre & Gold', mode: 'dark', color: '#fbe311', bg: '#190e04' },
  { id: 'vibrant-lime', name: 'Lime & Black', mode: 'dark', color: '#d3f00a', bg: '#0b0e02' },
  { id: 'imperial-violet', name: 'Imperial Violet', mode: 'dark', color: '#e2cbff', bg: '#190b24' },
  { id: 'midnight-ocean', name: 'Midnight Ocean', mode: 'dark', color: '#00f5d4', bg: '#0a1128' },
  { id: 'crimson-premiere', name: 'Crimson Premiere', mode: 'dark', color: '#ffffff', bg: '#141414' },
  { id: 'neon-cyberpunk', name: 'Neon Cyberpunk', mode: 'dark', color: '#05d9e8', bg: '#1a0b2e' },
  // Light Themes
  { id: 'elegant-light', name: 'Elegant Ivory', mode: 'light', color: '#3e2723', bg: '#f5f0e8' },
  { id: 'clean-daylight', name: 'Clean Daylight', mode: 'light', color: '#0f172a', bg: '#ffffff' },
  { id: 'vanilla-cherry', name: 'Vanilla & Cherry', mode: 'light', color: '#9a0002', bg: '#fdfaf7' },
  { id: 'nordic-frost', name: 'Nordic Frost', mode: 'light', color: '#0284c7', bg: '#f0f4f8' },
  { id: 'matcha-cream', name: 'Matcha & Cream', mode: 'light', color: '#2d6a4f', bg: '#f4f7f2' },
  { id: 'sunset-rose', name: 'Sunset Rose', mode: 'light', color: '#e11d48', bg: '#fdf6f6' },
];

const FONTS: { id: AppFont; name: string; tag: string; preview: string }[] = [
  { id: 'bricolage', name: 'Bricolage', tag: 'Default', preview: 'Bricolage Grotesque' },
  { id: 'dinko', name: 'DINKO', tag: 'Retro Bold', preview: 'GC Dinko' },
  { id: 'inklab', name: 'Inklab', tag: 'Geometric', preview: 'GC Inklab' },
  { id: 'gunken', name: 'GUNKEN', tag: 'Futuristic', preview: 'Gunken' },
  { id: 'odida', name: 'Odida', tag: 'Luxury', preview: 'Odida Serif' },
  { id: 'melodrama', name: 'Melodrama', tag: 'High Contrast', preview: 'Melodrama' },
  { id: 'talina', name: 'Talina', tag: 'Playful', preview: 'Talina' },
  { id: 'grind', name: 'GRIND', tag: 'Heavy Impact', preview: 'GC Grind' },
];

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
    clearProfile, 
    deferredInstallPrompt, 
    setDeferredInstallPrompt,
    setAuthModalOpen,
    setAuthModalMode,
    logout
  } = useApp();
  const [currentHash, setCurrentHash] = useState('#home');

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash || '#home';
      setCurrentHash(hash.split('/')[0]);
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
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

  return (
    <>
      {/* Top Header */}
      <header className="fixed top-0 inset-x-0 z-[100] bg-gradient-to-b from-background/90 via-background/40 to-transparent py-4 px-6 sm:px-8 flex items-center justify-between pointer-events-none backdrop-blur-[2px]">
        <a 
          href="#home" 
          className="pointer-events-auto font-display font-black text-2xl sm:text-3xl lg:text-4xl text-brand tracking-tight flex items-center gap-2.5 sm:gap-3 group transition-transform hover:scale-[1.02] drop-shadow-md"
        >
          <div 
            className={cn(
              "w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 bg-brand transition-all shrink-0 drop-shadow-md group-hover:rotate-6",
              userProfile.logoStyle === 'cat' ? "brand-logo-cat" : "brand-logo-vault"
            )} 
          />
          <span className="text-brand">
            CineVault
          </span>
        </a>

        {/* Center: Birthday Countdown Widget */}
        <div className="flex items-center justify-center pointer-events-auto">
          <BirthdayCountdown />
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 pointer-events-auto">
          {/* Customizer (Themes & Fonts) Toggle */}
          <div className="relative">
            <button 
              onClick={() => { setShowCustomizer(!showCustomizer); setShowProfile(false); }}
              className="h-10 w-10 rounded-full glass border border-white/10 flex items-center justify-center text-foreground hover:text-brand transition-colors shadow-card"
              aria-label="Customize theme and typography"
            >
              <Palette className="w-5 h-5 opacity-80" />
            </button>
            <AnimatePresence>
              {showCustomizer && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-4 w-80 glass rounded-2xl shadow-card p-3.5 border border-white/10 origin-top-right flex flex-col gap-3"
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
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => {
                            setAppFont(f.id);
                            showToast(`Font updated: ${f.name}`);
                          }}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-xl border transition-all text-left",
                            appFont === f.id ? "bg-white/15 border-brand ring-1 ring-brand/30" : "border-white/5 bg-white/5 hover:bg-white/10"
                          )}
                        >
                          <div className="flex flex-col">
                            <span 
                              className="text-xs font-bold text-foreground"
                              style={{ 
                                fontFamily: f.id === 'bricolage' ? 'Bricolage Grotesque, sans-serif'
                                  : f.id === 'dinko' ? 'DINKO, Syne, sans-serif'
                                  : f.id === 'inklab' ? 'Inklab, Clash Display, sans-serif'
                                  : f.id === 'gunken' ? 'GUNKEN, Orbitron, sans-serif'
                                  : f.id === 'odida' ? 'Odida, Cinzel, serif'
                                  : f.id === 'melodrama' ? 'Melodrama, serif'
                                  : f.id === 'talina' ? 'Talina, Fredoka, cursive'
                                  : 'GRIND, Anton, sans-serif'
                              }}
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

          <button 
            onClick={onSearchClick}
            className="h-10 w-10 rounded-full glass border border-white/10 flex items-center justify-center text-foreground hover:text-brand transition-colors shadow-card"
            aria-label="Search"
          >
            <Search className="w-5 h-5 opacity-80" />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => { setShowProfile(!showProfile); setShowCustomizer(false); }}
              className="h-10 w-10 rounded-full glass border border-white/10 flex items-center justify-center text-foreground hover:text-brand transition-colors shadow-card cursor-pointer"
              aria-label="User Account"
            >
              {userProfile.isLoggedIn ? (
                <span className="text-xs font-bold text-brand font-mono">
                  {userProfile.name ? userProfile.name.substring(0, 2).toUpperCase() : 'U'}
                </span>
              ) : (
                <User className="w-5 h-5 opacity-80" />
              )}
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
                  <div className="px-4 py-2.5 border-b border-border mb-1">
                    <p className="text-sm font-bold text-foreground truncate">{userProfile.name || 'Guest'}</p>
                    <p className="text-xs text-muted-foreground truncate">{userProfile.isLoggedIn ? userProfile.email : 'Local Session'}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted border border-border">
                      <span className={cn("w-1.5 h-1.5 rounded-full", userProfile.isLoggedIn ? "bg-emerald-500 animate-pulse" : "bg-amber-500")} />
                      <span className="text-muted-foreground">{userProfile.isLoggedIn ? 'Cloud Sync Active' : 'Offline Storage'}</span>
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

      {/* Bottom Floating Dock */}
      <nav 
        aria-label="Main Navigation"
        className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto select-none"
      >
        <div className="rounded-full p-1.5 sm:p-2 flex items-center gap-1 sm:gap-1.5 border border-black/10 dark:border-white/15 shadow-[0_14px_35px_-8px_var(--theme-accent-glow,rgba(0,0,0,0.15))] backdrop-blur-2xl bg-white/85 dark:bg-black/65 ring-1 ring-brand/25 transition-all duration-300">
          {navLinks.map((link) => {
            const isActive = currentHash === link.href;
            const Icon = link.icon;
            return (
              <a 
                key={link.name} 
                href={link.href}
                className={cn(
                  "relative h-11 w-11 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-colors duration-200 group cursor-pointer",
                  isActive 
                    ? "text-brand-foreground" 
                    : "text-foreground/75 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 active:scale-95"
                )}
                aria-label={link.name}
                title={link.name}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-dock-pill"
                    className="absolute inset-0 rounded-full bg-brand shadow-[0_0_20px_var(--theme-accent-glow,rgba(232,133,42,0.45))] ring-1 ring-brand/35"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30
                    }}
                  />
                )}
                <Icon className={cn(
                  "relative z-10 w-5 h-5 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-brand-foreground font-bold" : "text-foreground/75 group-hover:text-foreground"
                )} />
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}
