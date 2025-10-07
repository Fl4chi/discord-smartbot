// src/store/db.js
// Database management and data persistence layer

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let db = null;

/**
 * Initialize database connection
 * @returns {Promise<Database>}
 */
async function init() {
  if (db) return db;

  try {
    db = await open({
      filename: path.join(process.cwd(), 'data', 'bot.db'),
      driver: sqlite3.Database
    });

    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');

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
  await db.exec(`
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

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_moderation_logs_guild ON moderation_logs(guildId);
    CREATE INDEX IF NOT EXISTS idx_moderation_logs_user ON moderation_logs(userId);
    CREATE INDEX IF NOT EXISTS idx_warnings_guild_user ON warnings(guildId, userId);
    CREATE INDEX IF NOT EXISTS idx_messages_guild_user ON messages(guildId, userId);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
    CREATE INDEX IF NOT EXISTS idx_member_joins_guild ON member_joins(guildId);
  `);
}

/**
 * Get guild configuration
 * @param {string} guildId - Guild ID
 * @returns {Promise<Object|null>}
 */
async function getGuildConfig(guildId) {
  try {
    return await db.get('SELECT * FROM guilds WHERE id = ?', guildId);
  } catch (error) {
    console.error('Error getting guild config:', error);
    return null;
  }
}

/**
 * Update guild configuration
 * @param {string} guildId - Guild ID
 * @param {Object} config - Configuration object
 */
async function updateGuildConfig(guildId, config) {
  try {
    const existing = await getGuildConfig(guildId);
    
    if (existing) {
      const updates = Object.keys(config)
        .map(key => `${key} = ?`)
        .join(', ');
      
      await db.run(
        `UPDATE guilds SET ${updates}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [...Object.values(config), guildId]
      );
    } else {
      await db.run(
        'INSERT INTO guilds (id, name) VALUES (?, ?)',
        [guildId, config.name || 'Unknown']
      );
    }
  } catch (error) {
    console.error('Error updating guild config:', error);
  }
}

/**
 * Log moderation action
 * @param {Object} data - Moderation log data
 */
async function logModeration(data) {
  try {
    await db.run(
      'INSERT INTO moderation_logs (guildId, action, moderatorId, userId, reason) VALUES (?, ?, ?, ?, ?)',
      [data.guildId, data.action, data.moderatorId, data.userId, data.reason]
    );
  } catch (error) {
    console.error('Error logging moderation action:', error);
  }
}

/**
 * Add warning to user
 * @param {Object} data - Warning data
 */
async function addWarning(data) {
  try {
    await db.run(
      'INSERT INTO warnings (guildId, userId, moderatorId, reason) VALUES (?, ?, ?, ?)',
      [data.guildId, data.userId, data.moderatorId, data.reason]
    );
  } catch (error) {
    console.error('Error adding warning:', error);
  }
}

/**
 * Get user warnings
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
async function getUserWarnings(guildId, userId) {
  try {
    return await db.all(
      'SELECT * FROM warnings WHERE guildId = ? AND userId = ? ORDER BY timestamp DESC',
      [guildId, userId]
    );
  } catch (error) {
    console.error('Error getting user warnings:', error);
    return [];
  }
}

/**
 * Get user moderation history
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
async function getUserModHistory(guildId, userId) {
  try {
    return await db.all(
      'SELECT * FROM moderation_logs WHERE guildId = ? AND userId = ? ORDER BY timestamp DESC LIMIT 50',
      [guildId, userId]
    );
  } catch (error) {
    console.error('Error getting mod history:', error);
    return [];
  }
}

/**
 * Store message for spam checking
 * @param {Object} data - Message data
 */
async function storeMessage(data) {
  try {
    await db.run(
      'INSERT OR REPLACE INTO messages (id, guildId, channelId, userId, content) VALUES (?, ?, ?, ?, ?)',
      [data.messageId, data.guildId, data.channelId, data.userId, data.content]
    );
  } catch (error) {
    console.error('Error storing message:', error);
  }
}

/**
 * Get recent messages from user
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @param {number} timeWindow - Time window in milliseconds
 * @returns {Promise<Array>}
 */
async function getRecentMessages(guildId, userId, timeWindow) {
  try {
    const cutoff = new Date(Date.now() - timeWindow);
    return await db.all(
      'SELECT * FROM messages WHERE guildId = ? AND userId = ? AND timestamp > ? ORDER BY timestamp DESC',
      [guildId, userId, cutoff.toISOString()]
    );
  } catch (error) {
    console.error('Error getting recent messages:', error);
    return [];
  }
}

/**
 * Log command usage
 * @param {Object} data - Command log data
 */
async function logCommand(data) {
  try {
    await db.run(
      'INSERT INTO commands (userId, guildId, commandName) VALUES (?, ?, ?)',
      [data.userId, data.guildId, data.commandName]
    );
  } catch (error) {
    console.error('Error logging command:', error);
  }
}

/**
 * Log member join
 * @param {Object} data - Member join data
 */
async function logMemberJoin(data) {
  try {
    await db.run(
      'INSERT INTO member_joins (guildId, userId) VALUES (?, ?)',
      [data.guildId, data.userId]
    );
  } catch (error) {
    console.error('Error logging member join:', error);
  }
}

/**
 * Log member leave
 * @param {Object} data - Member leave data
 */
async function logMemberLeave(data) {
  try {
    await db.run(
      'INSERT INTO member_leaves (guildId, userId) VALUES (?, ?)',
      [data.guildId, data.userId]
    );
  } catch (error) {
    console.error('Error logging member leave:', error);
  }
}

/**
 * Store conversation for learning
 * @param {Object} data - Conversation data
 */
async function storeConversation(data) {
  try {
    await db.run(
      'INSERT INTO conversations (userId, guildId, userMessage, botResponse) VALUES (?, ?, ?, ?)',
      [data.userId, data.guildId, data.userMessage, data.botResponse]
    );
  } catch (error) {
    console.error('Error storing conversation:', error);
  }
}

/**
 * Get user conversation history
 * @param {string} userId - User ID
 * @param {number} limit - Number of messages to retrieve
 * @returns {Promise<Array>}
 */
async function getConversationHistory(userId, limit = 10) {
  try {
    return await db.all(
      'SELECT * FROM conversations WHERE userId = ? ORDER BY timestamp DESC LIMIT ?',
      [userId, limit]
    );
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
}

/**
 * Clean up old data
 * @param {string} guildId - Guild ID
 * @param {number} days - Days to keep
 */
async function cleanupOldData(guildId, days) {
  try {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    await db.run(
      'DELETE FROM messages WHERE guildId = ? AND timestamp < ?',
      [guildId, cutoff.toISOString()]
    );
    
    console.log(`Cleaned up messages older than ${days} days`);
  } catch (error) {
    console.error('Error cleaning up old data:', error);
  }
}

/**
 * Get statistics for guild
 * @param {string} guildId - Guild ID
 * @returns {Promise<Object>}
 */
async function getGuildStats(guildId) {
  try {
    const [modActions, warnings, members] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM moderation_logs WHERE guildId = ?', guildId),
      db.get('SELECT COUNT(*) as count FROM warnings WHERE guildId = ?', guildId),
      db.get('SELECT COUNT(DISTINCT userId) as count FROM member_joins WHERE guildId = ?', guildId)
    ]);

    return {
      totalModActions: modActions.count,
      totalWarnings: warnings.count,
      totalMembers: members.count
    };
  } catch (error) {
    console.error('Error getting guild stats:', error);
    return {};
  }
}

/**
 * Close database connection
 */
async function close() {
  if (db) {
    await db.close();
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
  getGuildStats
};
