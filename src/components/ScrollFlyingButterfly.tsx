import React, { useState } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'motion/react';
import { Sparkles, Heart } from 'lucide-react';

export function ScrollFlyingButterfly() {
  const [isSparkling, setIsSparkling] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const BUTTERFLY_MESSAGES = [
    "Fluttering with all my love for you, Divu! 🦋💛",
    "Guiding you through your special 21st universe ✨",
    "Every beat of these golden wings carries a birthday wish! 💖",
    "You make my heart flutter just like this! 🌟"
  ];

  // Track global scroll progress (0 at top of page, 1 at bottom)
  const { scrollYProgress } = useScroll();

  // Smooth out scroll progression with spring physics for natural flight momentum
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 20,
    restDelta: 0.001
  });

  // Flight Path Waypoints (carefully planned along margins so it never blocks any interactive content):
  // 0.00 (Hero Right) -> 0.22 (Love Tree Left Margin) -> 0.45 (Polaroids Right Margin) -> 
  // 0.65 (Voice Note Left Margin) -> 0.82 (Multiverse Right Margin) -> 1.00 (Arcade Top-Right)
  
  // Horizontal Position (% from left of screen)
  const xPos = useTransform(
    smoothProgress,
    [0, 0.20, 0.42, 0.62, 0.82, 1.0],
    ['85vw', '6vw', '90vw', '5vw', '88vw', '82vw']
  );

  // Vertical Position (% of viewport height)
  const yPos = useTransform(
    smoothProgress,
    [0, 0.20, 0.42, 0.62, 0.82, 1.0],
    ['48vh', '36vh', '52vh', '42vh', '50vh', '38vh']
  );

  // Dynamic Flight Angle (tilts naturally toward flight direction)
  const flightRotation = useTransform(
    smoothProgress,
    [0, 0.10, 0.20, 0.30, 0.42, 0.52, 0.62, 0.72, 0.82, 0.92, 1.0],
    [0, -22, -10, 18, 5, -20, -8, 16, 6, -12, 0]
  );

  // Dynamic Scale & Glow intensity
  const flightScale = useTransform(
    smoothProgress,
    [0, 0.20, 0.50, 0.80, 1.0],
    [1.0, 0.92, 1.05, 0.95, 1.0]
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSparkling(true);
    setTimeout(() => setIsSparkling(false), 1200);
    setClickCount(prev => (prev + 1) % BUTTERFLY_MESSAGES.length);
  };

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        x: xPos,
        y: yPos,
        scale: flightScale,
        rotate: flightRotation,
        zIndex: 45,
      }}
      className="pointer-events-none select-none -translate-x-1/2 -translate-y-1/2"
    >
      {/* Floating Sparkle Trail Behind Butterfly */}
      <motion.div
        animate={{
          opacity: [0.3, 0.85, 0.3],
          scale: [0.8, 1.25, 0.8],
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-3 -left-3 w-20 h-20 rounded-full blur-[24px] bg-gradient-to-r from-amber-400/50 via-yellow-300/40 to-pink-500/30 -z-10"
      />

      {/* Sparkle Emitter Trail Particles */}
      <motion.div
        animate={{
          y: [0, 15, 30],
          x: [0, -10, -20],
          opacity: [0.9, 0.5, 0],
          scale: [0.7, 1.1, 0.4],
        }}
        transition={{
          duration: 1.6,
          repeat: Infinity,
          ease: "easeOut"
        }}
        className="absolute -bottom-2 -left-2 text-amber-300 pointer-events-none"
      >
        <Sparkles className="w-3.5 h-3.5 drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]" />
      </motion.div>

      {/* Interactive Butterfly Element */}
      <div 
        onClick={handleClick}
        className="pointer-events-auto cursor-pointer relative group"
        title="Divu's Golden Companion 🦋✨"
      >
        {/* Flapping Wing Animation Container */}
        <motion.div
          animate={{
            scaleX: [1, 0.45, 1],
            y: [0, -6, 0],
          }}
          transition={{
            duration: 0.55,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative origin-center"
        >
          <img
            src="/images/golden-butterfly.png"
            alt="Golden Flying Butterfly"
            className="w-16 sm:w-20 md:w-24 lg:w-28 h-auto object-contain filter drop-shadow-[0_8px_20px_rgba(245,158,11,0.6)] group-hover:scale-115 transition-transform duration-200"
          />
        </motion.div>

        {/* Click Sparkle Pop Burst */}
        <AnimatePresence>
          {isSparkling && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={{ opacity: 1, scale: 1.3, y: -20 }}
              exit={{ opacity: 0, scale: 0.6, y: -35 }}
              className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap glass px-3 py-1 rounded-full border border-amber-400/50 bg-card/95 text-[11px] font-bold text-amber-300 shadow-xl backdrop-blur-md flex items-center gap-1.5"
            >
              <Heart className="w-3 h-3 fill-current text-pink-500 animate-ping" />
              <span>{BUTTERFLY_MESSAGES[clickCount]}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </motion.div>
  );
}
