import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FocusLock from 'react-focus-lock';
import { useApp, type UserPreference } from '../store';
import {
  PRESET_AVATARS,
  EMPTY_AVATAR_PRESET,
  DEFAULT_EMPTY_AVATAR,
  THEME_BEAM_COLORS,
  getBoringAvatarUrl,
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
  User,
} from 'lucide-react';

interface CinematicTasteItem extends UserPreference {
  id: string;
  icon: LucideIcon;
  tagline: string;
  vibeBadge: string;
  classics: string[];
  gradient: string;
  glowColor: string;
  accentBorder: string;
  badgeClass: string;
  iconClass: string;
}

const CINEMATIC_TASTE_MATRIX: CinematicTasteItem[] = [
  {
    id: '28',
    label: 'Action',
    genres: '28',
    type: 'movie',
    icon: Flame,
    tagline: 'High-octane blockbusters & relentless adrenaline',
    vibeBadge: 'High-Octane • Adrenaline',
    classics: ['The Dark Knight', 'Mad Max: Fury Road', 'John Wick'],
    gradient: 'from-orange-500/20 via-amber-500/10 to-transparent',
    glowColor: 'rgba(249, 115, 22, 0.25)',
    accentBorder: 'border-orange-500/40 hover:border-orange-500',
    iconClass: 'text-orange-400',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  },
  {
    id: '878',
    label: 'Sci-Fi',
    genres: '878',
    type: 'movie',
    icon: Rocket,
    tagline: 'Deep cosmos, cyberpunk futures & time loops',
    vibeBadge: 'Cosmic • Cyberpunk',
    classics: ['Interstellar', 'The Matrix', 'Blade Runner 2049'],
    gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    glowColor: 'rgba(6, 182, 212, 0.25)',
    accentBorder: 'border-cyan-500/40 hover:border-cyan-500',
    iconClass: 'text-cyan-400',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
  {
    id: '16',
    label: 'Anime',
    genres: '16',
    type: 'tv',
    icon: Sparkles,
    tagline: 'Legendary shonen epics, dark fantasy & slice-of-life',
    vibeBadge: 'Shonen • Masterpieces',
    classics: ['Your Name', 'Attack on Titan', 'Jujutsu Kaisen'],
    gradient: 'from-pink-500/20 via-purple-500/10 to-transparent',
    glowColor: 'rgba(236, 72, 153, 0.25)',
    accentBorder: 'border-pink-500/40 hover:border-pink-500',
    iconClass: 'text-pink-400',
    badgeClass: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
  },
  {
    id: 'bollywood',
    label: 'Bollywood & Desi',
    genres: 'bollywood',
    type: 'movie',
    icon: Film,
    tagline: 'Grand scale blockbusters, soul-stirring music & masala',
    vibeBadge: 'Blockbusters • Masala',
    classics: ['RRR', 'K.G.F', 'Jawan', 'Dilwale Dulhania'],
    gradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    accentBorder: 'border-amber-500/40 hover:border-amber-500',
    iconClass: 'text-amber-400',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  {
    id: '53',
    label: 'Thriller',
    genres: '53',
    type: 'movie',
    icon: Crosshair,
    tagline: 'Psychological suspense, gripping puzzles & nail-biting twists',
    vibeBadge: 'Mind-Benders • Twists',
    classics: ['Fight Club', 'Se7en', 'Shutter Island'],
    gradient: 'from-red-500/20 via-rose-500/10 to-transparent',
    glowColor: 'rgba(239, 68, 68, 0.25)',
    accentBorder: 'border-red-500/40 hover:border-red-500',
    iconClass: 'text-red-400',
    badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30',
  },
  {
    id: '27',
    label: 'Horror',
    genres: '27',
    type: 'movie',
    icon: Skull,
    tagline: 'Supernatural chills, cosmic dread & psychological tension',
    vibeBadge: 'Supernatural • Dread',
    classics: ['The Shining', 'Hereditary', 'The Conjuring'],
    gradient: 'from-purple-500/20 via-violet-500/10 to-transparent',
    glowColor: 'rgba(168, 85, 247, 0.25)',
    accentBorder: 'border-purple-500/40 hover:border-purple-500',
    iconClass: 'text-purple-400',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  {
    id: '18',
    label: 'Drama',
    genres: '18',
    type: 'movie',
    icon: Clapperboard,
    tagline: 'Profound auteur cinema, character journeys & human drama',
    vibeBadge: 'Auteur • Emotional',
    classics: ['Oppenheimer', 'Parasite', 'The Shawshank Redemption'],
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    accentBorder: 'border-emerald-500/40 hover:border-emerald-500',
    iconClass: 'text-emerald-400',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  {
    id: '35',
    label: 'Comedy',
    genres: '35',
    type: 'movie',
    icon: Laugh,
    tagline: 'Sharp wit, satirical laughs & uplifting feel-good energy',
    vibeBadge: 'Sharp Satire • Laughs',
    classics: ['The Grand Budapest Hotel', 'Superbad', 'Knives Out'],
    gradient: 'from-yellow-500/20 via-amber-500/10 to-transparent',
    glowColor: 'rgba(234, 179, 8, 0.25)',
    accentBorder: 'border-yellow-500/40 hover:border-yellow-500',
    iconClass: 'text-yellow-400',
    badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  },
  {
    id: '10749',
    label: 'Romance',
    genres: '10749',
    type: 'movie',
    icon: Heart,
    tagline: 'Passionate connections, poetic heartbreak & romantic odysseys',
    vibeBadge: 'Passionate • Heartfelt',
    classics: ['La La Land', 'Titanic', 'Past Lives'],
    gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
    glowColor: 'rgba(244, 63, 94, 0.25)',
    accentBorder: 'border-rose-500/40 hover:border-rose-500',
    iconClass: 'text-rose-400',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
  {
    id: '14',
    label: 'Fantasy',
    genres: '14',
    type: 'movie',
    icon: Wand2,
    tagline: 'Mythical realms, ancient spells & grand sword & sorcery',
    vibeBadge: 'Mythic • Worldbuilding',
    classics: ['The Lord of the Rings', 'Dune', 'Harry Potter'],
    gradient: 'from-violet-500/20 via-indigo-500/10 to-transparent',
    glowColor: 'rgba(139, 92, 246, 0.25)',
    accentBorder: 'border-violet-500/40 hover:border-violet-500',
    iconClass: 'text-violet-400',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  },
  {
    id: '9648',
    label: 'Mystery',
    genres: '9648',
    type: 'movie',
    icon: Search,
    tagline: 'Whodunits, atmospheric noir detectives & cryptic clues',
    vibeBadge: 'Whodunit • Detective',
    classics: ['Knives Out', 'Glass Onion', 'Prisoners'],
    gradient: 'from-sky-500/20 via-blue-500/10 to-transparent',
    glowColor: 'rgba(14, 165, 233, 0.25)',
    accentBorder: 'border-sky-500/40 hover:border-sky-500',
    iconClass: 'text-sky-400',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
  {
    id: '80',
    label: 'Crime',
    genres: '80',
    type: 'movie',
    icon: Fingerprint,
    tagline: 'Underworld syndicates, heist operations & gritty investigations',
    vibeBadge: 'Mob Sagas • Heists',
    classics: ['The Godfather', 'Goodfellas', 'The Departed'],
    gradient: 'from-teal-500/20 via-emerald-500/10 to-transparent',
    glowColor: 'rgba(20, 184, 166, 0.25)',
    accentBorder: 'border-teal-500/40 hover:border-teal-500',
    iconClass: 'text-teal-400',
    badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
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
  const [nameInput, setNameInput] = useState(userProfile.name && userProfile.name !== 'Guest' ? userProfile.name : '');
  
  // Default to empty avatar unless user explicitly had a custom one chosen
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(() => {
    if (userProfile.avatar && userProfile.avatar !== 'beam-director' && userProfile.avatar !== 'default') {
      return userProfile.avatar;
    }
    return DEFAULT_EMPTY_AVATAR;
  });

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

  const toggleGenre = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectTopFour = () => {
    setSelectedIds(['28', '878', '16', 'bollywood']);
  };

  const selectAllGenres = () => {
    setSelectedIds(CINEMATIC_TASTE_MATRIX.map((g) => g.id));
  };

  const clearGenres = () => {
    setSelectedIds([]);
  };

  // Roll a fresh avatar when the user explicitly clicks Randomize
  const handleRandomize = () => {
    setIsSpinning(true);
    const randomSeed =
      RANDOM_SEEDS[Math.floor(Math.random() * RANDOM_SEEDS.length)] +
      Math.floor(Math.random() * 999);
    const newAvatar = getBoringAvatarUrl('beam', randomSeed, THEME_BEAM_COLORS);
    setSelectedAvatarUrl(newAvatar);
    window.setTimeout(() => setIsSpinning(false), 350);
  };

  const handleFinish = () => {
    updateUserProfile({
      name: nameInput.trim() || 'Cinephile',
      avatar: selectedAvatarUrl || DEFAULT_EMPTY_AVATAR,
      audioPreference: audioPref,
      logoStyle: logoStylePref,
    });

    const chosenGenres = CINEMATIC_TASTE_MATRIX.filter((g) => selectedIds.includes(g.id)).map(
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

  const allAvatarChoices = [EMPTY_AVATAR_PRESET, ...PRESET_AVATARS];

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
          <div
            className={cn(
              'bg-[#0b0c12]/95 border border-white/15 p-5 sm:p-7 md:p-8 rounded-3xl shadow-[0_25px_80px_rgba(0,0,0,0.95),0_0_50px_rgba(232,133,42,0.15)] w-full mx-auto relative overflow-hidden text-foreground transition-all duration-300',
              step === 1 ? 'max-w-4xl sm:max-w-5xl' : 'max-w-2xl sm:max-w-3xl'
            )}
          >
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
                {/* STEP 0: Identity & Persona Studio                         */}
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
                        Choose Your CineVault Identity
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Default empty avatar silhouette — type your nickname and choose an avatar if you want one
                      </p>
                    </div>

                    {/* Avatar Preview Card */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-5 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 mb-6 shadow-inner">
                      <div className="relative group shrink-0">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-black/70 border-2 border-brand/80 shadow-[0_0_30px_var(--theme-accent-glow,rgba(232,133,42,0.4))] flex items-center justify-center p-1 transition-transform duration-300 group-hover:scale-105">
                          <img
                            src={selectedAvatarUrl || DEFAULT_EMPTY_AVATAR}
                            alt="Avatar Preview"
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
                          title="Roll Random Avatar"
                        >
                          <Dice5 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex-1 w-full space-y-3">
                        <div>
                          <label className="text-[11px] font-mono uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                            Your Nickname
                          </label>
                          <input
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            placeholder="e.g. Neo, Nolan, StarWatcher..."
                            maxLength={24}
                            className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
                          />
                          <p className="text-[11px] text-muted-foreground/80 mt-1">
                            Typing your name won't change your avatar. Select an avatar below or keep the empty default.
                          </p>
                        </div>

                        {/* Quick Controls */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedAvatarUrl(DEFAULT_EMPTY_AVATAR)}
                            className={cn(
                              'text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer font-medium',
                              selectedAvatarUrl === DEFAULT_EMPTY_AVATAR
                                ? 'bg-brand/20 border-brand text-brand shadow-sm ring-1 ring-brand/50'
                                : 'bg-white/5 border-white/10 text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <User className="w-3.5 h-3.5" />
                            <span>Empty Default</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleRandomize}
                            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 cursor-pointer font-medium"
                          >
                            <Dice5 className={cn('w-3.5 h-3.5 text-brand', isSpinning && 'animate-spin')} />
                            <span>Roll Avatar</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Choose an Avatar Preset */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-mono uppercase font-bold text-muted-foreground tracking-wider">
                          Choose an Avatar (Optional)
                        </span>
                        <span className="text-[11px] text-muted-foreground">Click any avatar to select</span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-9 gap-2.5 max-h-36 overflow-y-auto custom-scrollbar p-1">
                        {allAvatarChoices.map((avatar) => {
                          const isSelected =
                            selectedAvatarUrl === avatar.url ||
                            (avatar.id === 'empty-default' && selectedAvatarUrl === DEFAULT_EMPTY_AVATAR);
                          return (
                            <button
                              key={avatar.id}
                              type="button"
                              onClick={() => setSelectedAvatarUrl(avatar.url)}
                              className={cn(
                                'w-12 h-12 rounded-full border transition-all cursor-pointer relative group flex items-center justify-center p-1 overflow-hidden mx-auto',
                                isSelected
                                  ? 'bg-brand/25 border-brand shadow-lg scale-110 ring-2 ring-brand/60'
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
                        <span>Next: Taste Matrix</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* ══════════════════════════════════════════════════════════ */}
                {/* STEP 1: Cinematic Taste & Vibe Matrix                     */}
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
                    <div className="flex items-center justify-between mb-3">
                      <button
                        type="button"
                        onClick={() => setStep(0)}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </button>
                      <span className="text-xs font-mono text-brand font-bold">STEP 2 OF 4</span>
                    </div>

                    <div className="text-center mb-3">
                      <h2 className="text-2xl sm:text-3xl font-black font-display text-foreground mb-1 tracking-tight">
                        Cinematic Taste & Vibe Matrix
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Select your favorite genres and cinematic vibes to personalize your homepage feed
                      </p>
                    </div>

                    {/* Quick Select & Filter Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl border border-white/10 bg-black/40 mb-3 select-none">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-brand" />
                        <span className="text-[11px] font-mono uppercase tracking-wider text-white/80 font-bold">
                          Quick Presets:
                        </span>
                        <button
                          type="button"
                          onClick={selectTopFour}
                          className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 hover:text-white transition-colors cursor-pointer font-medium"
                        >
                          Popular 4
                        </button>
                        <button
                          type="button"
                          onClick={selectAllGenres}
                          className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 hover:text-white transition-colors cursor-pointer font-medium"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={clearGenres}
                          className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-muted-foreground hover:text-white transition-colors cursor-pointer font-medium"
                        >
                          Clear
                        </button>
                      </div>

                      <div className="text-[11px] font-mono text-brand font-semibold">
                        {selectedIds.length} of {CINEMATIC_TASTE_MATRIX.length} selected
                      </div>
                    </div>

                    {/* Zero-Lag Cinematic Taste Matrix Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4 max-h-[50vh] overflow-y-auto custom-scrollbar p-1">
                      {CINEMATIC_TASTE_MATRIX.map((g) => {
                        const isSelected = selectedIds.includes(g.id);
                        const Icon = g.icon;
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => toggleGenre(g.id)}
                            style={{
                              boxShadow: isSelected ? `0 0 25px ${g.glowColor}` : undefined,
                            }}
                            className={cn(
                              'group relative rounded-2xl border text-left overflow-hidden transition-all duration-300 cursor-pointer p-4 flex flex-col justify-between gap-3 min-h-[140px]',
                              isSelected
                                ? cn('bg-white/[0.08] ring-2 ring-brand/70 scale-[1.01]', g.accentBorder)
                                : 'bg-white/[0.03] border-white/10 hover:border-white/30 hover:bg-white/[0.06] hover:scale-[1.01]'
                            )}
                          >
                            {/* Ambient Radial Gradient Glow */}
                            <div
                              className={cn(
                                'absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity duration-300 pointer-events-none -z-10',
                                g.gradient
                              )}
                            />

                            {/* Top Row: Icon + Title + Selected Check */}
                            <div className="flex items-start justify-between gap-2 w-full">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={cn(
                                    'w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 shrink-0 shadow-inner',
                                    isSelected
                                      ? 'bg-black/60 border-brand/60 scale-105'
                                      : 'bg-black/40 border-white/15 group-hover:border-white/30'
                                  )}
                                >
                                  <Icon className={cn('w-5 h-5 transition-transform duration-300 group-hover:scale-110', g.iconClass)} />
                                </div>
                                <div className="min-w-0">
                                  <h3
                                    className={cn(
                                      'text-sm sm:text-base font-extrabold truncate tracking-tight transition-colors',
                                      isSelected ? 'text-white' : 'text-white/90 group-hover:text-white'
                                    )}
                                  >
                                    {g.label}
                                  </h3>
                                  <span
                                    className={cn(
                                      'inline-block text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border mt-0.5',
                                      g.badgeClass
                                    )}
                                  >
                                    {g.vibeBadge}
                                  </span>
                                </div>
                              </div>

                              {/* Selected Status Circle */}
                              <div
                                className={cn(
                                  'w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 border shrink-0',
                                  isSelected
                                    ? 'bg-brand border-brand text-brand-foreground scale-100 shadow-[0_0_10px_rgba(232,133,42,0.6)]'
                                    : 'bg-black/40 border-white/20 text-transparent scale-90 group-hover:border-white/40'
                                )}
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            </div>

                            {/* Middle: Tagline */}
                            <p className="text-[11px] text-white/70 line-clamp-2 leading-relaxed">
                              {g.tagline}
                            </p>

                            {/* Bottom: Iconic Titles Pills */}
                            <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-white/5">
                              {g.classics.map((film) => (
                                <span
                                  key={film}
                                  className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-black/40 border border-white/10 text-white/80"
                                >
                                  {film}
                                </span>
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-xs text-muted-foreground font-mono">
                        {selectedIds.length} {selectedIds.length === 1 ? 'vibe' : 'vibes'} selected
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
                      Welcome to the Vault, {nameInput.trim() || 'Cinephile'}!
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
                              src={selectedAvatarUrl || DEFAULT_EMPTY_AVATAR}
                              alt={nameInput || 'User Avatar'}
                              className="w-full h-full object-contain rounded-full"
                            />
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold text-white leading-tight">
                              {nameInput.trim() || 'Cinephile'}
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
                        {CINEMATIC_TASTE_MATRIX.filter((g) => selectedIds.includes(g.id))
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
