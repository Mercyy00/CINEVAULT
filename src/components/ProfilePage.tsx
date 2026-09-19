import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Palette, 
  History, 
  Info, 
  Download, 
  X, 
  Sparkles, 
  Check, 
  Trash2, 
  Play, 
  Film, 
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Users
} from 'lucide-react';
import { useApp, Theme } from '../store';
import { APP_FONT_IDS, APP_FONTS, loadAppFont } from '../lib/fonts';
import { navigate, goToWatch } from '../lib/navigation';
import {
  PRESET_AVATARS,
  getUserAvatarUrl,
  getBoringAvatarUrl,
  THEME_BEAM_COLORS,
  DEFAULT_EMPTY_AVATAR,
  EMPTY_AVATAR_PRESET,
} from '../lib/avatars';
import { cn } from '../lib/utils';

type SettingsTab = 'account' | 'playback' | 'appearance' | 'history' | 'about';

interface ProfileTheme {
  id: Theme;
  name: string;
  tag: string;
  mode: 'dark' | 'light';
  color: string;
  bg: string;
}

const ALL_THEMES: ProfileTheme[] = [
  { id: 'crimson-premiere', name: 'Crimson Premiere', tag: 'Cinema Crimson & Black', mode: 'dark', color: '#ffffff', bg: '#141414' },
  { id: 'cinematic-dark', name: 'Cinematic Dark', tag: 'Warm Amber & Charcoal', mode: 'dark', color: '#e8852a', bg: '#0a0a0a' },
  { id: 'cherry-cola', name: 'Cherry & Vanilla', tag: 'Deep Wine & Cream Vanilla', mode: 'dark', color: '#efe6dd', bg: '#1a0305' },
  { id: 'butter-green', name: 'Butter & Forest', tag: 'Butter Cream & Forest Pine', mode: 'dark', color: '#ffefb3', bg: '#013e37' },
  { id: 'bistre-aureolin', name: 'Bistre & Gold', tag: 'Espresso Bistre & Aureolin', mode: 'dark', color: '#fbe311', bg: '#190e04' },
  { id: 'vibrant-lime', name: 'Lime & Black', tag: 'Electric Lime & Obsidian', mode: 'dark', color: '#d3f00a', bg: '#0b0e02' },
  { id: 'imperial-violet', name: 'Imperial Violet', tag: 'Lavender & Plum Orchid', mode: 'dark', color: '#e2cbff', bg: '#190b24' },
  { id: 'midnight-ocean', name: 'Midnight Ocean', tag: 'Aqua Cyan & Deep Navy', mode: 'dark', color: '#00f5d4', bg: '#0a1128' },
  { id: 'neon-cyberpunk', name: 'Neon Cyberpunk', tag: 'Synthwave Cyan & Pink', mode: 'dark', color: '#05d9e8', bg: '#1a0b2e' },
  { id: 'elegant-light', name: 'Elegant Ivory', tag: 'Warm Parchment & Espresso', mode: 'light', color: '#3e2723', bg: '#f5f0e8' },
  { id: 'clean-daylight', name: 'Clean Daylight', tag: 'Modern Bright & Royal Blue', mode: 'light', color: '#0f172a', bg: '#ffffff' },
  { id: 'vanilla-cherry', name: 'Vanilla & Cherry', tag: 'Vanilla Cream & Cherry Cola', mode: 'light', color: '#9a0002', bg: '#fdfaf7' },
  { id: 'nordic-frost', name: 'Nordic Frost', tag: 'Frost White & Glacial Blue', mode: 'light', color: '#0284c7', bg: '#f0f4f8' },
  { id: 'matcha-cream', name: 'Matcha & Cream', tag: 'Matcha Green & Soft Linen', mode: 'light', color: '#2d6a4f', bg: '#f4f7f2' },
  { id: 'sunset-rose', name: 'Sunset Rose', tag: 'Rose Berry & Blush Quartz', mode: 'light', color: '#e11d48', bg: '#fdf6f6' },
];

const ALL_FONTS = APP_FONT_IDS.map((id) => ({
  id,
  name: APP_FONTS[id].name,
  tag: APP_FONTS[id].tag,
  fontFamily: APP_FONTS[id].fontFamily,
}));

export function ProfilePage() {
  const {
    userProfile,
    updateUserProfile,
    watchlist,
    continueWatching,
    clearContinueWatching,
    removeContinueWatchingItem,
    clearWatchlist,
    profiles,
    activeProfile,
    switchProfile,
    updateProfile,
    showToast,
    theme,
    setTheme,
    appFont,
    setAppFont,
    deferredInstallPrompt,
    logout,
    syncNow,
    setAuthModalOpen,
    setAuthModalMode,
    setOnboardingComplete,
  } = useApp();

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [nameInput, setNameInput] = useState(activeProfile?.name || userProfile.name || '');
  const [themeFilter, setThemeFilter] = useState<'all' | 'dark' | 'light'>('all');

  useEffect(() => {
    setNameInput(activeProfile?.name || userProfile.name || '');
  }, [activeProfile?.id, activeProfile?.name, userProfile.name]);

  const handleClose = () => {
    const current = window.location.pathname;
    window.history.back();
    setTimeout(() => {
      if (window.location.pathname === current || window.location.pathname === '/profile') {
        navigate('/');
      }
    }, 100);
  };

  useEffect(() => {
    if (activeTab === 'appearance') {
      APP_FONT_IDS.forEach(loadAppFont);
    }
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNameSave = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    if (activeProfile?.id) {
      updateProfile(activeProfile.id, { name: trimmed });
    }
    updateUserProfile({ name: trimmed });
    showToast(`Display name updated to "${trimmed}"`);
  };

  const handleClearSearch = () => {
    localStorage.removeItem('cv_search_history');
    showToast('Search history cleared');
  };

  const handleInstallApp = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('CineVault installed successfully');
      }
    } else {
      showToast('PWA Ready • Use your browser menu to install to Desktop');
    }
  };

  const darkThemes = ALL_THEMES.filter(t => t.mode === 'dark');
  const lightThemes = ALL_THEMES.filter(t => t.mode === 'light');

  const navItems: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'playback', label: 'Playback', icon: Sliders },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'history', label: 'Watch history', icon: History },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in text-foreground">

      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full max-w-5xl h-[92vh] max-h-[740px] bg-card border border-border text-foreground rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Close Settings"
          className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer border border-border shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Sidebar */}
        <aside className="w-full md:w-64 lg:w-72 bg-muted/30 md:border-r border-border flex flex-col justify-between shrink-0 p-4 border-b md:border-b-0">
          <div>
            {/* User Profile Summary */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border shadow-sm mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-black/60 border border-brand/40 flex items-center justify-center p-0.5 shadow-sm shrink-0">
                <img
                  src={getUserAvatarUrl(activeProfile?.avatar || userProfile.avatar, activeProfile?.name || userProfile.name)}
                  alt="User Avatar"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-foreground truncate">{activeProfile?.name || userProfile.name || 'User'}</h4>
                <p className="text-[11px] text-muted-foreground truncate">
                  {userProfile.isLoggedIn ? userProfile.email : (activeProfile?.isKids ? 'Kids Profile' : 'Local Profile')}
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-y-auto max-h-[38vh] md:max-h-[420px] custom-scrollbar pr-1 pb-2 md:pb-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left whitespace-nowrap cursor-pointer",
                      isActive 
                        ? "bg-brand/15 border border-brand/35 text-brand shadow-sm font-bold" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-brand" : "text-muted-foreground")} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Actions: Install app & Language */}
          <div className="pt-3 mt-auto border-t border-border flex flex-col gap-2.5">
            <button
              onClick={handleInstallApp}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left cursor-pointer border border-border/40"
            >
              <Download className="w-4 h-4 text-brand" />
              <span>Install app</span>
            </button>
          </div>
        </aside>

        {/* Right Scrollable Content Panel */}
        <main className="flex-1 h-full overflow-y-auto custom-scrollbar p-6 sm:p-8 flex flex-col gap-6 relative bg-card/40">
          
          {/* TAB 1: ACCOUNT */}
          {activeTab === 'account' && (
            <motion.div 
              key="account-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Account</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Manage profile, persona avatars & cloud sync</p>
              </div>

              {/* Profile Card with Banner */}
              <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-card relative">
                <div className="h-28 bg-gradient-to-r from-brand/25 via-brand/10 to-transparent border-b border-border relative" />
                <div className="absolute left-6 top-14 w-20 h-20 rounded-full border-4 border-card bg-black/80 shadow-md flex items-center justify-center p-1 overflow-hidden">
                  <img
                    src={getUserAvatarUrl(activeProfile?.avatar || userProfile.avatar, activeProfile?.name || userProfile.name)}
                    alt="User Avatar"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="pt-10 px-6 pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-foreground">{activeProfile?.name || userProfile.name || 'User'}</h3>
                        {activeProfile?.isKids && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-500/20 text-pink-400 border border-pink-500/30 uppercase">
                            Kids Mode
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {userProfile.isLoggedIn 
                          ? `Cloud Account: ${userProfile.email}` 
                          : 'Active Viewer Profile • Saved on this device'}
                      </p>
                    </div>

                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium self-start sm:self-center border",
                      userProfile.isLoggedIn 
                        ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400"
                    )}>
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        userProfile.isLoggedIn ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"
                      )} />
                      {userProfile.isLoggedIn ? 'Live Cloud Sync Active' : 'Saved on this device only'}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Display Name"
                      className="flex-1 bg-input/50 border border-border rounded-xl px-3.5 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all placeholder:text-muted-foreground/60"
                    />
                    <button
                      onClick={handleNameSave}
                      className="px-5 py-2 bg-brand text-brand-foreground font-bold text-xs sm:text-sm rounded-xl hover:opacity-90 transition-opacity shadow-card cursor-pointer whitespace-nowrap"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOnboardingComplete(false);
                        showToast('Re-opening CineVault Welcome & Taste Setup...');
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-foreground font-semibold text-xs sm:text-sm rounded-xl border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      title="Relaunch onboarding setup wizard"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-brand" /> Setup Wizard
                    </button>
                  </div>
                </div>
              </div>

              {/* Household Profiles Card */}
              <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-brand" /> Household Profiles
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Switch between viewer profiles or manage child safety restrictions
                    </p>
                  </div>
                  <a
                    href="/profiles"
                    className="text-xs font-bold text-brand px-3.5 py-1.5 rounded-full bg-brand/10 hover:bg-brand/20 border border-brand/30 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Users className="w-3.5 h-3.5" /> Manage Profiles
                  </a>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {profiles.map((p) => {
                    const isCurrent = p.id === activeProfile.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => switchProfile(p.id)}
                        className={cn(
                          "p-3 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center gap-2 relative overflow-hidden group",
                          isCurrent
                            ? "bg-brand/10 border-brand ring-2 ring-brand/30 shadow-md"
                            : "bg-card hover:bg-white/[0.04] border-border hover:border-white/20"
                        )}
                      >
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-black/60 border border-white/10 p-1 shrink-0 relative">
                          <img
                            src={getUserAvatarUrl(p.avatar, p.name)}
                            alt={p.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                          />
                          {p.isKids && (
                            <div className="absolute top-1 left-1 px-1 rounded bg-pink-500 text-[7px] font-black text-white uppercase">
                              KIDS
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 w-full">
                          <div className="text-xs font-bold text-foreground truncate">{p.name}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {isCurrent ? (
                              <span className="text-brand font-bold">● Active</span>
                            ) : p.isKids ? (
                              <span className="text-pink-400 font-semibold">Kids Mode</span>
                            ) : (
                              'Standard'
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Avatar Studio Selector Card */}
              {/* Avatar Selector Card */}
              <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand" /> Avatar Collection
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Select a persona avatar or randomize a new face
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const randomSeed = (activeProfile?.name || userProfile.name || 'User') + '_' + Math.floor(Math.random() * 9999);
                      const newUrl = getBoringAvatarUrl('beam', randomSeed, THEME_BEAM_COLORS);
                      if (activeProfile?.id) {
                        updateProfile(activeProfile.id, { avatar: newUrl });
                      }
                      updateUserProfile({ avatar: newUrl });
                      showToast(`Generated new avatar for ${activeProfile?.name || 'profile'}`);
                    }}
                    className="text-xs font-mono font-bold text-brand px-3 py-1.5 rounded-full bg-brand/10 hover:bg-brand/20 border border-brand/30 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Randomize
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 pt-2">
                  {[EMPTY_AVATAR_PRESET, ...PRESET_AVATARS].map((avatar) => {
                    const currentAvatar = activeProfile?.avatar || userProfile.avatar || DEFAULT_EMPTY_AVATAR;
                    const isSelected =
                      currentAvatar === avatar.url ||
                      currentAvatar === avatar.id ||
                      (avatar.id === 'empty-default' && (!currentAvatar || currentAvatar === DEFAULT_EMPTY_AVATAR || currentAvatar === 'empty'));
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => {
                          if (activeProfile?.id) {
                            updateProfile(activeProfile.id, { avatar: avatar.url });
                          }
                          updateUserProfile({ avatar: avatar.url });
                          showToast(`Avatar set: ${avatar.name}`);
                        }}
                        className={cn(
                          "w-14 h-14 sm:w-16 sm:h-16 rounded-full border transition-all flex flex-col items-center justify-center p-1 cursor-pointer group shadow-sm bg-black/50 overflow-hidden mx-auto relative",
                          isSelected
                            ? "bg-brand/25 border-brand ring-2 ring-brand/60 shadow-lg scale-110"
                            : "hover:bg-white/10 border-border hover:border-white/40"
                        )}
                        title={avatar.name}
                      >
                        <img
                          src={avatar.url}
                          alt={avatar.name}
                          className="w-full h-full object-contain rounded-full group-hover:scale-110 transition-transform"
                          loading="lazy"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sync Across Devices Card */}
              {userProfile.isLoggedIn ? (
                <div className="p-6 rounded-2xl bg-card border border-border shadow-card flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-base font-bold text-foreground">
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      <span>Cloud Account Active</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      ID: {userProfile.uid?.substring(0, 10)}...
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Your account is signed in as <strong className="text-foreground">{userProfile.email}</strong>. All watchlist additions and viewing progress sync automatically across your devices.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => syncNow()}
                      className="px-4 py-2.5 bg-brand text-brand-foreground font-bold rounded-xl text-xs sm:text-sm hover:opacity-90 transition-opacity shadow-card cursor-pointer flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" /> Sync Now
                    </button>
                    <button
                      onClick={() => logout()}
                      className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs sm:text-sm border border-red-500/25 transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-brand/5 border border-brand/20 shadow-card flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-base font-bold text-foreground">
                    <Sparkles className="w-5 h-5 text-brand" />
                    <span>Sync across devices</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    Your watchlist and watch history are stored locally in your browser. Create an account to sync them to the cloud — we'll merge your local data automatically.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => { setAuthModalMode('signup'); setAuthModalOpen(true); }}
                      className="px-5 py-2.5 bg-brand text-brand-foreground font-bold rounded-xl text-xs sm:text-sm hover:opacity-90 transition-opacity shadow-card cursor-pointer"
                    >
                      Create Account
                    </button>
                    <button
                      onClick={() => { setAuthModalMode('signin'); setAuthModalOpen(true); }}
                      className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer"
                    >
                      Already have an account? Sign in
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: PLAYBACK & STREAMING */}
          {activeTab === 'playback' && (
            <motion.div 
              key="playback-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Playback & Streaming</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Display preferences, streaming servers & audio</p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-5">
                {/* Display Mode (Auto / Mobile / Desktop) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Display & App View Mode</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Adaptive responsive view, dedicated mobile app view, or desktop layout</p>
                  </div>
                  <div className="flex items-center gap-1 bg-input/40 p-1 rounded-xl border border-border">
                    {(['auto', 'mobile', 'desktop'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          updateUserProfile({ displayMode: mode });
                          showToast(`Display mode: ${mode.toUpperCase()}`);
                        }}
                        className={cn(
                          "px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer",
                          (userProfile.displayMode || 'auto') === mode
                            ? "bg-brand text-background font-bold shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {mode === 'auto' ? 'Auto' : mode === 'mobile' ? 'Mobile App' : 'Desktop'}
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-border" />

                {/* Auto Play Next */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Auto-Play Next Episode</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Seamlessly start the next episode when current finishes</p>
                  </div>
                  <button
                    onClick={() => updateUserProfile({ autoPlayNext: !userProfile.autoPlayNext })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative cursor-pointer",
                      userProfile.autoPlayNext ? "bg-brand" : "bg-muted-foreground/20"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 left-1 w-4 h-4 rounded-full bg-white dark:bg-foreground transition-transform shadow-sm",
                      userProfile.autoPlayNext ? "translate-x-6" : "translate-x-0"
                    )} />
                  </button>
                </div>

                <hr className="border-border" />

                {/* Show Spoilers */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Show Spoilers & Thumbnails</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Display episode previews that may reveal plot points</p>
                  </div>
                  <button
                    onClick={() => updateUserProfile({ showSpoilers: !userProfile.showSpoilers })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative cursor-pointer",
                      userProfile.showSpoilers ? "bg-brand" : "bg-muted-foreground/20"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 left-1 w-4 h-4 rounded-full bg-white dark:bg-foreground transition-transform shadow-sm",
                      userProfile.showSpoilers ? "translate-x-6" : "translate-x-0"
                    )} />
                  </button>
                </div>

                <hr className="border-border" />

                {/* Default Streaming Server */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Default Streaming Source</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Preferred media player server</p>
                  </div>
                  <select
                    value={userProfile.defaultServer || 'auto'}
                    onChange={(e) => {
                      updateUserProfile({ defaultServer: e.target.value });
                      showToast(`Default source: ${e.target.value}`);
                    }}
                    className="bg-input/50 border border-border rounded-xl px-3 py-1.5 text-xs text-foreground font-medium outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="auto" className="bg-card text-foreground">Auto (MegaPlay Primary)</option>
                    <option value="megaplay" className="bg-card text-foreground">MegaPlay (Primary)</option>
                    <option value="zokoanime" className="bg-card text-foreground">Zoko Anime</option>
                    <option value="videasy" className="bg-card text-foreground">VIDEASY 4K</option>
                    <option value="vidlink" className="bg-card text-foreground">VidLink HD</option>
                  </select>
                </div>

                <hr className="border-border" />

                {/* Anime Audio Preference */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Anime Audio Preference</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Default to Subtitled or English Dubbed streams</p>
                  </div>
                  <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
                    <button
                      onClick={() => { updateUserProfile({ audioPreference: 'sub' }); showToast('Default set to Sub'); }}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        userProfile.audioPreference !== 'dub' ? "bg-brand text-brand-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Sub
                    </button>
                    <button
                      onClick={() => { updateUserProfile({ audioPreference: 'dub' }); showToast('Default set to Dub'); }}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                        userProfile.audioPreference === 'dub' ? "bg-brand text-brand-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Dub
                    </button>
                  </div>
                </div>
              </div>

              {/* Clear Search Cache */}
              <div className="p-6 rounded-2xl bg-card border border-border shadow-card flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Search Cache</h4>
                  <p className="text-xs text-muted-foreground">Clear locally stored search terms</p>
                </div>
                <button
                  onClick={handleClearSearch}
                  className="px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted text-foreground text-xs font-bold transition-colors cursor-pointer border border-border shadow-sm"
                >
                  Clear Search History
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 3: APPEARANCE */}
          {activeTab === 'appearance' && (
            <motion.div 
              key="appearance-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Appearance</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Color themes, typography & visual effects</p>
              </div>

              {/* Themes Selector */}
              <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <Palette className="w-4 h-4 text-brand" /> Color Palette & Themes
                  </h3>
                  <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border text-xs">
                    <button
                      onClick={() => setThemeFilter('all')}
                      className={cn(
                        "px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer",
                        themeFilter === 'all' ? "bg-brand text-brand-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      All ({ALL_THEMES.length})
                    </button>
                    <button
                      onClick={() => setThemeFilter('dark')}
                      className={cn(
                        "px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer",
                        themeFilter === 'dark' ? "bg-brand text-brand-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      🌙 Dark ({darkThemes.length})
                    </button>
                    <button
                      onClick={() => setThemeFilter('light')}
                      className={cn(
                        "px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer",
                        themeFilter === 'light' ? "bg-brand text-brand-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      ☀️ Light ({lightThemes.length})
                    </button>
                  </div>
                </div>

                {(themeFilter === 'all' || themeFilter === 'dark') && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">🌙 Dark Themes</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {darkThemes.map((t) => {
                        const isSelected = theme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => { setTheme(t.id); showToast(`Theme: ${t.name}`); }}
                            className={cn(
                              "p-3 rounded-xl border transition-all text-left flex items-center justify-between gap-2.5 cursor-pointer shadow-sm",
                              isSelected ? "bg-brand/10 border-brand ring-1 ring-brand/30" : "bg-card hover:bg-muted/40 border-border"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-6 h-6 rounded-full border border-border shrink-0 flex items-center justify-center shadow-inner" style={{ backgroundColor: t.bg }}>
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                              </div>
                              <span className="text-xs font-bold text-foreground truncate">{t.name}</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-brand shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(themeFilter === 'all' || themeFilter === 'light') && (
                  <div className="space-y-2 pt-3">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">☀️ Light Themes</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {lightThemes.map((t) => {
                        const isSelected = theme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => { setTheme(t.id); showToast(`Theme: ${t.name}`); }}
                            className={cn(
                              "p-3 rounded-xl border transition-all text-left flex items-center justify-between gap-2.5 cursor-pointer shadow-sm",
                              isSelected ? "bg-brand/10 border-brand ring-1 ring-brand/30" : "bg-card hover:bg-muted/40 border-border"
                            )}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-6 h-6 rounded-full border border-border shrink-0 flex items-center justify-center shadow-inner" style={{ backgroundColor: t.bg }}>
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                              </div>
                              <span className="text-xs font-bold text-foreground truncate">{t.name}</span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-brand shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Typography / Font Selector */}
              <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
                <h3 className="text-base font-bold text-foreground">Typography & Display Font</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ALL_FONTS.map((f) => {
                    const isSelected = appFont === f.id;
                    return (
                      <button
                        key={f.id}
                        onMouseEnter={() => loadAppFont(f.id)}
                        onFocus={() => loadAppFont(f.id)}
                        onClick={() => { setAppFont(f.id); showToast(`Font: ${f.name}`); }}
                        className={cn(
                          "p-3.5 rounded-xl border transition-all text-left cursor-pointer flex flex-col justify-between gap-2 shadow-sm",
                          isSelected ? "bg-brand/10 border-brand ring-1 ring-brand/30" : "bg-card hover:bg-muted/40 border-border"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-foreground" style={{ fontFamily: f.fontFamily }}>
                            {f.name}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-brand shrink-0" />}
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate">{f.tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logo Style Picker */}
              <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span>✨</span> Title Logo Style
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Select which title logo emblem appears in the header and splash screen</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Cat Logo (Primary) */}
                  <button
                    onClick={() => {
                      updateUserProfile({ logoStyle: 'cat' });
                      showToast('Logo style set to Cat Silhouette (Primary)');
                    }}
                    className={cn(
                      "p-4 rounded-xl border transition-all text-left flex items-center justify-between gap-3 cursor-pointer shadow-sm",
                      userProfile.logoStyle !== 'vault' ? "bg-brand/10 border-brand ring-1 ring-brand/30" : "bg-card hover:bg-muted/40 border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center shrink-0">
                        <div className="w-6 h-6 bg-brand brand-logo-cat" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Cat Silhouette <span className="text-[10px] text-brand font-semibold">(Primary)</span></h4>
                        <span className="text-[10px] text-muted-foreground">Anime & Miru Aesthetic</span>
                      </div>
                    </div>
                    {userProfile.logoStyle !== 'vault' && <Check className="w-4 h-4 text-brand shrink-0" />}
                  </button>

                  {/* Vault Logo */}
                  <button
                    onClick={() => {
                      updateUserProfile({ logoStyle: 'vault' });
                      showToast('Logo style set to Vault & Security');
                    }}
                    className={cn(
                      "p-4 rounded-xl border transition-all text-left flex items-center justify-between gap-3 cursor-pointer shadow-sm",
                      userProfile.logoStyle === 'vault' ? "bg-brand/10 border-brand ring-1 ring-brand/30" : "bg-card hover:bg-muted/40 border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center shrink-0">
                        <div className="w-6 h-6 bg-brand brand-logo-vault" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Vault / Safe Emblem</h4>
                        <span className="text-[10px] text-muted-foreground">Original CineVault Safe Theme</span>
                      </div>
                    </div>
                    {userProfile.logoStyle === 'vault' && <Check className="w-4 h-4 text-brand shrink-0" />}
                  </button>
                </div>
              </div>

              {/* Visual Effects Toggles */}
              <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
                <h3 className="text-base font-bold text-foreground">Visual Effects</h3>
                
                {/* Reduced Motion */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Reduced Motion</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Disable smooth parallax and heavy motion transitions</p>
                  </div>
                  <button
                    onClick={() => updateUserProfile({ reducedMotion: !userProfile.reducedMotion })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative cursor-pointer",
                      userProfile.reducedMotion ? "bg-brand" : "bg-muted-foreground/20"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 left-1 w-4 h-4 rounded-full bg-white dark:bg-foreground transition-transform shadow-sm",
                      userProfile.reducedMotion ? "translate-x-6" : "translate-x-0"
                    )} />
                  </button>
                </div>

                <hr className="border-border" />

                {/* Film Grain Texture */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Film Grain Texture</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Cinematic subtle 35mm film grain overlay</p>
                  </div>
                  <button
                    onClick={() => updateUserProfile({ filmGrain: userProfile.filmGrain === false ? true : false })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative cursor-pointer",
                      userProfile.filmGrain !== false ? "bg-brand" : "bg-muted-foreground/20"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 left-1 w-4 h-4 rounded-full bg-white dark:bg-foreground transition-transform shadow-sm",
                      userProfile.filmGrain !== false ? "translate-x-6" : "translate-x-0"
                    )} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: WATCH HISTORY */}
          {activeTab === 'history' && (
            <motion.div 
              key="history-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Watch history</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Manage continue watching items & stored playback progress</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-card border border-border shadow-card flex flex-col justify-center">
                  <span className="text-2xl font-bold font-display text-brand">{continueWatching.length}</span>
                  <span className="text-xs text-muted-foreground mt-1">In Progress Videos</span>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border shadow-card flex flex-col justify-center">
                  <span className="text-2xl font-bold font-display text-brand">{watchlist.length}</span>
                  <span className="text-xs text-muted-foreground mt-1">Items in Watchlist</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
                <h3 className="text-base font-bold text-foreground">Active Viewing History</h3>
                
                {continueWatching.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No active watch history found. Start playing a movie or series to track progress!</p>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {continueWatching.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-muted/40 border border-border hover:border-brand/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.poster_path ? (
                            <img 
                              src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} 
                              alt={item.title} 
                              className="w-9 h-12 rounded-lg object-cover shrink-0" 
                            />
                          ) : (
                            <div className="w-9 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                              <Film className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-foreground truncate">{item.title}</h5>
                            <span className="text-[10px] text-brand font-medium">
                              {item.season_number ? `S${item.season_number} E${item.episode_number || 1}` : 'Movie'} • {Math.round(item.progress_percentage || 0)}%
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              handleClose();
                              goToWatch(
                                item.id,
                                item.media_type,
                                item.season_number || 1,
                                item.episode_number || 1
                              );
                            }}
                            className="p-2 rounded-lg bg-brand text-brand-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                            aria-label="Resume playing"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeContinueWatchingItem(item.id, item.media_type)}
                            className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                            aria-label="Remove item from watch history"
                            title="Remove from history"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border shadow-card flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={clearContinueWatching}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-red-500/25 cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-4 h-4" /> Clear Watch History
                </button>
                <button
                  type="button"
                  onClick={clearWatchlist}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-red-500/25 cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-4 h-4" /> Clear Watchlist
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 5: ABOUT */}
          {activeTab === 'about' && (
            <motion.div 
              key="about-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">About CineVault</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Application information, shortcuts & disclaimer</p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-center shadow-card shrink-0">
                    <div 
                      className={cn(
                        "w-7 h-7 bg-brand transition-all",
                        userProfile.logoStyle === 'vault' ? "brand-logo-vault" : "brand-logo-cat"
                      )} 
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">CineVault</h3>
                    <span className="text-xs text-brand font-mono">v2.4.0 • Build 2026 Production</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  CineVault is an open-source, non-commercial media interface designed to explore films, series, and anime with a luxury theater user experience.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border shadow-card space-y-3">
                <h4 className="text-sm font-bold text-foreground">Keyboard Shortcuts</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border">
                    <span className="text-muted-foreground">Close Modal</span>
                    <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-[10px] text-foreground border border-border">Esc</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border">
                    <span className="text-muted-foreground">Quick Search</span>
                    <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-[10px] text-foreground border border-border">S</kbd>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/25 shadow-card flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-red-600 dark:text-red-400">Reset Application</h4>
                  <p className="text-xs text-muted-foreground">Clear all local storage, watchlist, continue watching and preferences</p>
                </div>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('trigger-reset'))}
                  className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-sm"
                >
                  Reset App Data
                </button>
              </div>
            </motion.div>
          )}

        </main>
      </motion.div>
    </div>
  );
}
