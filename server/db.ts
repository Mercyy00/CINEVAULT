import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'cinevault.db');
export const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize Database Tables
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS watchlists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      movie_id TEXT NOT NULL,
      movie_json TEXT NOT NULL,
      status TEXT NOT NULL,
      added_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (user_id, movie_id)
    );

    CREATE TABLE IF NOT EXISTS continue_watching (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      media_id TEXT NOT NULL,
      media_type TEXT NOT NULL,
      title TEXT NOT NULL,
      poster_path TEXT,
      backdrop_path TEXT,
      season_number INTEGER DEFAULT 0,
      episode_number INTEGER DEFAULT 0,
      progress_percentage REAL NOT NULL,
      timestamp INTEGER NOT NULL,
      time REAL NOT NULL,
      mal_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE (user_id, media_id, season_number, episode_number)
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      theme TEXT DEFAULT 'cinematic-dark',
      app_font TEXT DEFAULT 'bricolage',
      language TEXT DEFAULT 'English (US)',
      default_server TEXT DEFAULT 'auto',
      audio_preference TEXT DEFAULT 'sub',
      film_grain INTEGER DEFAULT 1,
      logo_style TEXT DEFAULT 'vault',
      show_spoilers INTEGER DEFAULT 0,
      auto_play_next INTEGER DEFAULT 1,
      reduced_motion INTEGER DEFAULT 0,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

initDatabase();
