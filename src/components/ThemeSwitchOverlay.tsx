import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Film, Sparkles, Layout } from 'lucide-react';
import type { UIMode } from '../store';

interface ThemeSwitchOverlayProps {
  isSwitching: boolean;
  targetMode: UIMode | null;
}

export function ThemeSwitchOverlay({ isSwitching, targetMode }: ThemeSwitchOverlayProps) {
  const [progress, setProgress] = useState(10);
  const [statusText, setStatusText] = useState('Saving preferences...');

  useEffect(() => {
    if (!isSwitching || !targetMode) {
      setProgress(10);
      return;
    }

    const t1 = setTimeout(() => {
      setProgress(45);
      setStatusText(
        targetMode === 'classic'
          ? 'Switching to Classic CineVault experience...'
          : 'Switching to Modern 7Movies experience...'
      );
    }, 250);

    const t2 = setTimeout(() => {
      setProgress(85);
      setStatusText(
        targetMode === 'classic'
          ? 'Configuring classic bottom dock & original cards...'
          : 'Configuring floating pill navbar & editorial canvas...'
      );
    }, 550);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Reloading CineVault...');
    }, 850);

    const t4 = setTimeout(() => {
      // Direct hard reload
      window.location.reload();
    }, 1050);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isSwitching, targetMode]);

  return (
    <AnimatePresence>
      {isSwitching && targetMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[999999] bg-[#0b0b0d]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none text-[#f3f0ea]"
          role="status"
          aria-live="polite"
        >
          {/* Ambient decorative glow */}
          <div className="absolute w-96 h-96 rounded-full bg-brand/15 blur-[120px] pointer-events-none" />

          {/* Center Card */}
          <motion.div
            initial={{ scale: 0.9, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 flex flex-col items-center max-w-sm w-full"
          >
            {/* Animated Icon Avatar */}
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-tr from-brand/20 via-transparent to-white/10 opacity-60"
                />
                {targetMode === 'classic' ? (
                  <Layout className="w-9 h-9 text-brand relative z-10" />
                ) : (
                  <Sparkles className="w-9 h-9 text-[#f3f0ea] relative z-10" />
                )}
              </div>
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -inset-1 rounded-2xl bg-brand/25 blur-md -z-10"
              />
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight text-[#f3f0ea]">
              {targetMode === 'classic'
                ? 'Switching to Classic Theme'
                : 'Switching to Modern Theme'}
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-[#beb9bc] font-body mt-2 leading-relaxed">
              {targetMode === 'classic'
                ? 'Restoring the signature floating dock, classic poster cards, and original navigation.'
                : 'Applying the 7movies floating pill navbar, obsidian canvas, and editorial style.'}
            </p>

            {/* Progress Bar Container */}
            <div className="w-full bg-white/[0.06] rounded-full h-2 mt-6 overflow-hidden border border-white/10 shadow-inner relative">
              <motion.div
                className="h-full bg-gradient-to-r from-brand/80 via-[#f3f0ea] to-brand rounded-full"
                initial={{ width: '10%' }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeInOut', duration: 0.35 }}
              />
            </div>

            {/* Micro Status Label */}
            <div className="flex items-center gap-2 mt-3 text-[11px] font-mono text-[#929093]">
              <Film className="w-3 h-3 text-brand animate-pulse" />
              <span>{statusText}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
