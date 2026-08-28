import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FocusLock from 'react-focus-lock';
import { useApp, type UserPreference } from '../store';
import {
  DICEBEAR_STYLES,
  PRESET_AVATARS,
  getUserAvatarUrl,
  getDiceBearUrl,
} from '../lib/avatars';
import { cn } from '../lib/utils';
import {
  Check,
  LogIn,
  UserCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Dice5,
} from 'lucide-react';

const RICH_GENRES: Array<UserPreference & { id: string; emoji: string; desc: string }> = [
  { id: '28', label: 'Action', genres: '28', type: 'movie', emoji: '💥', desc: 'Adrenaline & blockbusters' },
  { id: '878', label: 'Sci-Fi', genres: '878', type: 'movie', emoji: '🚀', desc: 'Cosmos & cyberpunk' },
  { id: '16', label: 'Anime', genres: '16', type: 'tv', emoji: '🌸', desc: 'Shonen & animation' },
  { id: '53', label: 'Thriller', genres: '53', type: 'movie', emoji: '🔪', desc: 'Suspense & tension' },
  { id: '27', label: 'Horror', genres: '27', type: 'movie', emoji: '👻', desc: 'Supernatural & dread' },
  { id: '18', label: 'Drama', genres: '18', type: 'movie', emoji: '🎭', desc: 'Deep narratives' },
  { id: '35', label: 'Comedy', genres: '35', type: 'movie', emoji: '😂', desc: 'Laughs & satire' },
  { id: '10749', label: 'Romance', genres: '10749', type: 'movie', emoji: '❤️', desc: 'Passion & heart' },
  { id: '14', label: 'Fantasy', genres: '14', type: 'movie', emoji: '🧙', desc: 'Myths & magic realms' },
  { id: '9648', label: 'Mystery', genres: '9648', type: 'movie', emoji: '🕵️', desc: 'Whodunits & puzzles' },
  { id: '80', label: 'Crime', genres: '80', type: 'movie', emoji: '🔫', desc: 'Heists & underworld' },
  { id: '99', label: 'Documentary', genres: '99', type: 'movie', emoji: '🌍', desc: 'Real history & nature' },
];

export function OnboardingModal() {
  const {
    onboardingComplete,
    setOnboardingComplete,
    setUserPreferences,
    userProfile,
    updateUserProfile,
    setAuthModalOpen,
    setAuthModalMode,
  } = useApp();

  const [step, setStep] = useState(0);
  const [activeStyle, setActiveStyle] = useState('constellation');
  const [customSeed, setCustomSeed] = useState('');
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(
    userProfile.avatar || getDiceBearUrl('constellation', 'OrionVault')
  );
  const [nameInput, setNameInput] = useState(userProfile.name || 'Cinephile');
  const [selectedIds, setSelectedIds] = useState<string[]>(['28', '878', '16']);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (onboardingComplete) return;
    const timer = window.setTimeout(() => setIsVisible(true), 400);
    return () => window.clearTimeout(timer);
  }, [onboardingComplete]);

  useEffect(() => {
    if (userProfile.isLoggedIn && step === 0) {
      if (userProfile.name) setNameInput(userProfile.name);
      setStep(1);
    }
  }, [userProfile.isLoggedIn, userProfile.name, step]);

  const toggleGenre = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSignIn = () => {
    setAuthModalMode('signin');
    setAuthModalOpen(true);
  };

  const handleRandomize = () => {
    const randomSeeds = ['CineVault', 'NeoMatrix', 'Auteur', 'Starlight', 'Valkyrie', 'Solaris', 'Quantum', 'Miru', 'CyberRogue'];
    const randomSeed = randomSeeds[Math.floor(Math.random() * randomSeeds.length)] + Math.floor(Math.random() * 999);
    setCustomSeed(randomSeed);
    setSelectedAvatarUrl(getDiceBearUrl(activeStyle, randomSeed));
  };

  const handleFinish = () => {
    updateUserProfile({
      name: nameInput.trim() || 'Cinephile',
      avatar: selectedAvatarUrl,
    });

    const chosenGenres = RICH_GENRES.filter((g) => selectedIds.includes(g.id)).map(
      ({ label, genres, type }) => ({
        label,
        genres,
        type,
      })
    );

    setUserPreferences(
      chosenGenres.length > 0
        ? chosenGenres
        : [{ label: 'Action', genres: '28', type: 'movie' }]
    );

    setIsVisible(false);
    window.setTimeout(() => setOnboardingComplete(true), 450);
  };

  if (onboardingComplete) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-2xl pointer-events-auto"
        >
          <div className="bg-[#0f1016]/95 border border-white/15 p-6 sm:p-10 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.9)] max-w-2xl w-full mx-auto relative overflow-hidden text-foreground">
            <FocusLock returnFocus>
              {/* Top Accent Rim */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand/40 via-brand to-[#ffd066]" />
              <div className="ambient-glow-orb -top-24 -left-24 w-64 h-64 bg-brand/20 pointer-events-none" />
              <div className="ambient-glow-orb -bottom-24 -right-24 w-64 h-64 bg-[#ffd066]/15 pointer-events-none" />

              <AnimatePresence mode="wait">
                {/* STEP 0: Dual Experience Choice (Sign In vs Guest) */}
                {step === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10 flex flex-col items-center text-center"
                  >
                    <div
                      className={cn(
                        'w-14 h-14 bg-brand mb-4 transition-all drop-shadow-[0_0_25px_rgba(232,133,42,0.6)]',
                        userProfile.logoStyle === 'cat' ? 'brand-logo-cat' : 'brand-logo-vault'
                      )}
                    />
                    <h1 className="text-3xl sm:text-4xl font-black font-display text-foreground mb-2">
                      Welcome to <span className="text-brand">CineVault</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                      Choose how you want to experience the multiverse of cinema.
                    </p>

                    {/* Dual Mode Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-6">
                      {/* Cloud Sync Account Card */}
                      <div
                        onClick={handleSignIn}
                        className="group relative rounded-2xl p-5 bg-white/5 hover:bg-brand/10 border border-white/10 hover:border-brand/60 transition-all duration-300 cursor-pointer text-left flex flex-col justify-between shadow-card"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand/20 text-brand border border-brand/40">
                            RECOMMENDED
                          </span>
                          <ShieldCheck className="w-5 h-5 text-brand" />
                        </div>
                        <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-brand transition-colors">
                          Cloud VIP Passport
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                          Sync watchlist, watch history, and preferences across phone, tablet, and PC.
                        </p>
                        <button
                          type="button"
                          className="w-full py-2.5 px-4 rounded-xl bg-brand text-brand-foreground font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md group-hover:scale-[1.02] transition-transform"
                        >
                          <LogIn className="w-4 h-4" /> Sign In / Register
                        </button>
                      </div>

                      {/* Guest Mode Card */}
                      <div
                        onClick={() => setStep(1)}
                        className="group relative rounded-2xl p-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 transition-all duration-300 cursor-pointer text-left flex flex-col justify-between shadow-card"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white/80 border border-white/15">
                            ZERO SETUP
                          </span>
                          <Zap className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-white transition-colors">
                          Guest Explorer Pass
                        </h3>
                        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                          Instant access with local browser storage. No email or password required.
                        </p>
                        <button
                          type="button"
                          className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-foreground font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-white/10 group-hover:scale-[1.02] transition-transform"
                        >
                          <UserCircle2 className="w-4 h-4 text-muted-foreground" /> Continue as Guest
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 1: Avatar Studio & Persona */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10 flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={() => setStep(0)}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <span className="text-xs font-mono text-brand font-bold">STEP 1 OF 2</span>
                    </div>

                    <div className="text-center mb-5">
                      <h2 className="text-2xl sm:text-3xl font-black font-display text-foreground mb-1">
                        Choose Your Persona
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Powered by DiceBear 10.x Vector Avatar API
                      </p>
                    </div>

                    {/* Live Avatar Preview & Name Input */}
                    <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-white/5 border border-white/15 mb-5 shadow-inner">
                      <div className="relative group shrink-0">
                        <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden bg-black/60 border-2 border-brand shadow-[0_0_25px_var(--theme-accent-glow,rgba(232,133,42,0.4))] flex items-center justify-center p-1.5 transition-transform duration-300">
                          <img
                            src={getUserAvatarUrl(selectedAvatarUrl)}
                            alt="Avatar Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRandomize}
                          className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-brand text-brand-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                          title="Generate Random Avatar"
                        >
                          <Dice5 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 w-full text-center sm:text-left space-y-2">
                        <div>
                          <label className="text-[11px] font-mono uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => {
                              setNameInput(e.target.value);
                              if (!customSeed) {
                                setSelectedAvatarUrl(getDiceBearUrl(activeStyle, e.target.value || 'Cinephile'));
                              }
                            }}
                            placeholder="Your Cinephile Name..."
                            maxLength={30}
                            className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-2 text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                          />
                        </div>

                        {/* Quick Style Switcher */}
                        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
                          {DICEBEAR_STYLES.slice(0, 6).map((style) => (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => {
                                setActiveStyle(style.id);
                                setSelectedAvatarUrl(getDiceBearUrl(style.id, nameInput || 'Cinephile'));
                              }}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap border transition-all cursor-pointer",
                                activeStyle === style.id
                                  ? "bg-brand text-brand-foreground border-brand shadow-sm"
                                  : "bg-white/5 border-white/10 text-muted-foreground hover:text-white"
                              )}
                            >
                              {style.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Presets Gallery */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono uppercase font-bold text-muted-foreground tracking-wider">
                          Featured Avatars ({PRESET_AVATARS.length})
                        </span>
                        <button
                          type="button"
                          onClick={handleRandomize}
                          className="text-xs text-brand font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Dice5 className="w-3.5 h-3.5" /> Randomize
                        </button>
                      </div>

                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-h-36 overflow-y-auto custom-scrollbar pr-1 p-1">
                        {PRESET_AVATARS.map((avatar) => {
                          const isSelected = selectedAvatarUrl === avatar.url;
                          return (
                            <button
                              key={avatar.id}
                              type="button"
                              onClick={() => {
                                setSelectedAvatarUrl(avatar.url);
                                setActiveStyle(avatar.style);
                              }}
                              className={cn(
                                'flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all cursor-pointer relative group',
                                isSelected
                                  ? 'bg-brand/20 border-brand shadow-lg scale-105 ring-2 ring-brand/40'
                                  : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                              )}
                            >
                              <img
                                src={avatar.url}
                                alt={avatar.name}
                                className="w-9 h-9 object-contain group-hover:scale-110 transition-transform"
                                loading="lazy"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full py-3.5 px-6 bg-brand text-brand-foreground font-bold text-sm sm:text-base rounded-full flex items-center justify-center gap-2 shadow-card hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                    >
                      <span>Next: Select Your Tastes</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* STEP 2: Taste Universe (Rich Genre Picker) */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10 flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <span className="text-xs font-mono text-brand font-bold">STEP 2 OF 2</span>
                    </div>

                    <div className="text-center mb-6">
                      <h2 className="text-2xl sm:text-3xl font-black font-display text-foreground mb-1">
                        What Do You Love to Watch?
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Select one or more favorite categories to tailor your spotlights
                      </p>
                    </div>

                    {/* Rich Genre Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-1 p-1">
                      {RICH_GENRES.map((g) => {
                        const isSelected = selectedIds.includes(g.id);
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => toggleGenre(g.id)}
                            className={cn(
                              'p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between gap-1 group',
                              isSelected
                                ? 'bg-brand/20 border-brand shadow-md ring-1 ring-brand/40'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xl group-hover:scale-110 transition-transform">
                                {g.emoji}
                              </span>
                              {isSelected && (
                                <div className="w-4 h-4 rounded-full bg-brand text-brand-foreground flex items-center justify-center">
                                  <Check className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h4
                                className={cn(
                                  'text-xs font-bold transition-colors',
                                  isSelected ? 'text-brand' : 'text-foreground'
                                )}
                              >
                                {g.label}
                              </h4>
                              <p className="text-[10px] text-muted-foreground truncate">{g.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        {selectedIds.length} {selectedIds.length === 1 ? 'genre' : 'genres'} chosen
                      </span>

                      <button
                        type="button"
                        disabled={selectedIds.length === 0}
                        onClick={handleFinish}
                        className={cn(
                          'py-3 px-8 rounded-full font-bold text-sm shadow-card transition-all duration-300 flex items-center gap-2',
                          selectedIds.length > 0
                            ? 'bg-brand hover:bg-brand/90 text-brand-foreground hover:scale-105 active:scale-95 cursor-pointer'
                            : 'bg-white/10 text-white/30 cursor-not-allowed'
                        )}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Launch CineVault</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </FocusLock>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

