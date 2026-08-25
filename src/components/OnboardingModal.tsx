import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FocusLock from 'react-focus-lock';
import { useApp, type UserPreference } from '../store';
import { cn } from '../lib/utils';
import { Check, LogIn, UserCircle2, Sparkles } from 'lucide-react';

const REQUIRED_PICKS = 3;

/**
 * Onboarding taste picker.
 *
 * The selections used to be held as `JSON.stringify(genre)` strings, compared
 * with `Array.includes` on those strings, and handed to the store as strings
 * that `App.tsx` re-parsed during render. They are objects the whole way
 * through now, keyed by id.
 */
const GENRES: Array<UserPreference & { id: string }> = [
  { id: '28', label: 'Action', genres: '28', type: 'movie' },
  { id: '878', label: 'Sci-Fi', genres: '878', type: 'movie' },
  { id: '10749', label: 'Romance', genres: '10749', type: 'movie' },
  { id: '27', label: 'Horror', genres: '27', type: 'movie' },
  { id: '16', label: 'Anime', genres: '16', type: 'tv' },
  { id: '53', label: 'Thriller', genres: '53', type: 'movie' },
  { id: '35', label: 'Comedy', genres: '35', type: 'movie' },
  { id: '18', label: 'Drama', genres: '18', type: 'movie' },
];

export function OnboardingModal() {
  const {
    onboardingComplete,
    setOnboardingComplete,
    setUserPreferences,
    userProfile,
    setAuthModalOpen,
    setAuthModalMode,
  } = useApp();
  const [step, setStep] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (onboardingComplete) return;
    const timer = window.setTimeout(() => setIsVisible(true), 500);
    return () => window.clearTimeout(timer);
  }, [onboardingComplete]);

  // If the user signs in via AuthModal, skip the welcome gate.
  useEffect(() => {
    if (userProfile.isLoggedIn && step === 0) setStep(2);
  }, [userProfile.isLoggedIn, step]);

  const toggleGenre = (id: string) => {
    setSelectedIds((previous) => {
      if (previous.includes(id)) return previous.filter((entry) => entry !== id);
      if (previous.length >= REQUIRED_PICKS) return previous;
      return [...previous, id];
    });
  };

  /**
   * Guests are just not-signed-in. The old version minted its own
   * `guest_<timestamp>_<random>` id into a second localStorage key, duplicating
   * the guest uid the store already creates, then called a
   * `recordGuestVisitor` endpoint that wrote a Firestore document for every
   * anonymous visitor. Neither is needed to browse.
   */
  const handleContinueAsGuest = () => setStep(2);

  const handleSignIn = () => {
    setAuthModalMode('signin');
    setAuthModalOpen(true);
  };

  const handleFinish = () => {
    setUserPreferences(
      GENRES.filter((genre) => selectedIds.includes(genre.id)).map(({ label, genres, type }) => ({
        label,
        genres,
        type,
      }))
    );
    setIsVisible(false);
    window.setTimeout(() => setOnboardingComplete(true), 500);
  };

  if (onboardingComplete) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl pointer-events-auto"
        >
          <div className="bg-card border border-white/10 p-8 md:p-12 rounded-2xl shadow-2xl max-w-xl w-[90%] mx-auto text-center relative overflow-hidden">
            <FocusLock returnFocus>
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand/50 via-brand to-brand/80" />
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
            
            <AnimatePresence mode="wait">
              {step === 0 ? (
                /* STEP 0: Welcome Gate — Sign In or Continue as Guest */
                <motion.div 
                  key="step0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative z-10 flex flex-col items-center"
                >
                  <div 
                    className={cn(
                      "w-16 h-16 bg-brand mb-6 transition-all drop-shadow-[0_0_25px_rgba(232,133,42,0.5)]",
                      userProfile.logoStyle === 'cat' ? "brand-logo-cat" : "brand-logo-vault"
                    )} 
                  />
                  <h1 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-3 tracking-wide drop-shadow-sm">Welcome to <span className="text-brand">CineVault</span></h1>
                  <p className="text-muted-foreground text-base mb-10 max-w-sm mx-auto">Your premium cinematic universe. Sign in to sync your data across devices, or explore as a guest.</p>
                  
                  <div className="w-full flex flex-col gap-3 max-w-xs mx-auto">
                    <button 
                      onClick={handleSignIn}
                      className="bg-brand hover:bg-brand/90 text-background font-bold py-3.5 px-8 rounded-full text-base shadow-card transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex items-center justify-center gap-2.5"
                    >
                      <LogIn className="w-5 h-5" />
                      Sign In / Create Account
                    </button>
                    
                    <button 
                      onClick={handleContinueAsGuest}
                      className="bg-white/5 hover:bg-white/10 text-foreground font-semibold py-3.5 px-8 rounded-full text-base border border-white/10 hover:border-white/20 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2.5"
                    >
                      <UserCircle2 className="w-5 h-5 text-muted-foreground" />
                      Continue as Guest
                    </button>
                  </div>

                  <p className="text-[11px] text-muted-foreground/60 mt-6 max-w-xs mx-auto">
                    Guest data is stored locally. Sign in anytime to sync across devices.
                  </p>
                </motion.div>
              ) : step === 1 ? (
                /* STEP 1: Welcome (kept for post-sign-in flow) */
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative z-10 flex flex-col items-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-brand/15 border border-brand/30 text-brand flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-3 tracking-wide drop-shadow-sm">
                    {userProfile.isLoggedIn ? `Hey, ${userProfile.name || 'Cinephile'}! 🎬` : 'Let\'s Personalize'}
                  </h1>
                  <p className="text-muted-foreground text-base mb-8 max-w-sm mx-auto">
                    {userProfile.isLoggedIn 
                      ? 'Your account is ready! Let\'s tailor your experience.' 
                      : 'Let\'s tailor your experience.'}
                  </p>
                  
                  <button 
                    onClick={() => setStep(2)}
                    className="bg-brand hover:bg-brand/90 text-background font-bold py-3 px-10 rounded-full text-lg shadow-card transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                  >
                    Get Started
                  </button>
                </motion.div>
              ) : (
                /* STEP 2: Genre Picker */
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative z-10"
                >
                  <h2 className="text-3xl font-bold font-display text-foreground mb-2">What do you love?</h2>
                  <p className="text-muted-foreground mb-8">Select exactly <span className="text-brand font-bold">{REQUIRED_PICKS}</span> favorite genres.</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
                    {GENRES.map((g) => {
                       const isSelected = selectedIds.includes(g.id);
                       const disabled = selectedIds.length >= REQUIRED_PICKS && !isSelected;
                       return (
                         <button
                           key={g.id}
                           type="button"
                           disabled={disabled}
                           aria-pressed={isSelected}
                           onClick={() => toggleGenre(g.id)}
                           className={cn(
                             "py-3 px-4 rounded-xl font-medium transition-all duration-200 border cursor-pointer relative overflow-hidden",
                             isSelected
                                ? "bg-brand border-brand text-background shadow-card"
                                : "bg-white/5 border-white/10 text-foreground hover:bg-white/10",
                             disabled && "opacity-50 cursor-not-allowed hover:bg-white/5"
                           )}
                         >
                           {isSelected && (
                             <motion.div
                               initial={{ scale: 0 }}
                               animate={{ scale: 1 }}
                               className="absolute inset-0 flex items-center justify-center bg-brand"
                             >
                               <span className="flex items-center gap-2"><Check className="w-4 h-4" aria-hidden="true" /> {g.label}</span>
                             </motion.div>
                           )}
                           <span className={cn(isSelected && "invisible")}>{g.label}</span>
                         </button>
                       )
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={selectedIds.length !== REQUIRED_PICKS}
                    onClick={handleFinish}
                    className={cn(
                      "font-bold py-3 px-10 rounded-full text-lg shadow-card transition-all duration-300",
                      selectedIds.length === REQUIRED_PICKS
                        ? "bg-brand hover:bg-brand/90 text-background hover:shadow-card cursor-pointer transform hover:-translate-y-1"
                        : "bg-white/10 text-foreground/30 cursor-not-allowed"
                    )}
                  >
                    Finish
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
