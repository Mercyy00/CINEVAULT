import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Clock, ShieldAlert, PartyPopper, Flame, KeyRound, Gift, CheckCircle2 } from 'lucide-react';
import { 
  ScheduleSectionConfig, 
  calculateSectionLockState, 
  SectionLockState 
} from '../config/birthdaySchedule';
import { playLuffySound } from '../utils/luffyAudio';
import { cn } from '../lib/utils';

interface LuffySectionGuardianProps {
  section: ScheduleSectionConfig;
  children: React.ReactNode;
  simulatedHour?: number | null;
  simulatedMinute?: number | null;
  forceUnlockAll?: boolean;
  className?: string;
}

export function LuffySectionGuardian({
  section,
  children,
  simulatedHour,
  simulatedMinute,
  forceUnlockAll,
  className
}: LuffySectionGuardianProps) {
  const [lockState, setLockState] = useState<SectionLockState>(() => 
    calculateSectionLockState(section, simulatedHour, simulatedMinute, forceUnlockAll)
  );

  // Manual click-to-open tracking
  const [isOpened, setIsOpened] = useState<boolean>(() => {
    return localStorage.getItem(`cinevault_opened_sec_${section.id}`) === 'true';
  });

  const [isAngry, setIsAngry] = useState(false);
  const [angryQuoteIndex, setAngryQuoteIndex] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const angryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for reset events from Time Machine
  useEffect(() => {
    const handleReset = () => {
      setIsOpened(false);
      localStorage.removeItem(`cinevault_opened_sec_${section.id}`);
    };
    window.addEventListener('cinevault-reset-opened', handleReset);
    return () => window.removeEventListener('cinevault-reset-opened', handleReset);
  }, [section.id]);

  // Live timer tick
  useEffect(() => {
    const updateLock = () => {
      const nextState = calculateSectionLockState(section, simulatedHour, simulatedMinute, forceUnlockAll);
      setLockState(nextState);
    };

    updateLock();
    const interval = setInterval(updateLock, 1000);
    return () => clearInterval(interval);
  }, [section, simulatedHour, simulatedMinute, forceUnlockAll]);

  // Determine effective visibility
  const isTimeReached = !lockState.isLocked;
  const isFullyRevealed = forceUnlockAll || (isTimeReached && isOpened);

  const handleOpenClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Case 1: Time has NOT reached -> Play angry sound, shake, and scold!
    if (!isTimeReached) {
      playLuffySound('angry');
      setIsAngry(true);
      setShakeKey(prev => prev + 1);
      setAngryQuoteIndex(prev => (prev + 1) % section.angryQuotes.length);

      if (angryTimerRef.current) {
        clearTimeout(angryTimerRef.current);
      }

      angryTimerRef.current = setTimeout(() => {
        setIsAngry(false);
      }, 4500);
      return;
    }

    // Case 2: Time HAS arrived -> Play joyful laugh and open the vault!
    playLuffySound('smile');
    setIsOpened(true);
    localStorage.setItem(`cinevault_opened_sec_${section.id}`, 'true');
  };

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div className={cn("relative w-full rounded-3xl transition-all duration-500", className)}>
      {/* 1. ACTUAL SECTION CONTENT (Blurred and non-interactive until manually opened) */}
      <div 
        className={cn(
          "transition-all duration-700 w-full",
          !isFullyRevealed 
            ? "filter blur-xl sm:blur-2xl opacity-20 pointer-events-none select-none overflow-hidden max-h-[680px]" 
            : "filter blur-0 opacity-100 pointer-events-auto"
        )}
        aria-hidden={!isFullyRevealed}
      >
        {children}
      </div>

      {/* 2. UNLOCKED CELEBRATION RIBBON (Rendered above content when revealed) */}
      {isFullyRevealed && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 rounded-2xl bg-brand/10 border border-brand/30 backdrop-blur-md text-foreground shadow-sm"
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
            <span className="text-base sm:text-lg">{section.icon}</span>
            <span className="text-brand font-display">{section.title}</span>
            <span className="hidden md:inline text-muted-foreground">• Unlocked at {section.timeLabel}</span>
          </div>
          <button
            onClick={() => playLuffySound('smile')}
            className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 px-3 py-1 rounded-full transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
            title="Click to hear Luffy's smile laugh!"
          >
            <PartyPopper className="w-3.5 h-3.5" />
            <span>Treasure Open 👒 (Hear Luffy)</span>
          </button>
        </motion.div>
      )}

      {/* 3. LUFFY GUARDIAN LOCKED OVERLAY (Remains active until user manually clicks to open) */}
      <AnimatePresence>
        {!isFullyRevealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 sm:p-8 bg-black/80 dark:bg-black/90 backdrop-blur-2xl rounded-3xl border border-brand/30 shadow-[0_20px_70px_rgba(0,0,0,0.85)] text-center overflow-hidden"
          >
            {/* Background Ambient Glow */}
            <div 
              className="absolute w-[450px] h-[450px] rounded-full blur-[130px] opacity-25 pointer-events-none -z-10 transition-all duration-700"
              style={{ 
                background: isAngry 
                  ? '#ef4444' 
                  : isTimeReached 
                  ? '#10b981' 
                  : (section.accentColor || 'var(--theme-accent, #e8852a)') 
              }}
            />

            {/* Top Vault Pill Badge */}
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 sm:px-5 py-1.5 rounded-full border text-xs sm:text-sm font-bold mb-4 backdrop-blur-md shadow-md transition-colors duration-300",
                isAngry 
                  ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse"
                  : isTimeReached
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 animate-bounce"
                  : "bg-brand/15 border-brand/35 text-brand"
              )}
            >
              {isAngry ? (
                <>
                  <Flame className="w-4 h-4 text-red-400 animate-bounce" />
                  <span>ANGER LEVEL: GEAR 5 • PIRATE LOCK ENGAGED!</span>
                </>
              ) : isTimeReached ? (
                <>
                  <Gift className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
                  <span>TIME ARRIVED! • CLICK TO OPEN TREASURE ✨</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-brand" />
                  <span>Straw Hat Vault Guard • {section.badge}</span>
                </>
              )}
            </motion.div>

            {/* Luffy Avatar Interactive Showcase */}
            <motion.div 
              key={shakeKey}
              animate={isAngry ? {
                x: [-12, 12, -10, 10, -6, 6, -2, 2, 0],
                rotate: [-4, 4, -3, 3, -1, 1, 0]
              } : {
                y: [0, -6, 0]
              }}
              transition={isAngry ? {
                duration: 0.5,
                ease: 'easeInOut'
              } : {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              onClick={handleOpenClick}
              className="relative group cursor-pointer my-2 select-none"
              title="Click to interact with Captain Luffy"
            >
              {/* Floating Anger Marks (💢) when Angry */}
              <AnimatePresence>
                {isAngry && (
                  <>
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 1.3, 1], opacity: 1, rotate: [-10, 15] }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-3 -right-2 text-2xl z-30 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] pointer-events-none"
                    >
                      💢
                    </motion.div>
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 1.2, 1], opacity: 1, rotate: [10, -15] }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ delay: 0.1 }}
                      className="absolute top-4 -left-3 text-xl z-30 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] pointer-events-none"
                    >
                      💢
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Luffy Character Image */}
              <div className={cn(
                "relative w-36 h-36 sm:w-44 sm:h-44 rounded-full p-2 flex items-center justify-center transition-all duration-300",
                isAngry 
                  ? "bg-gradient-to-tr from-red-600/30 to-orange-500/30 ring-4 ring-red-500/70 shadow-[0_0_40px_rgba(239,68,68,0.5)]" 
                  : isTimeReached
                  ? "bg-gradient-to-tr from-emerald-500/30 to-teal-500/30 ring-4 ring-emerald-400/80 shadow-[0_0_40px_rgba(16,185,129,0.45)] animate-pulse"
                  : "bg-gradient-to-tr from-brand/20 to-amber-500/20 ring-4 ring-brand/40 shadow-[0_0_35px_rgba(232,133,42,0.3)] hover:scale-105"
              )}>
                <img 
                  src={isAngry ? "/images/luffy-angry.png" : "/images/luffy-happy.png"}
                  alt={isAngry ? "Angry Pouting Luffy" : "Happy Cheerful Luffy"}
                  className="w-full h-full object-contain filter drop-shadow-lg transition-transform duration-300"
                />

                {/* Subtle Click Hint Badge on Image Hover */}
                {!isAngry && (
                  <div className={cn(
                    "absolute -bottom-2 border px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors flex items-center gap-1 shadow-md",
                    isTimeReached 
                      ? "bg-emerald-500 text-black border-emerald-300 font-extrabold animate-bounce" 
                      : "bg-black/90 text-gray-300 border-white/20 group-hover:text-brand group-hover:border-brand"
                  )}>
                    {isTimeReached ? '✨ CLICK TO OPEN! ✨' : 'Click Me! 👒'}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Section Title */}
            <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white mt-3 mb-1.5 drop-shadow-sm flex items-center justify-center gap-2">
              <span>{section.icon}</span>
              <span>{section.title}</span>
            </h3>
            
            <p className="text-xs sm:text-sm text-gray-300 max-w-lg mb-4 leading-relaxed font-medium">
              {section.subtitle}
            </p>

            {/* Live Real-time Countdown Box */}
            <div className="flex flex-col items-center gap-1.5 mb-5 w-full max-w-sm">
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-brand">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {isTimeReached ? `Ready to open (${section.timeLabel})` : `Unlocks at ${section.timeLabel} (${section.periodLabel})`}
                </span>
              </div>

              {/* Countdown Ticker Pills */}
              {!isTimeReached ? (
                <div className="flex items-center gap-1.5 sm:gap-2 font-mono font-black text-foreground text-sm sm:text-base">
                  {lockState.days > 0 && (
                    <>
                      <div className="flex flex-col items-center px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 shadow-inner min-w-[48px]">
                        <span className="text-brand text-base sm:text-lg">{lockState.days}</span>
                        <span className="text-[9px] text-gray-400 font-sans font-semibold uppercase">Days</span>
                      </div>
                      <span className="text-white/40 font-bold">:</span>
                    </>
                  )}
                  <div className="flex flex-col items-center px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 shadow-inner min-w-[48px]">
                    <span className="text-brand text-base sm:text-lg">{formatNumber(lockState.hours)}</span>
                    <span className="text-[9px] text-gray-400 font-sans font-semibold uppercase">Hours</span>
                  </div>
                  <span className="text-white/40 font-bold">:</span>
                  <div className="flex flex-col items-center px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 shadow-inner min-w-[48px]">
                    <span className="text-brand text-base sm:text-lg">{formatNumber(lockState.minutes)}</span>
                    <span className="text-[9px] text-gray-400 font-sans font-semibold uppercase">Mins</span>
                  </div>
                  <span className="text-white/40 font-bold">:</span>
                  <div className="flex flex-col items-center px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 shadow-inner min-w-[48px]">
                    <span className="text-brand text-base sm:text-lg">{formatNumber(lockState.seconds)}</span>
                    <span className="text-[9px] text-gray-400 font-sans font-semibold uppercase">Secs</span>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-sm animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Time Reached • Waiting for your click!</span>
                </div>
              )}
            </div>

            {/* Luffy's Authentic Speech Bubble (Dynamic switch on Angry/Happy/Ready) */}
            <motion.div 
              key={isAngry ? `angry-${angryQuoteIndex}` : isTimeReached ? 'ready' : 'happy'}
              initial={{ scale: 0.95, opacity: 0, y: 5 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "relative max-w-lg w-full p-3.5 sm:p-4 rounded-2xl border text-left mb-5 shadow-xl transition-all duration-300",
                isAngry 
                  ? "bg-red-950/60 border-red-500/50 text-red-100 shadow-[0_0_25px_rgba(239,68,68,0.25)]" 
                  : isTimeReached
                  ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.25)]"
                  : "bg-white/10 dark:bg-card/70 border-white/15 text-white"
              )}
            >
              {/* Speech bubble pointer triangle */}
              <div 
                className={cn(
                  "absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-t border-l transition-colors duration-300",
                  isAngry ? "bg-red-950/80 border-red-500/50" : isTimeReached ? "bg-emerald-950/80 border-emerald-500/50" : "bg-white/10 dark:bg-card border-white/15"
                )}
              />

              <div className="flex items-start gap-2.5">
                <div className="text-lg shrink-0 mt-0.5">
                  {isAngry ? '😡' : isTimeReached ? '🎉' : '🍖'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={cn(
                      "text-[11px] font-extrabold uppercase tracking-wider font-mono",
                      isAngry ? "text-red-400" : isTimeReached ? "text-emerald-400" : "text-brand"
                    )}>
                      {isAngry ? "Captain Luffy (Agitated) 💢:" : isTimeReached ? "Monkey D. Luffy (Excited) ✨:" : "Monkey D. Luffy says:"}
                    </span>
                    <span className="text-[10px] text-gray-400">Straw Hat Pirates</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                    "{isAngry ? section.angryQuotes[angryQuoteIndex] : isTimeReached ? section.unlockedQuote : section.happyQuote}"
                  </p>
                  {!isAngry && (
                    <p className="text-[11px] text-muted-foreground mt-1 italic">
                      {isTimeReached ? "Click the button below to break the seal!" : section.happySubQuote}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* "Open Vault" Interactive Action Button */}
            <div className="flex flex-col items-center gap-2 w-full max-w-xs">
              <button
                onClick={handleOpenClick}
                className={cn(
                  "w-full py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-95",
                  isAngry 
                    ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/30 scale-102"
                    : isTimeReached
                    ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 text-black shadow-emerald-500/40 hover:scale-105 animate-bounce ring-2 ring-emerald-300"
                    : "bg-brand hover:bg-brand/90 text-background shadow-brand/25 hover:scale-103"
                )}
              >
                {isAngry ? (
                  <>
                    <ShieldAlert className="w-4 h-4 animate-bounce" />
                    <span>LOCKED! Wait Until {section.timeLabel}!</span>
                  </>
                ) : isTimeReached ? (
                  <>
                    <Gift className="w-4 h-4 text-black animate-spin" style={{ animationDuration: '4s' }} />
                    <span>✨ OPEN TREASURE NOW! 🎁</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Try Opening Vault (Locked)</span>
                  </>
                )}
              </button>

              <span className="text-[10px] text-gray-400">
                {isTimeReached ? '🎁 Click the button to reveal this surprise!' : `🔒 Section ready to open at ${section.timeLabel} sharp!`}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
