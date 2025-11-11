import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database (JSON files)
export function initializeDatabase() {
  // Initialize config file
  if (!fs.existsSync(CONFIG_FILE)) {
    const pleVars = Object.entries(process.env)
      .filter(([key]) => key.startsWith('PLE_'))
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(pleVars, null, 2));
  }

  // Initialize users file
  if (!fs.existsSync(USERS_FILE)) {
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'password';
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);

    const users = {
      [adminUsername]: {
        id: 1,
        username: adminUsername,
        password: hashedPassword,
        created_at: new Date().toISOString()
      }
    };

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log(`Created initial admin user: ${adminUsername}`);
  }

  // Initialize history file
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2));
  }
}

// Get all config values
export function getAllConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = JSON.parse(data);

      // If config file has values, return them
      if (Object.keys(config).length > 0) {
        return config;
      }
    }

    // Fallback to environment variables
    const pleVars = Object.entries(process.env)
      .filter(([key]) => key.startsWith('PLE_'))
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
    return pleVars;
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

// Get single config value
export function getConfigValue(key) {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      const config = JSON.parse(data);
      if (config[key]) {
        return config[key];
      }
    }
    // Fallback to environment variable
    return process.env[key] || null;
  } catch (err) {
    console.error(`Error getting config value for ${key}:`, err);
    return process.env[key] || null;
  }
}

// Set config value
export function setConfigValue(key, value, username = 'system') {
  try {
    let config = {};

    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      config = JSON.parse(data);
    }

    const oldValue = config[key] || null;
    config[key] = value;

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

    // Log to change history
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf8');
      history = JSON.parse(data);
    }

    history.unshift({
      id: history.length + 1,
      key,
      old_value: oldValue,
      new_value: value,
      username,
      changed_at: new Date().toISOString()
    });

    // Keep only last 500 entries to avoid huge file
    if (history.length > 500) {
      history = history.slice(0, 500);
    }

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

    return true;
  } catch (err) {
    console.error(`Error setting config value for ${key}:`, err);
    return false;
  }
}

// Get change history
export function getChangeHistory(limit = 50) {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf8');
      const history = JSON.parse(data);
      return history.slice(0, limit);
    }
    return [];
  } catch (err) {
    console.error('Error getting change history:', err);
    return [];
  }
}

// Authenticate user
export function authenticateUser(username, password) {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return null;
    }

    const data = fs.readFileSync(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    const user = users[username];

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
    if (!fs.existsSync(USERS_FILE)) {
      return null;
    }

    const data = fs.readFileSync(USERS_FILE, 'utf8');
    const users = JSON.parse(data);

    for (const user of Object.values(users)) {
      if (user.id === id) {
        return { id: user.id, username: user.username };
      }
    }
    return null;
  } catch (err) {
    console.error('Error getting user by ID:', err);
    return null;
  }
}

// Create new user
export function createUser(username, password) {
  try {
    let users = {};

    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(data);
    }

    // Check if user already exists
    if (users[username]) {
      return false;
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newId = Math.max(...Object.values(users).map(u => u.id || 0)) + 1;

    users[username] = {
      id: newId,
      username,
      password: hashedPassword,
      created_at: new Date().toISOString()
    };

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (err) {
    console.error('Error creating user:', err);
    return false;
  }
}

// Get all users
export function getAllUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }

    const data = fs.readFileSync(USERS_FILE, 'utf8');
    const users = JSON.parse(data);

    return Object.values(users).map(user => ({
      id: user.id,
      username: user.username,
      created_at: user.created_at
    }));
  } catch (err) {
    console.error('Error getting all users:', err);
    return [];
  }
}
