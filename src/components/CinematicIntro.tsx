import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store';

export function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const [showSkip, setShowSkip] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { userProfile } = useApp();

  useEffect(() => {
    // Attempt to play audio
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        // Autoplay blocked, expected
      });
    }

    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0f] flex items-center justify-center overflow-hidden intro-overlay">
      <audio ref={audioRef} id="intro-sound" src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
      
      {/* Particle glow center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[300px] h-[300px] bg-cv-gold rounded-full opacity-0 blur-[100px] animate-intro-glow" />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <h1 className="text-6xl md:text-8xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#d4a853] to-[#f0e6d3] opacity-0 animate-intro-logo drop-shadow-[0_0_20px_rgba(212,168,83,0.5)]">
          CineVault
        </h1>
        {/* Streak */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] -translate-y-1/2 bg-cv-gold blur-[4px] opacity-0 animate-intro-streak pointer-events-none" />
      </div>

      <AnimatePresence>
        {showSkip && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onComplete}
            className="absolute bottom-8 right-8 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/80 hover:text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(212,168,83,0.3)] focus:outline-none focus:ring-2 focus:ring-cv-gold z-20 cursor-pointer"
          >
            Skip Intro
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
