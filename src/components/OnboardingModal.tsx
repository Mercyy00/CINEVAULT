import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FocusLock from 'react-focus-lock';
import { useApp, type UserPreference } from '../store';
import {
  BORING_PALETTES,
  PRESET_AVATARS,
  getBoringAvatarUrl,
  BoringAvatarVariant,
  THEME_BEAM_COLORS,
} from '../lib/avatars';
import { cn } from '../lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  Flame,
  Rocket,
  Sparkles,
  Crosshair,
  Skull,
  Clapperboard,
  Laugh,
  Heart,
  Wand2,
  Search,
  Fingerprint,
  Check,
  ArrowRight,
  ArrowLeft,
  Dice5,
  Volume2,
  Languages,
  ShieldCheck,
  Star,
  Film,
} from 'lucide-react';

interface RichGenreItem extends UserPreference {
  id: string;
  icon: LucideIcon;
  desc: string;
  iconColor: string;
  badgeBg: string;
  badgeBorder: string;
}

const RICH_GENRES: RichGenreItem[] = [
  {
    id: '28',
    label: 'Action',
    genres: '28',
    type: 'movie',
    icon: Flame,
    desc: 'High-octane blockbusters & adrenaline',
    iconColor: 'text-orange-400',
    badgeBg: 'bg-orange-500/15',
    badgeBorder: 'border-orange-500/30',
  },
  {
    id: '878',
    label: 'Sci-Fi',
    genres: '878',
    type: 'movie',
    icon: Rocket,
    desc: 'Deep cosmos, cyberpunk & time paradoxes',
    iconColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/15',
    badgeBorder: 'border-cyan-500/30',
  },
  {
    id: '16',
    label: 'Anime',
    genres: '16',
    type: 'tv',
    icon: Sparkles,
    desc: 'Shonen epics, slice of life & dark fantasy',
    iconColor: 'text-pink-400',
    badgeBg: 'bg-pink-500/15',
    badgeBorder: 'border-pink-500/30',
  },
  {
    id: 'bollywood',
    label: 'Bollywood & Desi',
    genres: 'bollywood',
    type: 'movie',
    icon: Film,
    desc: 'Blockbusters, romance, masala & classics',
    iconColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-500/30',
  },
  {
    id: '53',
    label: 'Thriller',
    genres: '53',
    type: 'movie',
    icon: Crosshair,
    desc: 'Psychological suspense & nail-biting twists',
    iconColor: 'text-red-400',
    badgeBg: 'bg-red-500/15',
    badgeBorder: 'border-red-500/30',
  },
  {
    id: '27',
    label: 'Horror',
    genres: '27',
    type: 'movie',
    icon: Skull,
    desc: 'Supernatural chills, gore & cosmic dread',
    iconColor: 'text-purple-400',
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-500/30',
  },
  {
    id: '18',
    label: 'Drama',
    genres: '18',
    type: 'movie',
    icon: Clapperboard,
    desc: 'Deep auteur cinema & human storytelling',
    iconColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15',
    badgeBorder: 'border-emerald-500/30',
  },
  {
    id: '35',
    label: 'Comedy',
    genres: '35',
    type: 'movie',
    icon: Laugh,
    desc: 'Sharp satire, irreverent laughs & feel-good',
    iconColor: 'text-yellow-400',
    badgeBg: 'bg-yellow-500/15',
    badgeBorder: 'border-yellow-500/30',
  },
  {
    id: '10749',
    label: 'Romance',
    genres: '10749',
    type: 'movie',
    icon: Heart,
    desc: 'Passionate connections & romantic journeys',
    iconColor: 'text-rose-400',
    badgeBg: 'bg-rose-500/15',
    badgeBorder: 'border-rose-500/30',
  },
  {
    id: '14',
    label: 'Fantasy',
    genres: '14',
    type: 'movie',
    icon: Wand2,
    desc: 'Mythical beasts, sword & sorcery realms',
    iconColor: 'text-violet-400',
    badgeBg: 'bg-violet-500/15',
    badgeBorder: 'border-violet-500/30',
  },
  {
    id: '9648',
    label: 'Mystery',
    genres: '9648',
    type: 'movie',
    icon: Search,
    desc: 'Whodunits, noir detectives & hidden clues',
    iconColor: 'text-sky-400',
    badgeBg: 'bg-sky-500/15',
    badgeBorder: 'border-sky-500/30',
  },
  {
    id: '80',
    label: 'Crime',
    genres: '80',
    type: 'movie',
    icon: Fingerprint,
    desc: 'Underworld heists, mob sagas & investigations',
    iconColor: 'text-teal-400',
    badgeBg: 'bg-teal-500/15',
    badgeBorder: 'border-teal-500/30',
  },
];

const RANDOM_SEEDS = [
  'Cinephile',
  'NeoMatrix',
  'Auteur',
  'Solaris',
  'Valkyrie',
  'Miru',
  'CyberRogue',
  'Interstellar',
  'Ronin',
  'Starlight',
  'Director',
  'BladeRunner',
];

export function OnboardingModal() {
  const {
    onboardingComplete,
    setOnboardingComplete,
    setUserPreferences,
    userProfile,
    updateUserProfile,
  } = useApp();

  const [step, setStep] = useState(0); // 0: Persona, 1: Genres, 2: Preferences, 3: VIP Passport
  const [activeVariant, setActiveVariant] = useState<BoringAvatarVariant>('beam');
  const [activePaletteIndex, setActivePaletteIndex] = useState(0);
  const [nameInput, setNameInput] = useState(userProfile.name || 'Cinephile');
  const [seed, setSeed] = useState(userProfile.name || 'Cinephile');
  const [selectedIds, setSelectedIds] = useState<string[]>(['28', '878', '16', 'bollywood']);
  const [audioPref, setAudioPref] = useState<'sub' | 'dub'>(userProfile.audioPreference || 'sub');
  const [logoStylePref, setLogoStylePref] = useState<'vault' | 'cat'>(userProfile.logoStyle || 'vault');
  const [isVisible, setIsVisible] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('onboarding') === 'true' || params.get('setup') === 'true') {
      setOnboardingComplete(false);
      setStep(0);
      setIsVisible(true);
      return;
    }
    if (onboardingComplete) {
      setIsVisible(false);
      return;
    }
    setStep(0);
    const timer = window.setTimeout(() => setIsVisible(true), 350);
    return () => window.clearTimeout(timer);
  }, [onboardingComplete, setOnboardingComplete]);

  // Compute live Boring Avatar URL based on variant, seed, and selected palette
  const activePalette = BORING_PALETTES[activePaletteIndex].colors;
  const liveAvatarUrl = getBoringAvatarUrl(activeVariant, seed || nameInput || 'Cinephile', activePalette);

  const toggleGenre = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleRandomize = () => {
    setIsSpinning(true);
    const newSeed =
      RANDOM_SEEDS[Math.floor(Math.random() * RANDOM_SEEDS.length)] +
      Math.floor(Math.random() * 999);
    setSeed(newSeed);
    setActiveVariant('beam');
    setActivePaletteIndex(0);
    window.setTimeout(() => setIsSpinning(false), 350);
  };

  const handleFinish = () => {
    updateUserProfile({
      name: nameInput.trim() || 'Cinephile',
      avatar: liveAvatarUrl,
      audioPreference: audioPref,
      logoStyle: logoStylePref,
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

  const handleSkip = () => {
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
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl pointer-events-auto"
        >
          <div className="bg-[#0b0c12]/95 border border-white/15 p-5 sm:p-8 md:p-10 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(232,133,42,0.15)] max-w-2xl sm:max-w-3xl w-full mx-auto relative overflow-hidden text-foreground">
            <FocusLock returnFocus>
              {/* Top Accent Lighting Bar */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent" />
              <div className="ambient-glow-orb -top-24 -left-24 w-64 h-64 bg-brand/15 pointer-events-none" />
              <div className="ambient-glow-orb -bottom-24 -right-24 w-64 h-64 bg-[#38bdf8]/10 pointer-events-none" />

              {/* Step indicator bar */}
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-6 h-6 bg-brand transition-all',
                      logoStylePref === 'vault' ? 'brand-logo-vault' : 'brand-logo-cat'
                    )}
                  />
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand">
                    CineVault Journey
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-300',
                        step === s
                          ? 'w-6 bg-brand shadow-[0_0_8px_var(--theme-accent-glow,rgba(232,133,42,0.6))]'
                          : step > s
                          ? 'w-3 bg-brand/50'
                          : 'w-2 bg-white/20'
                      )}
                    />
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {/* ══════════════════════════════════════════════════════════ */}
                {/* STEP 0: Identity & Boring Avatar Studio                   */}
                {/* ══════════════════════════════════════════════════════════ */}
                {step === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="relative z-10 flex flex-col"
                  >
                    <div className="text-center mb-6">
                      <h2 className="text-2xl sm:text-3xl font-black font-display text-foreground mb-1 tracking-tight">
                        Craft Your Cinephile Persona
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Powered by <span className="text-brand font-semibold">Boring Avatars</span> — CineVault signature Beam theme
                      </p>
                    </div>

                    {/* Live Avatar Preview Card */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-white/[0.03] border border-white/10 mb-5 shadow-inner">
                      <div className="relative group shrink-0">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-black/60 border-2 border-brand/80 shadow-[0_0_30px_var(--theme-accent-glow,rgba(232,133,42,0.4))] flex items-center justify-center p-1 transition-transform duration-300 group-hover:scale-105">
                          <img
                            src={liveAvatarUrl}
                            alt="Boring Avatar Preview"
                            className="w-full h-full object-contain rounded-full"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleRandomize}
                          className={cn(
                            'absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand text-brand-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-transform cursor-pointer border-2 border-[#0b0c12]',
                            isSpinning && 'animate-spin'
                          )}
                          title="Reroll Avatar Seed & Palette"
                        >
                          <Dice5 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 w-full space-y-3">
                        <div>
                          <label className="text-[11px] font-mono uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                            Your Cinephile Nickname
                          </label>
                          <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => {
                              setNameInput(e.target.value);
                              setSeed(e.target.value);
                            }}
                            placeholder="e.g. Neo, Nolan, StarWatcher..."
                            maxLength={24}
                            className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                          />
                        </div>

                        {/* Signature Beam Theme Badge & Swatches */}
                        <div className="rounded-xl p-3 bg-white/[0.03] border border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono uppercase font-bold text-brand tracking-wider flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-brand" />
                              Beam Signature Theme
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                              variant="beam"
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {THEME_BEAM_COLORS.map((hex, idx) => (
                                <div
                                  key={idx}
                                  className="group/swatch relative flex items-center justify-center"
                                >
                                  <span
                                    className="w-5 h-5 rounded-full border border-black/40 shadow-sm transition-transform group-hover/swatch:scale-125"
                                    style={{ backgroundColor: hex }}
                                    title={hex}
                                  />
                                </div>
                              ))}
                            </div>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              5-Color System
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Preset Personas */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono uppercase font-bold text-muted-foreground tracking-wider">
                          Or Choose a Signature Preset
                        </span>
                        <span className="text-[11px] text-muted-foreground">1-Click Apply</span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 max-h-32 overflow-y-auto custom-scrollbar p-1">
                        {PRESET_AVATARS.map((avatar) => {
                          const isSelected = seed === avatar.seed && activeVariant === avatar.style;
                          return (
                            <button
                              key={avatar.id}
                              type="button"
                              onClick={() => {
                                setSeed(avatar.seed);
                                setNameInput(avatar.name);
                                setActiveVariant('beam');
                                setActivePaletteIndex(0);
                              }}
                              className={cn(
                                'w-12 h-12 rounded-full border transition-all cursor-pointer relative group flex items-center justify-center p-1 overflow-hidden mx-auto',
                                isSelected
                                  ? 'bg-brand/20 border-brand shadow-lg scale-110 ring-2 ring-brand/60'
                                  : 'bg-white/5 border-white/10 hover:border-white/40 hover:bg-white/15'
                              )}
                              title={`${avatar.name} (${avatar.tag})`}
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

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={handleSkip}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-2 px-3"
                      >
                        Skip for now
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="py-3 px-6 bg-brand text-brand-foreground font-bold text-sm rounded-full flex items-center gap-2 shadow-card hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                      >
                        <span>Next: Your Taste Universe</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* STEP 1: Taste Universe (Genre Selection)                  */}
                {/* ══════════════════════════════════════════════════════════ */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
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
                      <span className="text-xs font-mono text-brand font-bold">STEP 2 OF 4</span>
                    </div>

                    <div className="text-center mb-5">
                      <h2 className="text-2xl sm:text-3xl font-black font-display text-foreground mb-1 tracking-tight">
                        What Kind of Cinema Inspires You?
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Select your favorite genres to customize spotlight heroes and match scores
                      </p>
                    </div>

                    {/* Rich Genre Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5 max-h-[340px] overflow-y-auto custom-scrollbar p-1">
                      {RICH_GENRES.map((g) => {
                        const isSelected = selectedIds.includes(g.id);
                        const Icon = g.icon;
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => toggleGenre(g.id)}
                            className={cn(
                              'p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between gap-2.5 group',
                              isSelected
                                ? 'bg-brand/15 border-brand shadow-[0_0_20px_var(--theme-accent-glow,rgba(232,133,42,0.3))] ring-1 ring-brand/40'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div
                                className={cn(
                                  'w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-200 group-hover:scale-110 shadow-sm',
                                  g.badgeBg,
                                  g.badgeBorder,
                                  g.iconColor
                                )}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-5 h-5 rounded-full bg-brand text-brand-foreground flex items-center justify-center shadow-md shadow-brand/30 shrink-0"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </motion.div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4
                                className={cn(
                                  'text-xs sm:text-sm font-bold truncate leading-snug transition-colors',
                                  isSelected ? 'text-brand' : 'text-foreground'
                                )}
                              >
                                {g.label}
                              </h4>
                              <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 leading-snug">
                                {g.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        {selectedIds.length} {selectedIds.length === 1 ? 'genre' : 'genres'} selected
                      </span>

                      <button
                        type="button"
                        disabled={selectedIds.length === 0}
                        onClick={() => setStep(2)}
                        className={cn(
                          'py-3 px-6 rounded-full font-bold text-sm shadow-card transition-all flex items-center gap-2 cursor-pointer',
                          selectedIds.length > 0
                            ? 'bg-brand text-brand-foreground hover:scale-105 active:scale-95'
                            : 'bg-white/10 text-white/30 cursor-not-allowed'
                        )}
                      >
                        <span>Next: Streaming Preferences</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* STEP 2: Streaming & Brand Preferences                    */}
                {/* ══════════════════════════════════════════════════════════ */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
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
                      <span className="text-xs font-mono text-brand font-bold">STEP 3 OF 4</span>
                    </div>

                    <div className="text-center mb-6">
                      <h2 className="text-2xl sm:text-3xl font-black font-display text-foreground mb-1 tracking-tight">
                        Dial In Your Experience
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Customize playback language and visual branding
                      </p>
                    </div>

                    <div className="space-y-4 mb-6">
                      {/* Audio Preference Card */}
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Languages className="w-4 h-4 text-brand" />
                            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                              Anime & International Audio
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setAudioPref('sub')}
                            className={cn(
                              'p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer',
                              audioPref === 'sub'
                                ? 'bg-brand/20 border-brand text-brand shadow-sm'
                                : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <div>
                              <div className="text-xs font-bold">Original + Subtitles (SUB)</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">Authentic Japanese / Original Voice</div>
                            </div>
                            {audioPref === 'sub' && <Check className="w-4 h-4 text-brand shrink-0" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => setAudioPref('dub')}
                            className={cn(
                              'p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer',
                              audioPref === 'dub'
                                ? 'bg-brand/20 border-brand text-brand shadow-sm'
                                : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <div>
                              <div className="text-xs font-bold">English Dubbed (DUB)</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">Full English Voiceover Track</div>
                            </div>
                            {audioPref === 'dub' && <Check className="w-4 h-4 text-brand shrink-0" />}
                          </button>
                        </div>
                      </div>

                      {/* Brand Logo Preference Card */}
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-brand" />
                            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                              Navbar Brand Mascot
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setLogoStylePref('vault')}
                            className={cn(
                              'p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer',
                              logoStylePref === 'vault'
                                ? 'bg-brand/20 border-brand text-brand shadow-sm'
                                : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <div className="w-6 h-6 bg-brand brand-logo-vault shrink-0" />
                            <div>
                              <div className="text-xs font-bold">Vault Safe</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">Sleek obsidian safe vault</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setLogoStylePref('cat')}
                            className={cn(
                              'p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer',
                              logoStylePref === 'cat'
                                ? 'bg-brand/20 border-brand text-brand shadow-sm'
                                : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <div className="w-6 h-6 bg-brand brand-logo-cat shrink-0" />
                            <div>
                              <div className="text-xs font-bold">Neko Cat</div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">Playful anime lucky cat</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={handleSkip}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        Skip
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="py-3 px-6 bg-brand text-brand-foreground font-bold text-sm rounded-full flex items-center gap-2 shadow-card hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                      >
                        <span>Generate VIP Passport</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* STEP 3: Grand Welcome & VIP Passport                      */}
                {/* ══════════════════════════════════════════════════════════ */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10 flex flex-col items-center text-center"
                  >
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/15 border border-brand/40 text-brand text-xs font-mono font-bold uppercase tracking-wider mb-4 shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5" /> VIP Passport Ready
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-black font-display text-foreground mb-2">
                      Welcome to the Vault, {nameInput || 'Cinephile'}!
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-md">
                      Your personalized streaming sanctuary is ready with zero ads, ultra-fast servers, and your curated genres.
                    </p>

                    {/* Holographic VIP Member Card */}
                    <div className="w-full max-w-md p-5 rounded-2xl bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-black/60 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_var(--theme-accent-glow,rgba(232,133,42,0.2))] mb-6 relative overflow-hidden text-left">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-brand shadow-md p-0.5 bg-black/60">
                            <img
                              src={liveAvatarUrl}
                              alt={nameInput}
                              className="w-full h-full object-contain rounded-full"
                            />
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold text-white leading-tight">
                              {nameInput || 'Cinephile'}
                            </h3>
                            <span className="text-[11px] font-mono text-brand font-bold uppercase tracking-wider">
                              Vault Pioneer Member
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-brand bg-brand/10 border border-brand/30 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-current" /> VIP
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-3 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono uppercase text-muted-foreground mr-1">Tastes:</span>
                        {RICH_GENRES.filter((g) => selectedIds.includes(g.id))
                          .slice(0, 4)
                          .map((g) => (
                            <span
                              key={g.id}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-white/90"
                            >
                              {g.label}
                            </span>
                          ))}
                        {selectedIds.length > 4 && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            +{selectedIds.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Launch Button */}
                    <button
                      type="button"
                      onClick={handleFinish}
                      className="w-full py-4 px-8 bg-brand hover:bg-brand/90 text-brand-foreground font-black text-base rounded-full shadow-[0_10px_35px_rgba(232,133,42,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <Sparkles className="w-5 h-5" />
                      <span>Enter CineVault</span>
                    </button>
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
