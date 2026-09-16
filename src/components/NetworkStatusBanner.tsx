import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, X } from 'lucide-react';
import { triggerHaptic } from '../lib/mobile';

export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [showRestored, setShowRestored] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      setDismissed(false);
      triggerHaptic('success');
      const timer = setTimeout(() => setShowRestored(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
      setDismissed(false);
      triggerHaptic('medium');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showBanner = (!isOnline && !dismissed) || showRestored;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.aside
          role="status"
          aria-live="assertive"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.2 }}
          className="fixed top-2 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[110] max-w-sm safe-top pointer-events-auto"
        >
          <div
            className={`px-3.5 py-2 rounded-2xl backdrop-blur-xl border shadow-xl flex items-center gap-2.5 text-xs font-semibold ${
              !isOnline
                ? 'bg-amber-500/90 text-black border-amber-400/50'
                : 'bg-emerald-500/95 text-white border-emerald-400/50'
            }`}
          >
            {!isOnline ? (
              <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
            ) : (
              <Wifi className="w-4 h-4 shrink-0" />
            )}

            <span className="flex-1 line-clamp-1">
              {!isOnline
                ? "You're offline. Cached items remain available."
                : 'Connection restored.'}
            </span>

            {!isOnline && (
              <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="Dismiss offline alert"
                className="p-1 hover:bg-black/10 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
