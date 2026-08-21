import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

// Get config from environment variables or custom runtime storage
export function getFirebaseConfig(): FirebaseConfig {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localStorage.getItem('cv_firebase_api_key') || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localStorage.getItem('cv_firebase_auth_domain') || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localStorage.getItem('cv_firebase_project_id') || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localStorage.getItem('cv_firebase_storage_bucket') || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localStorage.getItem('cv_firebase_messaging_sender_id') || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || localStorage.getItem('cv_firebase_app_id') || '',
  };
}

export function isFirebaseConfigured(): boolean {
  const cfg = getFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.projectId && cfg.appId);
}

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestoreDb: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

export function initFirebase() {
  if (!isFirebaseConfigured()) {
    return { app: null, auth: null, db: null, googleProvider: null };
  }

  try {
    if (!firebaseApp && getApps().length === 0) {
      const cfg = getFirebaseConfig();
      firebaseApp = initializeApp(cfg as any);
    } else if (!firebaseApp && getApps().length > 0) {
      firebaseApp = getApps()[0];
    }

    if (firebaseApp && !firebaseAuth) {
      firebaseAuth = getAuth(firebaseApp);
      googleProvider = new GoogleAuthProvider();
    }

    if (firebaseApp && !firestoreDb) {
      firestoreDb = getFirestore(firebaseApp);
    }

    return {
      app: firebaseApp,
      auth: firebaseAuth,
      db: firestoreDb,
      googleProvider,
    };
  } catch (err) {
    console.warn('Firebase initialization error:', err);
    return { app: null, auth: null, db: null, googleProvider: null };
  }
}

export const firebase = initFirebase();
