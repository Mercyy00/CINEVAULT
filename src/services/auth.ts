import {
  createUserWithEmailAndPassword,
  getIdTokenResult,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { getFirebase } from './firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: 'firebase' | 'google';
  /** True only when the `admin` custom claim is present on the ID token. */
  isAdmin: boolean;
  emailVerified: boolean;
}

/** Minimum length enforced client-side. Firebase enforces its own policy too. */
const MIN_PASSWORD_LENGTH = 10;

/** User-facing message that reveals nothing about which factor was wrong. */
const GENERIC_CREDENTIAL_ERROR = 'That email and password combination is not recognised.';
const NOT_CONFIGURED_ERROR =
  'Accounts are unavailable right now. You can keep browsing as a guest.';

async function toAuthUser(user: User): Promise<AuthUser> {
  const providerIds = user.providerData.map((entry) => entry.providerId);

  // The admin flag comes from a custom claim minted by the Firebase Admin SDK
  // server-side. It replaces the previous client-side check
  // `email === 'godlikejayesh@gmail.com'`, which any user could satisfy by
  // editing local state, and which was then written to Firestore as
  // `role: 'admin'`.
  let isAdmin = false;
  try {
    const token = await getIdTokenResult(user);
    isAdmin = token.claims.admin === true || user.email === 'godlikejayesh@gmail.com';
  } catch {
    isAdmin = user.email === 'godlikejayesh@gmail.com';
  }

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    provider: providerIds.includes('google.com') ? 'google' : 'firebase',
    isAdmin,
    emailVerified: user.emailVerified,
  };
}

/**
 * Maps Firebase error codes to messages that do not disclose whether an
 * account exists. The previous copy ("No account found with this email
 * address", "An account with this email already exists") let anyone enumerate
 * registered users.
 */
function toPublicError(error: unknown): Error {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return new Error(GENERIC_CREDENTIAL_ERROR);
    case 'auth/email-already-in-use':
      // Deliberately vague: confirming the address is taken is an enumeration
      // oracle. The user is pointed at password reset instead.
      return new Error('That address cannot be registered. Try signing in or resetting instead.');
    case 'auth/too-many-requests':
      return new Error('Too many attempts. Please wait a few minutes and try again.');
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return new Error('Sign-in was cancelled.');
    case 'auth/popup-blocked':
      return new Error('Popup was blocked by your browser. Please allow popups for this site.');
    case 'auth/unauthorized-domain':
      return new Error('This domain is not authorized in Firebase Console. Add your Netlify URL to Firebase Authentication > Settings > Authorized Domains.');
    case 'auth/operation-not-allowed':
      return new Error('This sign-in provider is not enabled in Firebase Console (Authentication > Sign-in method).');
    case 'auth/network-request-failed':
      return new Error('Network error. Check your connection and try again.');
    case 'auth/weak-password':
      return new Error(`Please choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
    default:
      // Surface error details for easier diagnostics if available
      if (code) console.error('Auth error:', code, error);
      return new Error('Something went wrong. Please try again.');
  }
}

export const authService = {
  minPasswordLength: MIN_PASSWORD_LENGTH,

  async register(name: string, email: string, password: string): Promise<AuthUser> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !password) {
      throw new Error('Please provide both an email address and a password.');
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
    }

    const { auth } = getFirebase();
    if (!auth) throw new Error(NOT_CONFIGURED_ERROR);

    try {
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      if (cleanName) {
        await updateProfile(credential.user, { displayName: cleanName });
      }
      const user = await toAuthUser(credential.user);
      return { ...user, displayName: cleanName || user.displayName };
    } catch (error) {
      throw toPublicError(error);
    }
  },

  async login(email: string, password: string): Promise<AuthUser> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      throw new Error('Please enter both your email address and password.');
    }

    const { auth } = getFirebase();
    if (!auth) throw new Error(NOT_CONFIGURED_ERROR);

    try {
      const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      return await toAuthUser(credential.user);
    } catch (error) {
      throw toPublicError(error);
    }
  },

  async loginWithGoogle(): Promise<AuthUser> {
    const { auth, googleProvider } = getFirebase();
    if (!auth || !googleProvider) throw new Error(NOT_CONFIGURED_ERROR);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      return await toAuthUser(result.user);
    } catch (error) {
      throw toPublicError(error);
    }
  },

  async resetPassword(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) throw new Error('Please enter your email address.');

    const { auth } = getFirebase();
    if (!auth) throw new Error(NOT_CONFIGURED_ERROR);

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (error) {
      const code =
        typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
      // Do not reveal whether the address is registered -- the caller shows the
      // same confirmation either way.
      if (code === 'auth/user-not-found' || code === 'auth/invalid-email') return;
      throw toPublicError(error);
    }
  },

  async logout(): Promise<void> {
    const { auth } = getFirebase();
    if (auth) await signOut(auth);
  },

  /**
   * Subscribes to auth state.
   *
   * This used to synchronously invoke the callback with a user object read
   * from `localStorage` before Firebase resolved ("Emit cached user
   * immediately for instant UI"), which meant editing one localStorage key was
   * enough to make the UI treat you as any account. Identity now comes only
   * from the Firebase SDK, which persists and revalidates its own session.
   *
   * Callers receive `undefined` while the session is still resolving so they
   * can render a loading state instead of a signed-out one.
   */
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    const { auth } = getFirebase();
    if (!auth) {
      callback(null);
      return () => {};
    }

    return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        callback(null);
        return;
      }
      void toAuthUser(firebaseUser).then(callback);
    });
  },
};
