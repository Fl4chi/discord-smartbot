// src/store/db.js
// Database management and data persistence layer
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
let db = null;

// Helper promisified wrappers around callback API
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this); // this has lastID, changes
    });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

/**
 * Initialize database connection
 */
async function init() {
  if (db) return db;
  try {
    const filename = path.join(process.cwd(), 'data', 'bot.db');
    await new Promise((resolve, reject) => {
      db = new sqlite3.Database(filename, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    // Enable foreign keys
    await run('PRAGMA foreign_keys = ON');

    // Create tables if they don't exist
    await createTables();

    console.log('✅ Database connection established');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Create database tables
 */
async function createTables() {
  await run(`
    CREATE TABLE IF NOT EXISTS guilds (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      welcomeChannelId TEXT,
      modlogChannelId TEXT,
      antispamEnabled INTEGER DEFAULT 1,
      antiInviteEnabled INTEGER DEFAULT 1,
      antiraidEnabled INTEGER DEFAULT 1,
      strictMode INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      discriminator TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS moderation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guildId TEXT NOT NULL,
      action TEXT NOT NULL,
      moderatorId TEXT NOT NULL,
      userId TEXT NOT NULL,
      reason TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (guildId) REFERENCES guilds(id)
    );
    CREATE TABLE IF NOT EXISTS warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guildId TEXT NOT NULL,
      userId TEXT NOT NULL,
      moderatorId TEXT NOT NULL,
      reason TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (guildId) REFERENCES guilds(id)
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      guildId TEXT NOT NULL,
      channelId TEXT NOT NULL,
      userId TEXT NOT NULL,
      content TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (guildId) REFERENCES guilds(id)
    );
    CREATE TABLE IF NOT EXISTS commands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      guildId TEXT,
      commandName TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS member_joins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guildId TEXT NOT NULL,
      userId TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (guildId) REFERENCES guilds(id)
    );
    CREATE TABLE IF NOT EXISTS member_leaves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guildId TEXT NOT NULL,
      userId TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (guildId) REFERENCES guilds(id)
    );
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      guildId TEXT,
      userMessage TEXT NOT NULL,
      botResponse TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_moderation_logs_guild ON moderation_logs(guildId);
    CREATE INDEX IF NOT EXISTS idx_moderation_logs_user ON moderation_logs(userId);
    CREATE INDEX IF NOT EXISTS idx_warnings_guild_user ON warnings(guildId, userId);
    CREATE INDEX IF NOT EXISTS idx_messages_guild_user ON messages(guildId, userId);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
    CREATE INDEX IF NOT EXISTS idx_member_joins_guild ON member_joins(guildId);
  `);
}

// Public API using the promisified helpers above
async function getGuildConfig(guildId) {
  try {
    return await get('SELECT * FROM guilds WHERE id = ?', [guildId]);
  } catch (error) {
    console.error('Error getting guild config:', error);
    return null;
  }
}

async function updateGuildConfig(guildId, config) {
  try {
    const existing = await getGuildConfig(guildId);
    if (existing) {
      const keys = Object.keys(config);
      if (keys.length) {
        const updates = keys.map(k => `${k} = ?`).join(', ');
        await run(`UPDATE guilds SET ${updates}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, [...Object.values(config), guildId]);
      }
    } else {
      await run('INSERT INTO guilds (id, name) VALUES (?, ?)', [guildId, config.name || 'Unknown']);
    }
  } catch (error) {
    console.error('Error updating guild config:', error);
  }
}

async function logModeration(data) {
  try {
    await run('INSERT INTO moderation_logs (guildId, action, moderatorId, userId, reason) VALUES (?, ?, ?, ?, ?)', [data.guildId, data.action, data.moderatorId, data.userId, data.reason]);
  } catch (error) {
    console.error('Error logging moderation action:', error);
  }
}

async function addWarning(data) {
  try {
    await run('INSERT INTO warnings (guildId, userId, moderatorId, reason) VALUES (?, ?, ?, ?)', [data.guildId, data.userId, data.moderatorId, data.reason]);
  } catch (error) {
    console.error('Error adding warning:', error);
  }
}

async function getUserWarnings(guildId, userId) {
  try {
    return await all('SELECT * FROM warnings WHERE guildId = ? AND userId = ? ORDER BY timestamp DESC', [guildId, userId]);
  } catch (error) {
    console.error('Error getting user warnings:', error);
    return [];
  }
}

async function getUserModHistory(guildId, userId) {
  try {
    return await all('SELECT * FROM moderation_logs WHERE guildId = ? AND userId = ? ORDER BY timestamp DESC LIMIT 50', [guildId, userId]);
  } catch (error) {
    console.error('Error getting mod history:', error);
    return [];
  }
}

async function storeMessage(data) {
  try {
    await run('INSERT OR REPLACE INTO messages (id, guildId, channelId, userId, content) VALUES (?, ?, ?, ?, ?)', [data.messageId, data.guildId, data.channelId, data.userId, data.content]);
  } catch (error) {
    console.error('Error storing message:', error);
  }
}

async function getRecentMessages(guildId, userId, timeWindow) {
  try {
    const cutoff = new Date(Date.now() - timeWindow).toISOString();
    return await all('SELECT * FROM messages WHERE guildId = ? AND userId = ? AND timestamp > ? ORDER BY timestamp DESC', [guildId, userId, cutoff]);
  } catch (error) {
    console.error('Error getting recent messages:', error);
    return [];
  }
}

async function logCommand(data) {
  try {
    await run('INSERT INTO commands (userId, guildId, commandName) VALUES (?, ?, ?)', [data.userId, data.guildId, data.commandName]);
  } catch (error) {
    console.error('Error logging command:', error);
  }
}

async function logMemberJoin(data) {
  try {
    await run('INSERT INTO member_joins (guildId, userId) VALUES (?, ?)', [data.guildId, data.userId]);
  } catch (error) {
    console.error('Error logging member join:', error);
  }
}

async function logMemberLeave(data) {
  try {
    await run('INSERT INTO member_leaves (guildId, userId) VALUES (?, ?)', [data.guildId, data.userId]);
  } catch (error) {
    console.error('Error logging member leave:', error);
  }
}

async function storeConversation(data) {
  try {
    await run('INSERT INTO conversations (userId, guildId, userMessage, botResponse) VALUES (?, ?, ?, ?)', [data.userId, data.guildId, data.userMessage, data.botResponse]);
  } catch (error) {
    console.error('Error storing conversation:', error);
  }
}

async function getConversationHistory(userId, limit = 10) {
  try {
    return await all('SELECT * FROM conversations WHERE userId = ? ORDER BY timestamp DESC LIMIT ?', [userId, limit]);
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
}

async function cleanupOldData(guildId, days) {
  try {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    await run('DELETE FROM messages WHERE guildId = ? AND timestamp < ?', [guildId, cutoff]);
    console.log(`Cleaned up messages older than ${days} days`);
  } catch (error) {
    console.error('Error cleaning up old data:', error);
  }
}

async function close() {
  if (db) {
    await new Promise((resolve, reject) => db.close(err => err ? reject(err) : resolve()));
    db = null;
    console.log('✅ Database connection closed');
  }
}

module.exports = {
  init,
  close,
  getGuildConfig,
  updateGuildConfig,
  logModeration,
  addWarning,
  getUserWarnings,
  getUserModHistory,
  storeMessage,
  getRecentMessages,
  logCommand,
  logMemberJoin,
  logMemberLeave,
  storeConversation,
  getConversationHistory,
  cleanupOldData,
  getGuildStats: async function getGuildStats(guildId) {
    try {
      const [modActions, warnings, members] = await Promise.all([
        get('SELECT COUNT(*) as count FROM moderation_logs WHERE guildId = ?', [guildId]),
        get('SELECT COUNT(*) as count FROM warnings WHERE guildId = ?', [guildId]),
        get('SELECT COUNT(DISTINCT userId) as count FROM member_joins WHERE guildId = ?', [guildId])
      ]);
      return {
        totalModActions: modActions?.count || 0,
        totalWarnings: warnings?.count || 0,
        totalMembers: members?.count || 0
      };
    } catch (error) {
      console.error('Error getting guild stats:', error);
      return {};
    }
  }
};
