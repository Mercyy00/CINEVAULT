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
  Shuffle,
  Film,
} from 'lucide-react';

interface TasteItem extends UserPreference {
  id: string;
  icon: LucideIcon;
}

const GENRES: TasteItem[] = [
  { id: '28', label: 'Action', genres: '28', type: 'movie', icon: Flame },
  { id: '878', label: 'Sci-Fi', genres: '878', type: 'movie', icon: Rocket },
  { id: '16', label: 'Anime', genres: '16', type: 'tv', icon: Sparkles },
  { id: 'bollywood', label: 'Bollywood & Desi', genres: 'bollywood', type: 'movie', icon: Film },
  { id: '53', label: 'Thriller', genres: '53', type: 'movie', icon: Crosshair },
  { id: '27', label: 'Horror', genres: '27', type: 'movie', icon: Skull },
  { id: '18', label: 'Drama', genres: '18', type: 'movie', icon: Clapperboard },
  { id: '35', label: 'Comedy', genres: '35', type: 'movie', icon: Laugh },
  { id: '10749', label: 'Romance', genres: '10749', type: 'movie', icon: Heart },
  { id: '14', label: 'Fantasy', genres: '14', type: 'movie', icon: Wand2 },
  { id: '9648', label: 'Mystery', genres: '9648', type: 'movie', icon: Search },
  { id: '80', label: 'Crime', genres: '80', type: 'movie', icon: Fingerprint },
];

const RANDOM_SEEDS = [
  'Cinephile', 'NeoMatrix', 'Auteur', 'Solaris', 'Valkyrie', 'Miru',
  'CyberRogue', 'Interstellar', 'Ronin', 'Starlight', 'Director', 'BladeRunner',
];

const TOTAL_STEPS = 3;

export function OnboardingModal() {
  const {
    onboardingComplete,
    setOnboardingComplete,
    setUserPreferences,
    userProfile,
    updateUserProfile,
  } = useApp();

  const [step, setStep] = useState(0); // 0: You, 1: Taste, 2: Playback
  const [nameInput, setNameInput] = useState(
    userProfile.name && userProfile.name !== 'Guest' ? userProfile.name : ''
  );

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

  const handleRandomize = () => {
    setIsSpinning(true);
    const seed =
      RANDOM_SEEDS[Math.floor(Math.random() * RANDOM_SEEDS.length)] +
      Math.floor(Math.random() * 999);
    setSelectedAvatarUrl(getBoringAvatarUrl('beam', seed, THEME_BEAM_COLORS));
    window.setTimeout(() => setIsSpinning(false), 350);
  };

  const handleFinish = () => {
    updateUserProfile({
      name: nameInput.trim() || 'Cinephile',
      avatar: selectedAvatarUrl || DEFAULT_EMPTY_AVATAR,
      audioPreference: audioPref,
      logoStyle: logoStylePref,
    });

    const chosen = GENRES.filter((g) => selectedIds.includes(g.id)).map(
      ({ label, genres, type }) => ({ label, genres, type })
    );

    setUserPreferences(
      chosen.length > 0 ? chosen : [{ label: 'Action', genres: '28', type: 'movie' }]
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

  const stepTitles = ['Set up your profile', 'What do you like to watch?', 'How you like to watch'];
  const stepSubtitles = [
    'A name and a face so your household knows whose list is whose.',
    'Pick a few genres and your home screen fills up with the right titles.',
    'Two quick preferences you can change any time from settings.',
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 bg-black/80 backdrop-blur-xl pointer-events-auto"
        >
          <motion.div
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card border border-border w-full max-w-lg mx-auto rounded-t-3xl sm:rounded-2xl shadow-2xl relative overflow-hidden text-foreground flex flex-col max-h-[92vh]"
          >
            <FocusLock returnFocus>
              {/* Header: brand + step progress */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-6 h-6 bg-foreground',
                      logoStylePref === 'vault' ? 'brand-logo-vault' : 'brand-logo-cat'
                    )}
                  />
                  <span className="font-display font-bold tracking-tight">CineVault</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: TOTAL_STEPS }).map((_, s) => (
                    <div
                      key={s}
                      className={cn(
                        'h-1 rounded-full transition-all duration-300',
                        step === s ? 'w-6 bg-foreground' : step > s ? 'w-3 bg-foreground/50' : 'w-3 bg-muted'
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="px-6 pb-3">
                <h2 className="text-2xl font-display font-bold tracking-tight">{stepTitles[step]}</h2>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{stepSubtitles[step]}</p>
              </div>

              <div className="px-6 overflow-y-auto custom-scrollbar flex-1">
                <AnimatePresence mode="wait">
                  {/* ── Step 0: profile ─────────────────────────────── */}
                  {step === 0 && (
                    <motion.div
                      key="step0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="py-2"
                    >
                      <div className="flex items-center gap-4 mb-5">
                        <div className="relative shrink-0">
                          <div className="w-20 h-20 rounded-full overflow-hidden bg-muted border border-border flex items-center justify-center p-1">
                            <img
                              src={selectedAvatarUrl || DEFAULT_EMPTY_AVATAR}
                              alt=""
                              className="w-full h-full object-contain rounded-full"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleRandomize}
                            aria-label="Shuffle avatar"
                            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer border-2 border-card"
                          >
                            <Shuffle className={cn('w-4 h-4', isSpinning && 'animate-spin')} />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <label htmlFor="ob-name" className="block text-sm font-medium mb-1.5">Your name</label>
                          <input
                            id="ob-name"
                            type="text"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            placeholder="e.g. Alex"
                            maxLength={24}
                            className="w-full bg-input/60 border border-border rounded-xl px-4 py-3 text-base outline-none focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10 placeholder:text-muted-foreground/50 transition-colors"
                          />
                        </div>
                      </div>

                      <span className="block text-sm font-medium mb-2.5">Choose an avatar</span>
                      <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5 pb-2">
                        {allAvatarChoices.map((avatar) => {
                          const isSelected =
                            selectedAvatarUrl === avatar.url ||
                            (avatar.id === 'empty-default' && selectedAvatarUrl === DEFAULT_EMPTY_AVATAR);
                          return (
                            <button
                              key={avatar.id}
                              type="button"
                              onClick={() => setSelectedAvatarUrl(avatar.url)}
                              aria-label={avatar.name}
                              aria-pressed={isSelected}
                              className={cn(
                                'aspect-square rounded-full border transition-all cursor-pointer flex items-center justify-center p-1 overflow-hidden',
                                isSelected
                                  ? 'border-foreground ring-2 ring-foreground/30'
                                  : 'border-border hover:border-foreground/40'
                              )}
                            >
                              <img
                                src={avatar.url}
                                alt=""
                                className="w-full h-full object-contain rounded-full"
                                loading="lazy"
                              />
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 1: taste ───────────────────────────────── */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="py-2"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pb-2">
                        {GENRES.map((g) => {
                          const isSelected = selectedIds.includes(g.id);
                          const Icon = g.icon;
                          return (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => toggleGenre(g.id)}
                              aria-pressed={isSelected}
                              className={cn(
                                'relative rounded-xl border px-3 py-4 flex flex-col items-center gap-2 transition-all cursor-pointer',
                                isSelected
                                  ? 'border-foreground bg-foreground/[0.06] ring-1 ring-foreground/20'
                                  : 'border-border hover:border-foreground/40 hover:bg-foreground/[0.03]'
                              )}
                            >
                              {isSelected && (
                                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </span>
                              )}
                              <Icon className={cn('w-6 h-6', isSelected ? 'text-foreground' : 'text-muted-foreground')} />
                              <span className={cn('text-sm font-medium text-center leading-tight', isSelected ? 'text-foreground' : 'text-muted-foreground')}>
                                {g.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* ── Step 2: playback ────────────────────────────── */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="py-2 space-y-6"
                    >
                      <div>
                        <span className="block text-sm font-medium mb-2.5">Anime & foreign-language audio</span>
                        <div className="grid grid-cols-2 gap-2.5">
                          {([
                            { key: 'sub' as const, title: 'Subtitles', desc: 'Original voice, subtitled' },
                            { key: 'dub' as const, title: 'Dubbed', desc: 'English voiceover' },
                          ]).map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setAudioPref(opt.key)}
                              aria-pressed={audioPref === opt.key}
                              className={cn(
                                'rounded-xl border p-3.5 text-left transition-all cursor-pointer',
                                audioPref === opt.key
                                  ? 'border-foreground bg-foreground/[0.06] ring-1 ring-foreground/20'
                                  : 'border-border hover:border-foreground/40'
                              )}
                            >
                              <div className="text-sm font-semibold">{opt.title}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="block text-sm font-medium mb-2.5">Logo mark</span>
                        <div className="grid grid-cols-2 gap-2.5">
                          {([
                            { key: 'vault' as const, title: 'Vault', cls: 'brand-logo-vault' },
                            { key: 'cat' as const, title: 'Neko', cls: 'brand-logo-cat' },
                          ]).map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setLogoStylePref(opt.key)}
                              aria-pressed={logoStylePref === opt.key}
                              className={cn(
                                'rounded-xl border p-3.5 flex items-center gap-3 transition-all cursor-pointer',
                                logoStylePref === opt.key
                                  ? 'border-foreground bg-foreground/[0.06] ring-1 ring-foreground/20'
                                  : 'border-border hover:border-foreground/40'
                              )}
                            >
                              <div className={cn('w-7 h-7 bg-foreground shrink-0', opt.cls)} />
                              <span className="text-sm font-semibold">{opt.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border safe-bottom">
                {step === 0 ? (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Skip
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                )}

                {step < TOTAL_STEPS - 1 ? (
                  <button
                    type="button"
                    disabled={step === 1 && selectedIds.length === 0}
                    onClick={() => setStep((s) => s + 1)}
                    className="py-3 px-6 bg-primary text-primary-foreground font-semibold text-base rounded-full flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="py-3 px-6 bg-primary text-primary-foreground font-semibold text-base rounded-full flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Start watching <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </FocusLock>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
