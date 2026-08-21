export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: 'sqlite' | 'google';
}

const TOKEN_KEY = 'cv_auth_token';
const USER_KEY = 'cv_auth_user';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export const authService = {
  async register(name: string, email: string, pass: string): Promise<AuthUser> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();

    if (!cleanEmail || !pass) {
      throw new Error('Please provide both email and password.');
    }
    if (pass.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cleanName, email: cleanEmail, password: pass }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create account.');
    }

    setAuthToken(data.token);

    const user: AuthUser = {
      uid: data.user.id,
      email: data.user.email,
      displayName: data.user.name,
      photoURL: data.user.avatar || null,
      provider: 'sqlite',
    };

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  async login(email: string, pass: string): Promise<AuthUser> {
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !pass) {
      throw new Error('Please enter both email and password.');
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: pass }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to sign in.');
    }

    setAuthToken(data.token);

    const user: AuthUser = {
      uid: data.user.id,
      email: data.user.email,
      displayName: data.user.name,
      photoURL: data.user.avatar || null,
      provider: 'sqlite',
    };

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  async loginWithGoogle(): Promise<AuthUser> {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Google Cinephile',
        email: 'cinephile@gmail.com',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Google Sign-In failed.');
    }

    setAuthToken(data.token);

    const user: AuthUser = {
      uid: data.user.id,
      email: data.user.email,
      displayName: data.user.name,
      photoURL: data.user.avatar || null,
      provider: 'google',
    };

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  async resetPassword(email: string): Promise<void> {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) throw new Error('Please enter your email address.');

    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to request password reset.');
    }
  },

  async logout(): Promise<void> {
    setAuthToken(null);
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async fetchCurrentUser(): Promise<AuthUser | null> {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      const data = await response.json();
      const user: AuthUser = {
        uid: data.user.id,
        email: data.user.email,
        displayName: data.user.name,
        photoURL: data.user.avatar || null,
        provider: 'sqlite',
      };

      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch {
      return this.getCurrentUser();
    }
  },

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    const current = this.getCurrentUser();
    callback(current);

    // Verify token with backend
    this.fetchCurrentUser().then(user => {
      callback(user);
    });

    return () => {};
  }
};
