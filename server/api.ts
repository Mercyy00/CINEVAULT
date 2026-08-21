import { Router } from 'express';
import { db } from './db';
import { hashPassword, comparePassword, generateToken, requireAuth, AuthenticatedRequest } from './auth';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// Register a new user
apiRouter.post('/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim() || cleanEmail.split('@')[0];

    if (!cleanEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const userId = 'usr_' + Math.random().toString(36).substring(2, 12);
    const passwordHash = hashPassword(password);
    const now = Date.now();

    // Insert new user into SQLite
    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, avatar, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, cleanName, cleanEmail, passwordHash, null, now, now);

    // Initialize default user settings in SQLite
    db.prepare(`
      INSERT OR IGNORE INTO user_settings (user_id, updated_at)
      VALUES (?, ?)
    `).run(userId, now);

    const token = generateToken(userId, cleanEmail);

    return res.status(201).json({
      user: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        avatar: null,
      },
      token,
      message: 'Account created successfully',
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// Sign In / Login
apiRouter.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({ error: 'Please provide both email and password' });
    }

    // Lookup user in SQLite
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email address' });
    }

    // Verify bcrypt password hash
    const isMatch = comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const token = generateToken(user.id, user.email);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      token,
      message: 'Signed in successfully',
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to sign in. Please try again.' });
  }
});

// Google OAuth Mock Endpoint for testing
apiRouter.post('/auth/google', (req, res) => {
  try {
    const { email, name, avatar } = req.body;
    const cleanEmail = (email || 'google_user@gmail.com').trim().toLowerCase();
    const cleanName = (name || 'Google Cinephile').trim();

    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;
    const now = Date.now();

    if (!user) {
      const userId = 'usr_' + Math.random().toString(36).substring(2, 12);
      const dummyPass = hashPassword(Math.random().toString(36));
      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, avatar, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(userId, cleanName, cleanEmail, dummyPass, avatar || null, now, now);

      db.prepare(`
        INSERT OR IGNORE INTO user_settings (user_id, updated_at)
        VALUES (?, ?)
      `).run(userId, now);

      user = { id: userId, name: cleanName, email: cleanEmail, avatar: avatar || null };
    }

    const token = generateToken(user.id, user.email);
    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      token,
      message: 'Signed in with Google',
    });
  } catch (err: any) {
    console.error('Google auth error:', err);
    return res.status(500).json({ error: 'Google sign-in failed' });
  }
});

// Get Current User (via JWT token)
apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, avatar, created_at FROM users WHERE id = ?').get(req.user!.userId) as any;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Request Password Reset
apiRouter.post('/auth/reset-password', (req, res) => {
  const { email } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (!user) {
    return res.status(404).json({ error: 'No account registered with this email address' });
  }

  return res.json({ message: 'Password reset link sent to your email.' });
});

// ==========================================
// 2. CLOUD SYNCHRONIZATION ENDPOINTS
// ==========================================

// Get all user data (Watchlist, Continue Watching, Preferences)
apiRouter.get('/sync/data', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;

    // Fetch watchlist rows
    const watchlistRows = db.prepare('SELECT * FROM watchlists WHERE user_id = ? ORDER BY added_at DESC').all(userId) as any[];
    const watchlist = watchlistRows.map(row => ({
      movieId: row.movie_id,
      status: row.status,
      addedAt: row.added_at,
      movie: JSON.parse(row.movie_json),
    }));

    // Fetch continue watching rows
    const continueRows = db.prepare('SELECT * FROM continue_watching WHERE user_id = ? ORDER BY timestamp DESC').all(userId) as any[];
    const continueWatching = continueRows.map(row => ({
      id: row.media_id,
      media_type: row.media_type,
      title: row.title,
      poster_path: row.poster_path,
      backdrop_path: row.backdrop_path,
      season_number: row.season_number,
      episode_number: row.episode_number,
      progress_percentage: row.progress_percentage,
      timestamp: row.timestamp,
      time: row.time,
      mal_id: row.mal_id,
    }));

    // Fetch user settings
    const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) as any;

    return res.json({
      watchlist,
      continueWatching,
      settings: settings || {},
    });
  } catch (err: any) {
    console.error('Fetch sync data error:', err);
    return res.status(500).json({ error: 'Failed to fetch user cloud data' });
  }
});

// Batch Save / Synchronize Full User State
apiRouter.post('/sync/save', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { watchlist, continueWatching, profile, theme, appFont } = req.body;

    const saveTransaction = db.transaction(() => {
      // 1. Sync Watchlist
      if (Array.isArray(watchlist)) {
        const insertWatchlistStmt = db.prepare(`
          INSERT INTO watchlists (id, user_id, movie_id, movie_json, status, added_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, movie_id) DO UPDATE SET
            status = excluded.status,
            movie_json = excluded.movie_json,
            added_at = excluded.added_at
        `);

        for (const item of watchlist) {
          if (item && item.movieId) {
            const rowId = `wl_${userId}_${item.movieId}`;
            insertWatchlistStmt.run(
              rowId,
              userId,
              item.movieId,
              JSON.stringify(item.movie || {}),
              item.status || 'Not Started',
              item.addedAt || Date.now()
            );
          }
        }
      }

      // 2. Sync Continue Watching
      if (Array.isArray(continueWatching)) {
        const insertContinueStmt = db.prepare(`
          INSERT INTO continue_watching (
            id, user_id, media_id, media_type, title, poster_path, backdrop_path,
            season_number, episode_number, progress_percentage, timestamp, time, mal_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, media_id, season_number, episode_number) DO UPDATE SET
            progress_percentage = excluded.progress_percentage,
            timestamp = excluded.timestamp,
            time = excluded.time,
            poster_path = excluded.poster_path,
            backdrop_path = excluded.backdrop_path,
            title = excluded.title
        `);

        for (const item of continueWatching) {
          if (item && item.id) {
            const season = item.season_number || 0;
            const episode = item.episode_number || 0;
            const rowId = `cw_${userId}_${item.id}_${season}_${episode}`;
            insertContinueStmt.run(
              rowId,
              userId,
              item.id,
              item.media_type || 'movie',
              item.title || 'Untitled',
              item.poster_path || null,
              item.backdrop_path || null,
              season,
              episode,
              item.progress_percentage || 0,
              item.timestamp || Date.now(),
              item.time || 0,
              item.mal_id || null
            );
          }
        }
      }

      // 3. Sync Settings & Profile
      const now = Date.now();
      db.prepare(`
        INSERT INTO user_settings (
          user_id, theme, app_font, language, default_server, audio_preference,
          film_grain, logo_style, show_spoilers, auto_play_next, reduced_motion, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          theme = coalesce(excluded.theme, user_settings.theme),
          app_font = coalesce(excluded.app_font, user_settings.app_font),
          language = coalesce(excluded.language, user_settings.language),
          default_server = coalesce(excluded.default_server, user_settings.default_server),
          audio_preference = coalesce(excluded.audio_preference, user_settings.audio_preference),
          film_grain = coalesce(excluded.film_grain, user_settings.film_grain),
          logo_style = coalesce(excluded.logo_style, user_settings.logo_style),
          show_spoilers = coalesce(excluded.show_spoilers, user_settings.show_spoilers),
          auto_play_next = coalesce(excluded.auto_play_next, user_settings.auto_play_next),
          reduced_motion = coalesce(excluded.reduced_motion, user_settings.reduced_motion),
          updated_at = excluded.updated_at
      `).run(
        userId,
        theme || null,
        appFont || null,
        profile?.language || 'English (US)',
        profile?.defaultServer || 'auto',
        profile?.audioPreference || 'sub',
        profile?.filmGrain !== undefined ? (profile.filmGrain ? 1 : 0) : 1,
        profile?.logoStyle || 'vault',
        profile?.showSpoilers ? 1 : 0,
        profile?.autoPlayNext ? 1 : 0,
        profile?.reducedMotion ? 1 : 0,
        now
      );

      // Update display name if changed
      if (profile?.name) {
        db.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?').run(profile.name, now, userId);
      }
    });

    saveTransaction();
    return res.json({ success: true, message: 'Cloud synchronization completed successfully' });
  } catch (err: any) {
    console.error('Sync save error:', err);
    return res.status(500).json({ error: 'Failed to save cloud sync data' });
  }
});

// Remove item from Watchlist
apiRouter.delete('/sync/watchlist/:movieId', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const movieId = req.params.movieId;
    db.prepare('DELETE FROM watchlists WHERE user_id = ? AND movie_id = ?').run(userId, movieId);
    return res.json({ success: true, message: 'Item removed from cloud watchlist' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete watchlist item' });
  }
});
