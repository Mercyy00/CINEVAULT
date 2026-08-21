import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Gift, PartyPopper } from 'lucide-react';
import { cn } from '../lib/utils';

// Target Birthday: 2nd September 2026 00:00:00 Local Time
const TARGET_BIRTHDAY = new Date(2026, 8, 2, 0, 0, 0); // Month is 0-indexed (8 = September)

interface TimeRemaining {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isBirthday: boolean;
}

function calculateTimeRemaining(): TimeRemaining {
  const now = new Date();
  const diff = TARGET_BIRTHDAY.getTime() - now.getTime();

  // If it's the exact birthday day (Sept 2)
  const isSameDay = now.getFullYear() === 2026 && now.getMonth() === 8 && now.getDate() === 2;

  if (diff <= 0 || isSameDay) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isBirthday: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { total: diff, days, hours, minutes, seconds, isBirthday: false };
}

interface Particle {
  id: number;
  x: number;
  y: number;
  type: 'heart' | 'sparkle' | 'star';
  size: number;
  color: string;
}

export function BirthdayCountdown() {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(calculateTimeRemaining);
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Spawn sparkles on hover or click
  const triggerSparkles = (count = 6) => {
    const types: ('heart' | 'sparkle' | 'star')[] = ['heart', 'sparkle', 'star'];
    const colors = ['#ff4d6d', '#ff758f', '#ffb703', '#ffd166', '#a0c4ff', '#c77dff'];
    
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + Math.random(),
        x: (Math.random() - 0.5) * 80,
        y: -15 - Math.random() * 35,
        type: types[Math.floor(Math.random() * types.length)],
        size: 12 + Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    setParticles(prev => [...prev.slice(-15), ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 1200);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    triggerSparkles(8);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerSparkles(14);
    setShowCelebrationModal(true);
  };

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <>
      <div 
        ref={containerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="pointer-events-auto relative group cursor-pointer select-none"
      >
        {/* Floating Sparkle Particles Container */}
        <div className="absolute inset-0 pointer-events-none overflow-visible flex items-center justify-center">
          <AnimatePresence>
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 1, scale: 0.4, x: p.x * 0.3, y: 0 }}
                animate={{ 
                  opacity: 0, 
                  scale: 1.2, 
                  x: p.x, 
                  y: p.y - 30,
                  rotate: (Math.random() - 0.5) * 60 
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="absolute z-[120]"
                style={{ color: p.color }}
              >
                {p.type === 'heart' && <Heart className="fill-current drop-shadow-sm" style={{ width: p.size, height: p.size }} />}
                {p.type === 'sparkle' && <Sparkles className="fill-current drop-shadow-sm" style={{ width: p.size, height: p.size }} />}
                {p.type === 'star' && <span style={{ fontSize: `${p.size}px` }}>✨</span>}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {/* The Main Countdown Pill */}
        <motion.div 
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.97 }}
          className={cn(
            "rounded-full px-2 sm:px-4 py-1 sm:py-2 flex items-center gap-1.5 sm:gap-2.5 max-w-full",
            "backdrop-blur-2xl bg-white/85 dark:bg-black/65 border border-black/10 dark:border-white/15",
            "shadow-[0_4px_20px_-4px_var(--theme-accent-glow,rgba(232,133,42,0.25))]",
            "hover:shadow-[0_8px_25px_var(--theme-accent-glow,rgba(232,133,42,0.4))]",
            "ring-1 ring-brand/25 transition-all duration-300 text-foreground"
          )}
        >
          {/* Animated SVG Birthday Cake Icon */}
          <div className="relative w-5 h-5 sm:w-7 sm:h-7 shrink-0 flex items-center justify-center">
            <svg 
              viewBox="0 0 36 36" 
              className="w-full h-full drop-shadow-sm"
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Candle */}
              <rect x="17" y="5" width="2" height="7" rx="1" fill="var(--theme-fg)" opacity="0.8" />
              
              {/* Candle Flame with animation */}
              <motion.path
                animate={{
                  scale: [1, 1.25, 0.9, 1.15, 1],
                  y: [0, -0.8, 0.4, -0.4, 0],
                  filter: [
                    'drop-shadow(0 0 3px #ffb703)',
                    'drop-shadow(0 0 7px #ff0054)',
                    'drop-shadow(0 0 4px #ffb703)'
                  ]
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                d="M18 1.5C18 1.5 16 3.2 16 4.8C16 5.9 16.9 6.8 18 6.8C19.1 6.8 20 5.9 20 4.8C20 3.2 18 1.5 18 1.5Z"
                fill="#ffb703"
              />

              {/* Cake Top Tier */}
              <rect x="9" y="12" width="18" height="8" rx="3" fill="var(--theme-accent)" />
              {/* Icing Frosting drips */}
              <path 
                d="M9 14C10 16 11 16 12 14C13 16 14 16 15 14C16 16 17 16 18 14C19 16 20 16 21 14C22 16 23 16 24 14C25 16 26 16 27 14V13C27 12.4477 26.5523 12 26 12H10C9.44772 12 9 12.4477 9 13V14Z" 
                fill="var(--theme-accent-fg)" 
                opacity="0.85" 
              />

              {/* Cake Bottom Tier */}
              <rect x="5" y="20" width="26" height="11" rx="4" fill="var(--theme-accent)" opacity="0.9" />
              {/* Bottom Icing Frosting Wave */}
              <path 
                d="M5 23C7 25 8 25 10 23C12 25 13 25 15 23C17 25 18 25 20 23C22 25 23 25 25 23C27 25 28 25 31 23V22C31 20.8954 30.1046 20 29 20H7C5.89543 20 5 20.8954 5 22V23Z" 
                fill="var(--theme-accent-fg)" 
                opacity="0.85" 
              />
              
              {/* Cake Plate / Stand */}
              <path d="M3 31.5H33C33.5523 31.5 34 31.9477 34 32.5C34 33.0523 33.5523 33.5 33 33.5H3C2.44772 33.5 2 33.0523 2 32.5C2 31.9477 2.44772 31.5 3 31.5Z" fill="var(--theme-fg)" opacity="0.4" />
            </svg>
          </div>

          {/* Countdown Display Content */}
          <div className="flex items-center gap-1 sm:gap-2">
            {timeLeft.isBirthday ? (
              <div className="flex items-center gap-1 text-brand font-display font-extrabold text-[11px] sm:text-sm animate-pulse">
                <PartyPopper className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-500" />
                <span>Happy Birthday! 💖</span>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 sm:gap-1.5 font-mono text-[11px] sm:text-[13px] font-bold text-foreground">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-brand text-[11px] sm:text-sm">{timeLeft.days}</span>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground font-sans font-semibold">d</span>
                </div>
                <span className="text-muted-foreground/40">:</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-brand text-[11px] sm:text-sm">{formatNumber(timeLeft.hours)}</span>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground font-sans font-semibold">h</span>
                </div>
                <span className="text-muted-foreground/40">:</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-brand text-[11px] sm:text-sm">{formatNumber(timeLeft.minutes)}</span>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground font-sans font-semibold">m</span>
                </div>
                <span className="hidden sm:inline text-muted-foreground/40">:</span>
                <div className="hidden sm:flex items-baseline gap-0.5">
                  <span className="text-brand text-[11px] sm:text-sm">{formatNumber(timeLeft.seconds)}</span>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground font-sans font-semibold">s</span>
                </div>
              </div>
            )}

            {/* Cute Gift Icon with pulse */}
            <div className="hidden xs:flex w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-pink-500/15 border border-pink-500/30 items-center justify-center text-pink-500 shrink-0">
              <Gift className="w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover:scale-125 transition-transform" />
            </div>
          </div>
        </motion.div>

        {/* Hover Tooltip Card */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.94 }}
              transition={{ duration: 0.18 }}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 sm:w-64 p-3 sm:p-3.5 rounded-2xl bg-card border border-border shadow-2xl z-[150] text-center pointer-events-none"
            >
              <div className="flex items-center justify-center gap-1 text-pink-500 mb-1">
                <Heart className="w-3.5 h-3.5 fill-pink-500 animate-bounce" />
                <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase">Birthday Countdown</span>
                <Heart className="w-3.5 h-3.5 fill-pink-500 animate-bounce" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                2nd September 2026 🎂✨
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 leading-snug">
                Counting down every magical second until your special day! Click for a birthday surprise 💖
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebrationModal && (
          <div 
            onClick={() => setShowCelebrationModal(false)}
            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[85vh] overflow-y-auto custom-scrollbar bg-card border border-border rounded-3xl p-5 sm:p-8 shadow-2xl relative text-center"
            >
              {/* Top ambient glow */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-pink-500/15 border border-pink-500/30 text-pink-500 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Gift className="w-7 h-7 sm:w-8 sm:h-8 animate-bounce" />
              </div>

              <h3 className="text-xl sm:text-3xl font-display font-black text-foreground mb-2">
                2nd September 2026 💖
              </h3>
              
              <div className="inline-flex flex-wrap justify-center items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/25 text-brand text-[11px] sm:text-xs font-bold font-mono mb-4">
                <span>⏳ {timeLeft.days} Days • {timeLeft.hours} Hours • {timeLeft.minutes} Mins • {timeLeft.seconds} Secs</span>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                Every single day leads up to the most special celebration of the year! Here's to love, infinite happiness, and unforgettable movie nights together on CineVault! 🎬✨🎂
              </p>

              <button
                onClick={() => {
                  triggerSparkles(20);
                  setShowCelebrationModal(false);
                }}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl text-xs sm:text-sm hover:opacity-95 active:scale-98 transition-all shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-white" /> Happy Birthday in Advance! 💖
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
