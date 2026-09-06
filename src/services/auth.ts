import {
  createUserWithEmailAndPassword,
  getIdTokenResult,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
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
  provider: 'firebase' | 'google' | 'anonymous';
  /** True only when the `admin` custom claim is present on the ID token. */
  isAdmin: boolean;
  emailVerified: boolean;
  /** True for a Firebase anonymous session (a "guest" with a real uid). */
  isAnonymous: boolean;
}

/** Minimum length enforced client-side. Firebase enforces its own policy too. */
const MIN_PASSWORD_LENGTH = 10;

/** User-facing message that reveals nothing about which factor was wrong. */
const GENERIC_CREDENTIAL_ERROR = 'That email and password combination is not recognised.';
const NOT_CONFIGURED_ERROR =
  'Accounts are unavailable right now. You can keep browsing as a guest.';
/** Operator misconfiguration. Deliberately vague to end users; details go to the console. */
const SERVICE_UNAVAILABLE_ERROR =
  'Sign-in is temporarily unavailable. Please try again later.';

async function toAuthUser(user: User): Promise<AuthUser> {
  const providerIds = user.providerData.map((entry) => entry.providerId);

  // The admin flag comes exclusively from a custom claim minted by the Firebase
  // Admin SDK server-side. An `email === '...'` comparison used to sit here as
  // an `||` fallback, which meant admin was decided by a string in the shipped
  // bundle rather than by a verified token.
  let isAdmin = false;
  try {
    const token = await getIdTokenResult(user);
    isAdmin = token.claims.admin === true;
  } catch {
    isAdmin = false;
  }

  const provider: AuthUser['provider'] = user.isAnonymous
    ? 'anonymous'
    : providerIds.includes('google.com')
      ? 'google'
      : 'firebase';

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    provider,
    isAdmin,
    emailVerified: user.emailVerified,
    isAnonymous: user.isAnonymous,
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
    case 'auth/operation-not-allowed':
    case 'auth/invalid-api-key':
    case 'auth/configuration-not-found':
      // These are operator misconfigurations. The previous copy told end users
      // to "Add your Netlify URL to Firebase Authentication > Settings >
      // Authorized Domains", which is internal detail they cannot act on.
      console.error('Auth configuration error:', code, error);
      return new Error(SERVICE_UNAVAILABLE_ERROR);
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
      // Fire-and-forget: a failed verification send must not fail registration.
      void sendEmailVerification(credential.user).catch((cause) =>
        console.error('Verification email failed to send:', cause)
      );
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
   * Starts a Firebase anonymous session so a guest has a *real* uid.
   *
   * Guests previously got a client-minted `guest_<timestamp>_<random>` string,
   * which forced Firestore rules to allow `uid.matches('^guest_.*')` — a clause
   * that let any unauthenticated visitor read and overwrite every other guest's
   * profile and history. With anonymous auth, `isOwner(uid)` covers guests too
   * and the wildcard is gone.
   *
   * Returns null when Firebase is unavailable; callers must fall back to a
   * local-only experience and write nothing to the cloud.
   */
  async signInAsGuest(): Promise<AuthUser | null> {
    const { auth } = getFirebase();
    if (!auth) return null;
    if (auth.currentUser) return toAuthUser(auth.currentUser);

    try {
      const credential = await signInAnonymously(auth);
      return await toAuthUser(credential.user);
    } catch (error) {
      console.error('Anonymous sign-in failed; continuing local-only:', error);
      return null;
    }
  },

  /** Re-sends the verification email for the current session. */
  async sendVerificationEmail(): Promise<void> {
    const { auth } = getFirebase();
    if (!auth?.currentUser) throw new Error(NOT_CONFIGURED_ERROR);
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (error) {
      throw toPublicError(error);
    }
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
   * The callback receives `undefined` while the session is still resolving, so
   * callers can render a loading state instead of flashing a signed-out UI and
   * then swapping to signed-in. Previously this contract was documented but
   * never implemented — only `null` or a user was ever emitted.
   */
  onAuthStateChanged(callback: (user: AuthUser | null | undefined) => void): () => void {
    const { auth } = getFirebase();
    if (!auth) {
      callback(null);
      return () => {};
    }

    callback(undefined);

    return firebaseOnAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        callback(null);
        return;
      }
      void toAuthUser(firebaseUser).then(callback);
    });
  },
};
