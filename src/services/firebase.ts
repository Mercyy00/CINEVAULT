import { initializeApp, getApp, getApps, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Firebase bootstrap.
 *
 * Two things were wrong here before:
 *
 * 1. Config fell back to `localStorage.getItem('cv_firebase_api_key')` and
 *    friends. Any script that could write localStorage -- an XSS, or a user
 *    talked into pasting a line into devtools -- could repoint the whole app
 *    at an attacker-controlled Firebase project and harvest credentials on
 *    this origin. Config now comes only from build-time env vars, with no
 *    hardcoded fallbacks.
 *
 * 2. `export const firebase = initFirebase()` ran network/SDK setup at module
 *    import time, so merely importing this file initialised Firebase. Init is
 *    now lazy and memoised behind `getFirebase()`.
 */

export interface FirebaseServices {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  googleProvider: GoogleAuthProvider | null;
}

const EMPTY_SERVICES: FirebaseServices = {
  app: null,
  auth: null,
  db: null,
  googleProvider: null,
};

/**
 * Config comes only from build-time env vars. There are deliberately no
 * hardcoded fallbacks: with them, `isFirebaseConfigured()` could never return
 * false, so the local-only guest path below was unreachable dead code and a
 * misconfigured deploy silently pointed at someone else's project.
 */
function readConfig(): FirebaseOptions {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

export function isFirebaseConfigured(): boolean {
  const config = readConfig();
  return Boolean(config.apiKey && config.projectId && config.appId);
}

let services: FirebaseServices | null = null;

/**
 * Returns the initialised Firebase services, or an all-null object when
 * Firebase is not configured. Callers must handle the null case: the app is
 * designed to work as a local-only guest experience without Firebase.
 */
export function getFirebase(): FirebaseServices {
  if (services) return services;
  if (!isFirebaseConfigured()) return EMPTY_SERVICES;

  try {
    const app = getApps().length > 0
      ? getApp()
      : initializeApp(readConfig());

    const googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    services = {
      app,
      auth: getAuth(app),
      db: getFirestore(app),
      googleProvider,
    };
    return services;
  } catch (error) {
    console.error('Firebase initialisation failed:', error);
    return EMPTY_SERVICES;
  }
}

/** @deprecated Use `getFirebase()`. Kept so existing call sites keep compiling. */
export const initFirebase = getFirebase;
