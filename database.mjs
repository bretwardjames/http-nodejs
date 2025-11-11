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

    // Only log to change history if value actually changed
    if (oldValue !== value) {
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
    }

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

// ============= MULTI-SET GRAPHIC SYSTEM =============

// Generate UUID for graphic sets
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Check if migration is needed and perform it
function checkAndMigrateToMultiSet(config) {
  // If graphicSets already exists, migration is done
  if (config.PLE_promo_graphicSets && Array.isArray(config.PLE_promo_graphicSets)) {
    return false; // No migration needed
  }

  // Check if old structure exists
  if (!config.PLE_promo_ticketGraphicDesktop && !config.PLE_promo_ticketGraphicDesktop_next) {
    return false; // No old data to migrate
  }

  // Perform migration
  const graphicSets = [];

  // Create Set 1: Current (Before Switch) graphics with far-past start date
  const set1 = {
    id: generateUUID(),
    name: 'Previous Promo',
    description: '',
    startDate: '2020-01-01T00:00:00-04:00',
    graphics: {
      gaDesktop: config.PLE_promo_ticketGraphicDesktop || '',
      gaMobile: config.PLE_promo_ticketGraphicMobile || '',
      compDesktop: config.PLE_promo_compTicketGraphicDesktop || '',
      compMobile: config.PLE_promo_compTicketGraphicMobile || ''
    },
    promoText: {
      ga: config.PLE_promo_ticketPromoLine || '',
      comp: config.PLE_promo_compTicketPromoLine || ''
    }
  };
  graphicSets.push(set1);

  // Create Set 2: Next (After Switch) graphics with current switch date
  const switchDate = config.PLE_promo_promo_switchDate || new Date().toISOString();
  const set2 = {
    id: generateUUID(),
    name: 'Current Promo',
    description: '',
    startDate: switchDate,
    graphics: {
      gaDesktop: config.PLE_promo_ticketGraphicDesktop_next || '',
      gaMobile: config.PLE_promo_ticketGraphicMobile_next || '',
      compDesktop: config.PLE_promo_compTicketGraphicDesktop_next || '',
      compMobile: config.PLE_promo_compTicketGraphicMobile_next || ''
    },
    promoText: {
      ga: config.PLE_promo_ticketPromoLine_next || '',
      comp: config.PLE_promo_compTicketPromoLine_next || ''
    }
  };
  graphicSets.push(set2);

  // Store the new structure
  config.PLE_promo_graphicSets = graphicSets;

  // Keep the old fields for backward compatibility but mark them as deprecated
  config.PLE_MIGRATION_TO_MULTISET_COMPLETE = new Date().toISOString();

  return true; // Migration was performed
}

// Get all graphic sets
export function getAllGraphicSets() {
  try {
    let config = {};
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      config = JSON.parse(data);
    }

    const migrationPerformed = checkAndMigrateToMultiSet(config);

    // If migration was performed, save the config back to the file
    if (migrationPerformed) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    }

    if (Array.isArray(config.PLE_promo_graphicSets)) {
      return config.PLE_promo_graphicSets;
    }
    return [];
  } catch (err) {
    console.error('Error getting graphic sets:', err);
    return [];
  }
}

// Check if a graphic set is complete (has all 4 required images)
export function isGraphicSetComplete(set) {
  return set &&
         set.graphics &&
         set.graphics.gaDesktop && set.graphics.gaDesktop.trim() &&
         set.graphics.gaMobile && set.graphics.gaMobile.trim() &&
         set.graphics.compDesktop && set.graphics.compDesktop.trim() &&
         set.graphics.compMobile && set.graphics.compMobile.trim();
}

// Get the active graphic set based on current date
export function getActiveGraphicSet() {
  try {
    const sets = getAllGraphicSets();
    if (sets.length === 0) return null;

    const now = new Date();

    // Filter to sets with startDate <= now AND have all 4 images (complete)
    const eligibleSets = sets.filter(set => {
      const startDate = new Date(set.startDate);
      return startDate <= now && isGraphicSetComplete(set);
    });

    // If no eligible sets, return null
    if (eligibleSets.length === 0) return null;

    // Sort by startDate descending (most recent first)
    eligibleSets.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    // Return the most recent eligible set
    return eligibleSets[0];
  } catch (err) {
    console.error('Error getting active graphic set:', err);
    return null;
  }
}

// Add a new graphic set
export function addGraphicSet(set, username = 'system') {
  try {
    let config = {};
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      config = JSON.parse(data);
    }

    const migrationPerformed = checkAndMigrateToMultiSet(config);

    if (!Array.isArray(config.PLE_promo_graphicSets)) {
      config.PLE_promo_graphicSets = [];
    }

    // Ensure set has required fields
    const newSet = {
      id: set.id || generateUUID(),
      name: set.name || 'New Set',
      description: set.description || '',
      startDate: set.startDate || new Date().toISOString(),
      graphics: set.graphics || {
        gaDesktop: '',
        gaMobile: '',
        compDesktop: '',
        compMobile: ''
      },
      promoText: set.promoText || {
        ga: '',
        comp: ''
      }
    };

    config.PLE_promo_graphicSets.push(newSet);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

    // Log to history
    logToHistory('PLE_promo_graphicSets', null, `Added set: ${newSet.name}`, username);

    return true;
  } catch (err) {
    console.error('Error adding graphic set:', err);
    return false;
  }
}

// Update a graphic set
export function updateGraphicSet(setId, updates, username = 'system') {
  try {
    let config = {};
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      config = JSON.parse(data);
    }

    checkAndMigrateToMultiSet(config);

    if (!Array.isArray(config.PLE_promo_graphicSets)) {
      return false;
    }

    const setIndex = config.PLE_promo_graphicSets.findIndex(set => set.id === setId);
    if (setIndex === -1) {
      return false;
    }

    const oldSet = JSON.parse(JSON.stringify(config.PLE_promo_graphicSets[setIndex]));
    const updatedSet = {
      ...config.PLE_promo_graphicSets[setIndex],
      ...updates,
      id: setId // Ensure ID doesn't change
    };

    config.PLE_promo_graphicSets[setIndex] = updatedSet;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

    // Log to history
    logToHistory('PLE_promo_graphicSets', oldSet, updatedSet, username);

    return true;
  } catch (err) {
    console.error('Error updating graphic set:', err);
    return false;
  }
}

// Delete a graphic set
export function deleteGraphicSet(setId, username = 'system') {
  try {
    let config = {};
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      config = JSON.parse(data);
    }

    checkAndMigrateToMultiSet(config);

    if (!Array.isArray(config.PLE_promo_graphicSets)) {
      return false;
    }

    const setIndex = config.PLE_promo_graphicSets.findIndex(set => set.id === setId);
    if (setIndex === -1) {
      return false;
    }

    const deletedSet = config.PLE_promo_graphicSets[setIndex];
    config.PLE_promo_graphicSets.splice(setIndex, 1);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

    // Log to history
    logToHistory('PLE_promo_graphicSets', deletedSet, null, username);

    return true;
  } catch (err) {
    console.error('Error deleting graphic set:', err);
    return false;
  }
}

// Helper function to log graphic set changes to history
function logToHistory(key, oldValue, newValue, username) {
  try {
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf8');
      history = JSON.parse(data);
    }

    history.unshift({
      id: history.length + 1,
      key,
      old_value: oldValue,
      new_value: newValue,
      username,
      changed_at: new Date().toISOString()
    });

    // Keep only last 500 entries
    if (history.length > 500) {
      history = history.slice(0, 500);
    }

    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error('Error logging to history:', err);
  }
}
