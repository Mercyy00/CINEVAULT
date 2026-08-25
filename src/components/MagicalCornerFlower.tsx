import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Sun, X } from 'lucide-react';
import { cn } from '../lib/utils';

export function MagicalCornerFlower() {
  const [showWish, setShowWish] = useState(false);
  const [wishIndex, setWishIndex] = useState(0);
  const [isBlooming, setIsBlooming] = useState(false);

  const FLOWER_QUOTES = [
    "Flower gleam and glow, let your power shine... Happy 21st Birthday, my Rapunzel! 🌼✨",
    "Just like this golden sundrop flower, your warmth heals and brightens my world every single day. 💛",
    "To the girl whose heart is as pure and radiant as a blooming sunflower. 🌻💖",
    "May your 21st year bloom with endless happiness, success, and love! 🌟🌸",
    "Forever my golden flower, my Besan Ka Ladduuu & Goluuu! 👑✨"
  ];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBlooming(true);
    setTimeout(() => setIsBlooming(false), 900);
    setShowWish(true);
    setWishIndex(prev => (prev + 1) % FLOWER_QUOTES.length);
  };

  return (
    <div className="fixed -bottom-24 -right-24 sm:-bottom-32 sm:-right-32 md:-bottom-36 md:-right-36 z-40 pointer-events-auto select-none group">
      
      {/* Outer Ambient Reactive Golden Glow */}
      <div 
        className={cn(
          "absolute inset-0 rounded-full blur-3xl transition-all duration-700 pointer-events-none -z-10",
          isBlooming ? "opacity-90 scale-140 bg-amber-400/60" : "opacity-35 scale-100 bg-gradient-to-tl from-amber-500/50 via-yellow-400/30 to-transparent"
        )}
      />

      {/* Floating Magic Pollen Particles Emitter */}
      <motion.div
        animate={{
          opacity: [0.2, 0.8, 0.2],
          y: [-10, -40, -10],
          x: [-15, -35, -15],
          scale: [0.8, 1.2, 0.8]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-12 left-16 text-amber-300 pointer-events-none z-50"
      >
        <Sparkles className="w-5 h-5 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
      </motion.div>

      <motion.div
        animate={{
          opacity: [0.3, 0.9, 0.3],
          y: [-20, -60, -20],
          x: [-30, -60, -30],
          scale: [0.6, 1.1, 0.6]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute top-16 left-20 text-yellow-400 pointer-events-none z-50"
      >
        <Sun className="w-4 h-4 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-spin" />
      </motion.div>

      {/* Interactive Tooltip Callout on Hover */}
      <div className="absolute top-10 right-36 sm:right-48 md:right-56 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform -translate-y-2 group-hover:translate-y-0 z-50 whitespace-nowrap">
        <div className="glass px-3.5 py-1.5 rounded-full border border-amber-500/30 shadow-2xl backdrop-blur-xl text-xs font-semibold flex items-center gap-2 text-foreground">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Divu's <strong>Sundrop Flower</strong> 🌼✨</span>
          <span className="text-[10px] text-amber-400/90 font-mono">(Click to bloom)</span>
        </div>
      </div>

      {/* Main Magical Flower Container */}
      <motion.div
        onClick={handleClick}
        whileHover={{ scale: 1.06, rotate: 6 }}
        whileTap={{ scale: 0.94 }}
        animate={{
          rotate: [-4, 4, -4],
          y: [0, -6, 0]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full cursor-pointer flex items-center justify-center filter drop-shadow-[0_20px_45px_rgba(245,158,11,0.45)] transition-transform duration-300"
        title="Click to bloom Divu's magical flower! ✨🌼"
      >
        <img
          src="/images/magical-flower.png"
          alt="Magical Golden Flower"
          className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(251,191,36,0.5)] group-hover:brightness-110 transition-all"
        />

        {/* Click Bloom Radiant Pulse */}
        <AnimatePresence>
          {isBlooming && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1.35 }}
              exit={{ opacity: 0, scale: 1.6 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 rounded-full border-4 border-amber-300/60 bg-amber-400/20 pointer-events-none blur-sm"
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Flower Wish Modal / Pop-Up */}
      <AnimatePresence>
        {showWish && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-28 right-6 sm:right-10 md:right-16 max-w-sm w-[90vw] glass bg-card/95 border border-amber-500/40 rounded-3xl p-4 sm:p-5 shadow-[0_15px_50px_rgba(245,158,11,0.35)] z-[250] text-left backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-1.5 pb-2.5 border-b border-amber-500/25 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Sun className="w-4 h-4 animate-spin" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Golden Sundrop Wish</h4>
                  <p className="text-[10px] text-muted-foreground">For My Princess Divu 🌼</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowWish(false);
                }}
                className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground text-xs"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm font-serif italic text-foreground leading-relaxed">
              "{FLOWER_QUOTES[wishIndex]}"
            </p>

            <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-3 pt-2.5 border-t border-border/30 font-mono">
              <span className="flex items-center gap-1 text-amber-300">
                <Heart className="w-3 h-3 fill-current text-pink-500" /> Click flower for next wish
              </span>
              <span>{wishIndex + 1} / {FLOWER_QUOTES.length}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
