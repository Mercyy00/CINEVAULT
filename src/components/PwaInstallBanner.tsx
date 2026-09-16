import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X, Smartphone } from 'lucide-react';
import { useApp } from '../store';
import { triggerHaptic } from '../lib/mobile';

const DISMISS_KEY = 'cv:pwa_banner_dismissed';
const SNOOZE_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function PwaInstallBanner() {
  const { deferredInstallPrompt, isMobileView, showToast } = useApp();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!deferredInstallPrompt || !isMobileView) {
      setIsVisible(false);
      return;
    }

    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const timeSince = Date.now() - Number(dismissedAt);
        if (timeSince < SNOOZE_DAYS_MS) {
          setIsVisible(false);
          return;
        }
      }
      // Small delay after mount so it doesn't abruptly flash immediately
      const timer = setTimeout(() => setIsVisible(true), 2500);
      return () => clearTimeout(timer);
    } catch {
      setIsVisible(true);
    }
  }, [deferredInstallPrompt, isMobileView]);

  const handleDismiss = () => {
    setIsVisible(false);
    triggerHaptic('light');
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  };

  const handleInstall = async () => {
    if (!deferredInstallPrompt) return;
    triggerHaptic('selection');
    try {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        triggerHaptic('success');
        showToast('Installing CineVault...');
        setIsVisible(false);
      } else {
        handleDismiss();
      }
    } catch (err) {
      console.error('Install prompt error:', err);
      handleDismiss();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-20 inset-x-3 sm:hidden z-[85] max-w-md mx-auto"
        >
          <div className="bg-[#101118]/95 backdrop-blur-2xl border border-brand/35 rounded-2xl p-3.5 shadow-2xl safe-bottom flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand/15 border border-brand/30 flex items-center justify-center shrink-0 text-brand">
              <Smartphone className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-xs text-foreground font-display">Install CineVault App</h4>
                <span className="text-[9px] font-black uppercase tracking-wider text-brand bg-brand/15 px-1.5 py-0.2 rounded">Fast</span>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                Full-screen streaming & instant access
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleInstall}
                className="px-3 py-1.5 bg-brand text-background rounded-xl font-bold text-xs hover:bg-brand/90 transition-transform active:scale-95 flex items-center gap-1 cursor-pointer shadow-md shadow-brand/20 min-h-[36px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss app install banner"
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
