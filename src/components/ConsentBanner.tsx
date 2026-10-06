import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import { useApp } from '../store';

/**
 * Telemetry consent notice.
 *
 * `lib/consent.ts` has gated remote writes since the services pass, but nothing
 * ever asked: guests were silently denied and signed-in accounts silently
 * allowed, and neither could change their mind without editing localStorage. The
 * store already exposes `telemetryConsent` / `setTelemetryConsent`; this is the
 * control surface for them.
 *
 * Deliberately not a blocking modal. Nothing has been sent at the point it
 * appears -- guests default to denied -- so it reports a default and offers to
 * change it, rather than holding the catalogue hostage behind a dialog. It is
 * also not shown over the player or the birthday route, where a bar across the
 * bottom of the screen would be in the way.
 */

const HIDDEN_ROUTES = ['watch/'];

interface ConsentBannerProps {
  /** Current route, so the bar can stay out of full-screen experiences. */
  route: string;
}

export function ConsentBanner({ route }: ConsentBannerProps) {
  const {
    telemetryConsent,
    setTelemetryConsent,
    authStatus,
    authModalOpen,
  } = useApp();

  // Sync only means something once there's an account to sync to, so this is
  // shown exclusively to signed-in users whose choice is still unset. Guests
  // are never nagged -- they stay local-only until they choose to sign in.
  const suppressed =
    HIDDEN_ROUTES.some((prefix) => route === prefix || route.startsWith(prefix)) ||
    authModalOpen;

  const open = authStatus === 'signed-in' && telemetryConsent === 'unset' && !suppressed;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25 }}
          role="region"
          aria-label="Data and privacy"
          className="fixed bottom-0 left-0 right-0 z-[300] px-3 pb-3 sm:px-6 sm:pb-6 pointer-events-none"
        >
          <div className="pointer-events-auto mx-auto max-w-3xl bg-[#121316] border border-white/10 rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <ShieldCheck className="w-5 h-5 shrink-0 text-[#f3f0ea]" aria-hidden="true" />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground font-display">
                Sync your watch history to your account?
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Your watchlist and progress are always saved in this browser. Allowing sync also
                stores them against your CineVault account so they follow you to other devices.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setTelemetryConsent('denied')}
                className="px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-foreground transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-white/30"
              >
                Keep local
              </button>
              <button
                type="button"
                onClick={() => setTelemetryConsent('granted')}
                className="px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider font-bold bg-[#f3f0ea] text-[#0b0b0d] hover:bg-white transition-all cursor-pointer shadow-md"
              >
                Allow sync
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
