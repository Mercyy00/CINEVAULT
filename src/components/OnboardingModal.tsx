import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import FocusLock from 'react-focus-lock';
import { useApp } from '../store';
import { cn } from '../lib/utils';
import { Check } from 'lucide-react';

const GENRES = [
  { id: '28', label: 'Action', type: 'movie' },
  { id: '878', label: 'Sci-Fi', type: 'movie' },
  { id: '10749', label: 'Romance', type: 'movie' },
  { id: '27', label: 'Horror', type: 'movie' },
  { id: '16', label: 'Anime', type: 'tv' },
  { id: '53', label: 'Thriller', type: 'movie' },
  { id: '35', label: 'Comedy', type: 'movie' },
  { id: '18', label: 'Drama', type: 'movie' }
];

export function OnboardingModal() {
  const { onboardingComplete, setOnboardingComplete, setUserPreferences, userProfile } = useApp();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if not completed and after a small delay to let app mount
    if (!onboardingComplete) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [onboardingComplete]);

  const toggleGenre = (genreStr: string) => {
    if (selected.includes(genreStr)) {
      setSelected(selected.filter(g => g !== genreStr));
    } else {
      if (selected.length < 3) {
        setSelected([...selected, genreStr]);
      }
    }
  };

  const handleFinish = () => {
    setUserPreferences(selected);
    setIsVisible(false);
    setTimeout(() => {
      setOnboardingComplete(true);
    }, 500); // Wait for exit animation
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
              {step === 1 ? (
                <motion.div 
                  key="step1"
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
                  <h1 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-4 tracking-wide drop-shadow-sm">Welcome to <span className="text-brand">CineVault</span></h1>
                  <p className="text-muted-foreground text-lg mb-10 max-w-sm mx-auto">Your premium cinematic universe awaits. Let's tailor your experience.</p>
                  
                  <button 
                    onClick={() => setStep(2)}
                    className="bg-brand hover:bg-brand/90 text-background font-bold py-3 px-10 rounded-full text-lg shadow-card transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                  >
                    Get Started
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative z-10"
                >
                  <h2 className="text-3xl font-bold font-display text-foreground mb-2">What do you love?</h2>
                  <p className="text-muted-foreground mb-8">Select exactly <span className="text-brand font-bold">3</span> favorite genres.</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
                    {GENRES.map((g) => {
                       const genreStr = JSON.stringify(g);
                       const isSelected = selected.includes(genreStr);
                       const disabled = selected.length >= 3 && !isSelected;
                       return (
                         <button
                           key={g.id}
                           disabled={disabled}
                           onClick={() => toggleGenre(genreStr)}
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
                               <span className="flex items-center gap-2"><Check className="w-4 h-4" /> {g.label}</span>
                             </motion.div>
                           )}
                           <span className={cn(isSelected && "invisible")}>{g.label}</span>
                         </button>
                       )
                    })}
                  </div>
                  
                  <button 
                    disabled={selected.length !== 3}
                    onClick={handleFinish}
                    className={cn(
                      "font-bold py-3 px-10 rounded-full text-lg shadow-card transition-all duration-300",
                      selected.length === 3 
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
