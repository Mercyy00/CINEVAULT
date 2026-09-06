/**
 * Telemetry consent.
 *
 * Every visitor -- including guests who never signed up -- previously had a
 * document written to Firestore `users/{uid}` on first paint, with no notice and
 * no way to decline. Remote telemetry is now gated:
 *
 * - explicit `granted`  -> remote writes allowed
 * - explicit `denied`   -> local only, nothing leaves the device
 * - unanswered          -> allowed for signed-in accounts (a directory entry is
 *                          part of having an account), denied for guests
 *
 * Local persistence -- watchlist, continue-watching, playback position -- is
 * unaffected. It never leaves the browser and needs no consent.
 */

import { StorageKeys, readString, writeString } from './storage';

export type ConsentState = 'granted' | 'denied' | 'unset';

type Listener = (state: ConsentState) => void;
const listeners = new Set<Listener>();

export function getTelemetryConsent(): ConsentState {
  const stored = readString(StorageKeys.telemetryConsent, '');
  return stored === 'granted' || stored === 'denied' ? stored : 'unset';
}

export function setTelemetryConsent(state: Exclude<ConsentState, 'unset'>): void {
  writeString(StorageKeys.telemetryConsent, state);
  listeners.forEach((listener) => listener(state));
}

/**
 * Whether remote telemetry may be written right now.
 *
 * @param isSignedIn a real (non-anonymous) account is the implied-consent case.
 */
export function hasTelemetryConsent(isSignedIn: boolean): boolean {
  const state = getTelemetryConsent();
  if (state === 'granted') return true;
  if (state === 'denied') return false;
  return isSignedIn;
}

/** Subscribe to consent changes. Returns an unsubscribe function. */
export function onTelemetryConsentChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* --------------------------------------------------------------------------
 * Ambient signal, read by the service layer.
 *
 * `watchTracking.ts` has no access to React state, so the store publishes the
 * current session's signed-in flag here rather than every call site having to
 * thread it through.
 * -------------------------------------------------------------------------- */

let signedInHint = false;

/** Called by the store whenever auth state resolves. */
export function setSignedInHint(value: boolean): void {
  signedInHint = value;
}

/** Consent check for modules that cannot see React state. */
export function remoteTelemetryAllowed(): boolean {
  return hasTelemetryConsent(signedInHint);
}
