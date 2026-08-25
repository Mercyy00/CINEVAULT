import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Flame, X } from 'lucide-react';

export function HangingLanterns() {
  const [showNote, setShowNote] = useState(false);
  const [clickIndex, setClickIndex] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const LANTERN_QUOTES = [
    "May your 21st year shine as bright and golden as these lanterns! 🪔✨",
    "You light up my whole universe, my dearest Goluuu & Besan Ka Ladduuu! 💛",
    "21 wishes sent to the stars tonight for my favorite girl in the world! 🌟",
    "Here's to the brightest smile and the warmest heart — Happy Birthday Divu! 💖",
    "Every golden light here burns for you, always and forever! 🔥✨"
  ];

  // Smooth scroll tracker: slide up smoothly with scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setScrollOffset(currentScroll);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-close on outside click or Escape key
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowNote(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNote(false);
      }
    };

    if (showNote) {
      window.addEventListener('click', handleGlobalClick);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNote]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNote(true);
    setClickIndex(prev => (prev + 1) % LANTERN_QUOTES.length);
  };

  // Calculate subtle extra upward parallax lift and gentle fade on scroll
  const extraY = Math.min(scrollOffset * 0.4, 250);
  const scrollOpacity = Math.max(1 - scrollOffset / 600, 0);

  return (
    <div 
      ref={containerRef}
      style={{
        transform: `translateY(-${extraY}px)`,
        opacity: scrollOpacity,
      }}
      className="absolute top-0 right-4 sm:right-8 md:right-12 lg:right-16 xl:right-20 z-40 pointer-events-auto select-none transition-opacity duration-150"
    >
      {/* Starting Slide-Down Entrance Animation */}
      <motion.div
        initial={{ y: -300, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: 'spring',
          stiffness: 90,
          damping: 14,
          mass: 1.1,
          delay: 0.1,
        }}
      >
        {/* Continuous Pendulum Swaying Wrapper */}
        <motion.div
          animate={{
            rotate: [-3, 3, -3],
            y: [0, 6, 0],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ originY: 0, originX: 0.7 }}
          onClick={handleClick}
          className="flex flex-col items-center cursor-pointer relative pt-0 group"
          title="Click to light a birthday wish! ✨"
        >
          {/* Ceiling Chain Extension / Connection Point */}
          <div className="w-[2px] h-6 sm:h-10 md:h-12 lg:h-14 bg-gradient-to-b from-amber-600/90 via-amber-400/90 to-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.7)]" />

          {/* Lanterns Container with Glowing Aura */}
          <div className="relative">
            {/* Ambient Golden Glow Behind Lanterns */}
            <motion.div
              animate={{
                opacity: [0.5, 0.9, 0.5],
                scale: [0.95, 1.1, 0.95],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 sm:w-48 md:w-56 h-48 sm:h-64 rounded-full blur-[45px] sm:blur-[60px] bg-gradient-to-b from-amber-400/60 via-orange-500/40 to-yellow-500/25 pointer-events-none -z-10"
            />

            {/* Lanterns Graphic */}
            <motion.img
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              src="/images/hanging-lanterns.png"
              alt="Hanging Birthday Lanterns"
              className="w-28 sm:w-36 md:w-44 lg:w-48 xl:w-52 h-auto object-contain drop-shadow-[0_15px_30px_rgba(245,158,11,0.45)] transition-transform duration-300"
            />

            {/* Sparkle Burst on Click */}
            <AnimatePresence>
              {showNote && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1.3 }}
                  exit={{ opacity: 0, scale: 0.4 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 text-amber-400 pointer-events-none"
                >
                  <Sparkles className="w-8 h-8 fill-amber-300 animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Interactive Birthday Lantern Wish Pop-Up Note */}
          <AnimatePresence>
            {showNote && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 10 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute top-[85%] right-0 sm:-right-6 mt-3 w-64 sm:w-72 glass bg-card/95 border border-amber-500/40 rounded-2xl p-4 shadow-[0_10px_35px_rgba(245,158,11,0.3)] z-50 text-left backdrop-blur-xl"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-amber-500/25 mb-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                    <span>Golden Wish for Divu</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNote(false);
                    }}
                    className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground text-xs"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs sm:text-sm font-serif italic text-foreground leading-relaxed">
                  "{LANTERN_QUOTES[clickIndex]}"
                </p>

                <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-3 pt-2 border-t border-border/30 font-mono">
                  <span className="flex items-center gap-1 text-amber-300/80">
                    <Heart className="w-2.5 h-2.5 fill-current text-pink-500" /> Tap for next wish
                  </span>
                  <span>{clickIndex + 1} / {LANTERN_QUOTES.length}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </motion.div>
    </div>
  );
}
