import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, X } from 'lucide-react';

export function HangingSpiderman() {
  const [showSpeech, setShowSpeech] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const SPIDER_QUOTES = [
    "Psst... Happy 21st Birthday Princess Divu! 🕷️🕸️",
    "Your friendly neighborhood boyfriend Jay loves you crororororoor times! 💖",
    "No spider-sense needed to know you're the most gorgeous girl in the universe! ✨",
    "With great beauty comes great responsibility... to smile always! ✌️",
    "Just dropping by to say: You are my Mary Jane & Gwen Stacy all in one! 💘"
  ];

  // Auto-close on outside click or Escape key
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSpeech(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSpeech(false);
      }
    };

    if (showSpeech) {
      window.addEventListener('click', handleGlobalClick);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSpeech]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSpeech(true);
    setClickCount(prev => (prev + 1) % SPIDER_QUOTES.length);
  };

  return (
    <div 
      ref={containerRef}
      className="fixed top-0 left-4 sm:left-8 md:left-12 lg:left-14 z-40 pointer-events-auto select-none"
    >
      {/* Pendulum Swinging Wrapper */}
      <motion.div
        animate={{
          rotate: [-3.5, 3.5, -3.5],
          y: [0, 6, 0],
        }}
        transition={{
          duration: 3.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ originY: 0, originX: 0.5 }}
        onClick={handleClick}
        className="flex flex-col items-center cursor-pointer relative pt-0"
      >
        {/* Glowing Spider Web String from Ceiling */}
        <div className="w-[1.5px] h-10 sm:h-14 md:h-16 lg:h-20 bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.9)]" />

        {/* Spider-Man Hanging Upside Down */}
        <div className="relative group">
          <motion.img
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            src="/images/spiderman-hanging.png"
            alt="Spider-Man Hanging"
            className="w-28 sm:w-36 md:w-44 lg:w-48 xl:w-52 h-auto object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.5)] transition-transform duration-200"
          />

          {/* Interactive Click Heart Sparkle Burst */}
          <AnimatePresence>
            {showSpeech && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1.2 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute -bottom-2 right-2 text-pink-500 pointer-events-none"
              >
                <Heart className="w-5 h-5 fill-current animate-ping" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Interactive Speech Bubble Pop-Up */}
        <AnimatePresence>
          {showSpeech && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 8 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full left-0 mt-2 w-60 sm:w-68 glass bg-card/95 border border-brand/40 rounded-2xl p-3.5 shadow-2xl z-50 text-left backdrop-blur-xl"
            >
              {/* Header with Close X */}
              <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-border/50 mb-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-pink-500" />
                  <span>Spidey Note from Jay</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSpeech(false);
                  }}
                  className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <p className="text-xs font-serif italic text-foreground leading-snug">
                "{SPIDER_QUOTES[clickCount]}"
              </p>
              
              <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-2 pt-1.5 border-t border-border/30 font-mono">
                <span>Click Spidey for more 🕸️</span>
                <span>{clickCount + 1} / {SPIDER_QUOTES.length}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}
