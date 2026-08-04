import { useState } from 'react';
import { motion } from 'motion/react';
import { User, Settings as SettingsIcon, Trash2, LogOut, CheckCircle, Search, Palette, ArrowLeft, HelpCircle, Command, X } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useApp } from '../store';

export function ProfilePage() {
  const { userProfile, updateUserProfile, clearProfile, clearWatchlist, showToast, theme, setTheme } = useApp();
  const [nameInput, setNameInput] = useState(userProfile.name);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleNameSave = () => {
    updateUserProfile({ name: nameInput });
    showToast('Profile updated');
  };

  const handleClearSearch = () => {
    localStorage.removeItem('cv_search_history');
    showToast('Search history cleared');
  };

  const handleSignOut = () => {
    clearProfile();
    window.location.hash = '#home';
  };

  const themes: { id: any; name: string }[] = [
    { id: 'cinematic-dark', name: 'Cinematic Dark' },
    { id: 'midnight-ocean', name: 'Midnight Ocean' },
    { id: 'crimson-premiere', name: 'Crimson Premiere' },
    { id: 'neon-cyberpunk', name: 'Neon Cyberpunk' },
    { id: 'elegant-light', name: 'Elegant Light' },
    { id: 'clean-daylight', name: 'Clean Daylight' },
  ];

  return (
    <div className="min-h-screen pt-[15vh] px-4 pb-20">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="max-w-2xl mx-auto"
      >
        <button 
          onClick={() => {
            const current = window.location.hash;
            window.history.back();
            setTimeout(() => {
              if (window.location.hash === current) {
                window.location.hash = '#home';
              }
            }, 100);
          }}
          className="inline-flex items-center gap-2 text-cv-slate hover:text-cv-gold transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back
        </button>

        <div className="glass-panel border-cv-gold/30 p-8 md:p-12 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cv-gold/10 rounded-full blur-[100px] pointer-events-none" />

          <h1 className="text-4xl font-serif font-bold text-cv-cream mb-10 flex items-center gap-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-cv-gold"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M12 11v2"/><path d="M10 18h4"/></svg>
            Your Profile
          </h1>

          {/* Profile Section */}
          <div className="mb-12 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-32 h-32 rounded-full border-4 border-cv-gold/50 bg-white/5 flex items-center justify-center shadow-[0_0_20px_rgba(212,168,83,0.3)] shrink-0">
              {userProfile.name ? (
                <span className="text-5xl font-serif font-bold text-cv-gold">
                  {userProfile.name.substring(0, 2).toUpperCase()}
                </span>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-cv-slate"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M12 11v2"/><path d="M10 18h4"/></svg>
              )}
            </div>
            <div className="flex-1 w-full text-center md:text-left">
              <label className="block text-sm text-cv-slate mb-2">Display Name</label>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-cv-cream focus:outline-none focus:border-cv-gold focus:ring-1 focus:ring-cv-gold transition-all"
                />
                <button 
                  onClick={handleNameSave}
                  className="bg-cv-gold text-cv-gold-content px-6 font-bold rounded-lg hover:bg-white transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          <hr className="border-white/10 mb-10" />

          {/* Preferences */}
          <div className="mb-12">
            <h2 className="text-2xl font-serif font-bold text-cv-cream mb-6 flex items-center gap-3">
              <SettingsIcon className="w-6 h-6 text-cv-gold" /> Preferences
            </h2>
            <div className="space-y-6">
              {[
                { id: 'showSpoilers', label: 'Show Spoilers', desc: 'Display sensitive plot details' },
                { id: 'autoPlayNext', label: 'Auto-Play Next Episode', desc: 'Seamlessly start the next episode' },
                { id: 'reducedMotion', label: 'Reduced Motion', desc: 'Disable heavy animations' }
              ].map((pref) => (
                <div key={pref.id} className="flex items-center justify-between">
                  <div>
                    <h3 className="text-cv-cream font-medium">{pref.label}</h3>
                    <p className="text-sm text-cv-slate">{pref.desc}</p>
                  </div>
                  <button
                    onClick={() => updateUserProfile({ [pref.id]: !userProfile[pref.id as keyof typeof userProfile] })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${userProfile[pref.id as keyof typeof userProfile] ? 'bg-cv-gold' : 'bg-white/20'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${userProfile[pref.id as keyof typeof userProfile] ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-white/10 mb-10" />

          {/* Data Management */}
          <div className="mb-12">
            <h2 className="text-2xl font-serif font-bold text-cv-cream mb-6">Data Management</h2>
            <div className="space-y-4">
              <button 
                onClick={clearWatchlist}
                className="w-full flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all text-cv-slate group cursor-pointer"
              >
                <span className="flex items-center gap-3"><Trash2 className="w-5 h-5 group-hover:text-red-400 text-cv-slate" /> Clear Watchlist</span>
              </button>
              <button 
                onClick={handleClearSearch}
                className="w-full flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-cv-gold/10 hover:text-cv-gold border border-transparent hover:border-cv-gold/30 transition-all text-cv-slate group cursor-pointer"
              >
                <span className="flex items-center gap-3"><Search className="w-5 h-5 group-hover:text-cv-gold text-cv-slate" /> Clear Search History</span>
              </button>
              <button 
                onClick={() => {
                  updateUserProfile({ showSpoilers: false, autoPlayNext: true, reducedMotion: false });
                  showToast('Preferences reset');
                }}
                className="w-full flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/30 transition-all text-cv-slate group cursor-pointer"
              >
                <span className="flex items-center gap-3"><SettingsIcon className="w-5 h-5 group-hover:text-cv-cream text-cv-slate" /> Reset Preferences</span>
              </button>
            </div>
          </div>

          <hr className="border-white/10 mb-10" />

          {/* Theme Selector */}
          <div className="mb-12">
            <h2 className="text-2xl font-serif font-bold text-cv-cream mb-6 flex items-center gap-3">
              <Palette className="w-6 h-6 text-cv-gold" /> App Theme
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    showToast(`Theme updated: ${t.name}`);
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all cursor-pointer ${theme === t.id ? 'bg-white/10 border-cv-gold shadow-[0_0_15px_rgba(212,168,83,0.3)] scale-105' : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'}`}
                >
                  <span className={`text-sm font-bold ${theme === t.id ? 'text-cv-gold' : 'text-cv-slate'}`}>{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reset App Data */}
          <div className="mt-12 flex justify-end">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('trigger-reset'))}
              className="flex items-center gap-2 px-8 py-3 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-cv-cream rounded-lg transition-all font-bold">
              <LogOut className="w-5 h-5" /> Reset App Data
            </button>
          </div>
        </div>
  
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-cv-panel border border-white/10 p-8 rounded-2xl max-w-md w-full shadow-2xl relative"
            >
              <button onClick={() => setShowShortcuts(false)} className="absolute top-4 right-4 text-cv-cream/50 hover:text-cv-cream">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-bold text-cv-cream font-serif mb-6 flex items-center gap-2">
                <Command className="text-cv-gold" /> Keyboard Shortcuts
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-cv-slate">Go Back</span>
                  <span className="bg-white/10 text-cv-cream px-3 py-1 rounded-md text-sm font-mono">Backspace</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-cv-slate">Close Modals/Sidebar</span>
                  <span className="bg-white/10 text-cv-cream px-3 py-1 rounded-md text-sm font-mono">Esc</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-cv-slate">Next Episode</span>
                  <span className="bg-white/10 text-cv-cream px-3 py-1 rounded-md text-sm font-mono">N</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-cv-slate">Toggle Sidebar</span>
                  <span className="bg-white/10 text-cv-cream px-3 py-1 rounded-md text-sm font-mono">S</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-cv-slate">Toggle Fullscreen</span>
                  <span className="bg-white/10 text-cv-cream px-3 py-1 rounded-md text-sm font-mono">F</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
    </div>
  );
}
