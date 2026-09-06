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

const HIDDEN_ROUTES = ['watch/', 'birthday'];

interface ConsentBannerProps {
  /** Current route, so the bar can stay out of full-screen experiences. */
  route: string;
}

export function ConsentBanner({ route }: ConsentBannerProps) {
  const { telemetryConsent, setTelemetryConsent, authStatus } = useApp();

  const suppressed =
    HIDDEN_ROUTES.some((prefix) => route === prefix || route.startsWith(prefix)) ||
    authStatus === 'loading';

  const open = telemetryConsent === 'unset' && !suppressed;

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
          <div className="pointer-events-auto mx-auto max-w-3xl glass border border-white/12 rounded-2xl shadow-card backdrop-blur-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <ShieldCheck className="w-6 h-6 shrink-0 text-brand" aria-hidden="true" />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Sync your watch history to your account?
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Your watchlist and progress are always saved in this browser. Allowing sync also
                stores them against your CineVault account so they follow you to other devices.
                {authStatus === 'signed-out' && ' Guests stay local-only until you allow it.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setTelemetryConsent('denied')}
                className="px-4 py-2 rounded-full text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-foreground transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                Keep local
              </button>
              <button
                type="button"
                onClick={() => setTelemetryConsent('granted')}
                className="px-4 py-2 rounded-full text-xs font-bold bg-brand text-background hover:brightness-110 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white"
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
