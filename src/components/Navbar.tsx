import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useApp, Theme } from '../store';
import { Search, Palette, Settings, LogOut, Home, Film, Tv, Play, List, Download } from 'lucide-react';

const THEMES: { id: Theme; name: string; color: string }[] = [
  { id: 'cinematic-dark', name: 'Cinematic', color: '#d4a853' },
  { id: 'midnight-ocean', name: 'Ocean', color: '#00f5d4' },
  { id: 'crimson-premiere', name: 'Crimson', color: '#e50914' },
  { id: 'neon-cyberpunk', name: 'Cyberpunk', color: '#ff2a6d' },
  { id: 'elegant-light', name: 'Elegant', color: '#b8860b' },
  { id: 'clean-daylight', name: 'Daylight', color: '#2563eb' },
];

export function Navbar({ onSearchClick }: { onSearchClick: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const { theme, setTheme, showToast, userProfile, clearProfile, deferredInstallPrompt, setDeferredInstallPrompt } = useApp();
  const [currentHash, setCurrentHash] = useState('#home');

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 768) {
        setScrolled(window.scrollY > 50);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    { name: 'Anime', href: '#anime', icon: Play },
    { name: 'My List', href: '#mylist', icon: List }
  ];

  return (
    <>
      {/* Desktop Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'fixed top-0 inset-x-0 z-50 transition-all duration-300 hidden md:block',
          scrolled ? 'glass-panel py-4' : 'bg-transparent py-5'
        )}
      >
        <div className="max-w-[1600px] mx-auto px-10 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="#home" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-cv-gold rounded-sm flex items-center justify-center transform rotate-45 group-hover:rotate-90 transition-transform duration-500">
                <div className="w-4 h-4 border-2 border-cv-bg rounded-full"></div>
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-cv-gold">
                CineVault
              </span>
            </a>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "relative transition-colors group py-2",
                    currentHash === link.href ? "text-cv-gold" : "text-cv-slate hover:text-cv-cream"
                  )}
                >
                  {link.name}
                  <span className={cn(
                    "absolute bottom-0 left-0 h-[1px] bg-cv-gold transition-all duration-300",
                    currentHash === link.href ? "w-full" : "w-0 group-hover:w-full"
                  )} />
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={onSearchClick}
              className="text-cv-slate hover:text-cv-gold transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 opacity-60" />
            </button>
            
            <div className="relative">
              <button 
                onClick={() => { setShowThemes(!showThemes); setShowProfile(false); }}
                className="text-cv-slate hover:text-cv-gold transition-colors"
              >
                <Palette className="w-5 h-5 opacity-60" />
              </button>

              <AnimatePresence>
                {showThemes && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-4 w-48 glass-panel rounded-lg shadow-2xl p-3 border border-cv-gold/20 origin-top-right grid grid-cols-2 gap-2"
                  >
                    {THEMES.map((t, idx) => (
                      <motion.button
                        key={t.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => {
                          setTheme(t.id);
                          setShowThemes(false);
                          showToast(`Theme updated: ${t.name}`);
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded border transition-colors",
                          theme === t.id ? "bg-white/10 border-cv-gold" : "border-transparent hover:bg-white/5"
                        )}
                      >
                        <div className="w-4 h-4 rounded-full mb-1" style={{ backgroundColor: t.color }} />
                        <span className="text-[10px] text-cv-cream">{t.name}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button 
                onClick={() => { setShowProfile(!showProfile); setShowThemes(false); }}
                className="flex items-center text-cv-slate hover:text-cv-cream transition-colors"
              >
                <div className="w-9 h-9 rounded-full border border-cv-gold/30 p-0.5">
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-cv-gold to-amber-200 overflow-hidden">
                    <div className="w-full h-full bg-cv-panel flex items-center justify-center text-cv-cream">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M12 11v2"/><path d="M10 18h4"/></svg>
                    </div>
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {showProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-48 glass-panel rounded-lg shadow-2xl py-2 border border-cv-gold/20 origin-top-right flex flex-col"
                  >
                    <div className="px-4 py-2 border-b border-white/5 mb-1">
                      <p className="text-sm font-medium text-cv-cream truncate">{userProfile.name || 'Premium User'}</p>
                    </div>

                    {deferredInstallPrompt && (
                      <button 
                        onClick={async () => {
                          deferredInstallPrompt.prompt();
                          const { outcome } = await deferredInstallPrompt.userChoice;
                          if (outcome === 'accepted') {
                            setDeferredInstallPrompt(null);
                          }
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-cv-gold hover:text-cv-gold-light hover:bg-cv-gold/10 transition-colors text-left border-y border-cv-gold/10 bg-cv-gold/5"
                      >
                        <Download className="w-4 h-4" /> Install App
                      </button>
                    )}
                    <a href="#profile" onClick={() => setShowProfile(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-cv-slate hover:text-cv-gold hover:bg-white/5 transition-colors">
                      <Settings className="w-4 h-4" /> Profile & Settings
                    </a>
                    <button 
                      onClick={() => {
                        setShowProfile(false);
                        window.dispatchEvent(new CustomEvent('trigger-surprise-me'));
                      }} 
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-cv-slate hover:text-cv-gold hover:bg-white/5 transition-colors text-left"
                    >
                      <span className="text-base leading-none">🎲</span> Surprise Me
                    </button>
                    <button onClick={() => { setShowProfile(false); clearProfile(); window.location.hash='#home'; }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-cv-slate hover:text-cv-gold hover:bg-white/5 transition-colors text-left">
                      <LogOut className="w-4 h-4" /> Reset App Data
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Top Bar (Search & Brand only) */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 glass-panel py-3 px-4 flex justify-between items-center border-b-0 border-cv-gold/10">
        <a href="#home" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-cv-gold rounded-sm flex items-center justify-center transform rotate-45">
            <div className="w-3 h-3 border-2 border-cv-bg rounded-full"></div>
          </div>
          <span className="font-serif text-lg font-bold tracking-tight text-cv-gold">
            CineVault
          </span>
        </a>
        <div className="flex gap-4">
          <button onClick={() => setTheme(theme === 'cinematic-dark' ? 'elegant-light' : 'cinematic-dark')} className="text-cv-slate">
            <Palette className="w-5 h-5" />
          </button>
          <button onClick={onSearchClick} className="text-cv-slate">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div 
        className="md:hidden fixed bottom-0 inset-x-0 z-50 glass-panel border-t border-cv-gold/10 pb-safe"
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, transform: 'none' }}
      >
        <div className="flex justify-around items-center px-2 py-1">
          {navLinks.map((link) => {
            const isActive = currentHash === link.href;
            const Icon = link.icon;
            return (
              <a 
                key={link.name} 
                href={link.href}
                className={cn(
                  "relative flex flex-col items-center gap-1 p-3 w-16 transition-colors",
                  isActive ? "text-cv-gold" : "text-cv-slate"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-1 w-8 h-1 bg-cv-gold rounded-b-full shadow-[0_0_8px_rgba(212,168,83,0.8)]"
                  />
                )}
                <Icon className={cn("w-6 h-6", isActive && "fill-cv-gold/20")} />
                <span className="text-[10px] font-medium leading-none">{link.name}</span>
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
}
