import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'config.db');

// Ensure data directory exists
import fs from 'fs';
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Create tables if they don't exist
export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Config values table
  db.exec(`
    CREATE TABLE IF NOT EXISTS config_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Change history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS change_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      username TEXT,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migrate existing environment variables to database
  migrateEnvVars();

  // Create initial admin user if it doesn't exist
  createAdminUserIfNeeded();
}

// Migrate PLE variables from environment to database
function migrateEnvVars() {
  const pleVars = Object.entries(process.env)
    .filter(([key]) => key.startsWith('PLE_'))
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

  for (const [key, value] of Object.entries(pleVars)) {
    try {
      const existing = db.prepare('SELECT value FROM config_values WHERE key = ?').get(key);
      if (!existing) {
        db.prepare('INSERT INTO config_values (key, value) VALUES (?, ?)').run(key, value);
      }
    } catch (err) {
      console.error(`Error migrating env var ${key}:`, err);
    }
  }
}

// Create admin user from environment variables if not exists
function createAdminUserIfNeeded() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password';

  try {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername);
    if (!existing) {
      const hashedPassword = bcrypt.hashSync(adminPassword, 10);
      db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(
        adminUsername,
        hashedPassword
      );
      console.log(`Created initial admin user: ${adminUsername}`);
    }
  } catch (err) {
    console.error('Error creating admin user:', err);
  }
}

// Get all config values (with fallback to env vars if DB is empty)
export function getAllConfig() {
  try {
    const configs = db.prepare('SELECT key, value FROM config_values').all();
    const result = {};
    configs.forEach(({ key, value }) => {
      result[key] = value;
    });

    // If database is empty, fallback to PLE environment variables
    if (Object.keys(result).length === 0) {
      const pleVars = Object.entries(process.env)
        .filter(([key]) => key.startsWith('PLE_'))
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
      return pleVars;
    }

    return result;
  } catch (err) {
    console.error('Error getting config:', err);
    // Fallback to environment variables on error
    const pleVars = Object.entries(process.env)
      .filter(([key]) => key.startsWith('PLE_'))
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
    return pleVars;
  }
}

// Get single config value (with fallback to env var if not in DB)
export function getConfigValue(key) {
  try {
    const row = db.prepare('SELECT value FROM config_values WHERE key = ?').get(key);
    if (row) {
      return row.value;
    }
    // Fallback to environment variable
    return process.env[key] || null;
  } catch (err) {
    console.error(`Error getting config value for ${key}:`, err);
    // Fallback to environment variable on error
    return process.env[key] || null;
  }
}

// Set config value
export function setConfigValue(key, value, username = 'system') {
  try {
    const oldValue = getConfigValue(key);

    const existing = db.prepare('SELECT id FROM config_values WHERE key = ?').get(key);
    if (existing) {
      db.prepare('UPDATE config_values SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(value, key);
    } else {
      db.prepare('INSERT INTO config_values (key, value) VALUES (?, ?)').run(key, value);
    }

    // Log to change history
    db.prepare(`
      INSERT INTO change_history (key, old_value, new_value, username)
      VALUES (?, ?, ?, ?)
    `).run(key, oldValue, value, username);

    return true;
  } catch (err) {
    console.error(`Error setting config value for ${key}:`, err);
    return false;
  }
}

// Get change history
export function getChangeHistory(limit = 50) {
  try {
    const history = db.prepare(`
      SELECT id, key, old_value, new_value, username, changed_at
      FROM change_history
      ORDER BY changed_at DESC
      LIMIT ?
    `).all(limit);
    return history;
  } catch (err) {
    console.error('Error getting change history:', err);
    return [];
  }
}

// Authenticate user
export function authenticateUser(username, password) {
  try {
    const user = db.prepare('SELECT id, username, password FROM users WHERE username = ?').get(username);
    if (!user) {
      return null;
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return null;
    }

    return { id: user.id, username: user.username };
  } catch (err) {
    console.error('Error authenticating user:', err);
    return null;
  }
}

// Get user by ID
export function getUserById(id) {
  try {
    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
    return user || null;
  } catch (err) {
    console.error('Error getting user by ID:', err);
    return null;
  }
}

// Create new user
export function createUser(username, password) {
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);
    return true;
  } catch (err) {
    console.error('Error creating user:', err);
    return false;
  }
}

// Get all users (without passwords)
export function getAllUsers() {
  try {
    const users = db.prepare('SELECT id, username, created_at FROM users').all();
    return users;
  } catch (err) {
    console.error('Error getting all users:', err);
    return [];
  }
}

export default db;
