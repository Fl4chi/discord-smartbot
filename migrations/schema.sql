-- migrations/schema.sql
-- Database schema for SmartBot Discord
-- SQLite database structure for data persistence

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Guilds table - stores server configurations
CREATE TABLE IF NOT EXISTS guilds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  welcomeChannelId TEXT,
  modlogChannelId TEXT,
  statsChannelId TEXT,
  antispamEnabled INTEGER DEFAULT 1,
  antiInviteEnabled INTEGER DEFAULT 1,
  antiraidEnabled INTEGER DEFAULT 1,
  strictMode INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table - stores user information
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  discriminator TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Moderation logs table - tracks all moderation actions
CREATE TABLE IF NOT EXISTS moderation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guildId TEXT NOT NULL,
  action TEXT NOT NULL,
  moderatorId TEXT NOT NULL,
  userId TEXT NOT NULL,
  reason TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guildId) REFERENCES guilds(id) ON DELETE CASCADE
);

-- Warnings table - stores user warnings
CREATE TABLE IF NOT EXISTS warnings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guildId TEXT NOT NULL,
  userId TEXT NOT NULL,
  moderatorId TEXT NOT NULL,
  reason TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiresAt DATETIME,
  FOREIGN KEY (guildId) REFERENCES guilds(id) ON DELETE CASCADE
);

-- Messages table - temporary storage for spam detection
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  guildId TEXT NOT NULL,
  channelId TEXT NOT NULL,
  userId TEXT NOT NULL,
  content TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guildId) REFERENCES guilds(id) ON DELETE CASCADE
);

-- Commands table - tracks command usage statistics
CREATE TABLE IF NOT EXISTS commands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  guildId TEXT,
  commandName TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Member joins table - tracks member join events for raid detection
CREATE TABLE IF NOT EXISTS member_joins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guildId TEXT NOT NULL,
  userId TEXT NOT NULL,
  accountAge INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guildId) REFERENCES guilds(id) ON DELETE CASCADE
);

-- Member leaves table - tracks member leave events
CREATE TABLE IF NOT EXISTS member_leaves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guildId TEXT NOT NULL,
  userId TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guildId) REFERENCES guilds(id) ON DELETE CASCADE
);

-- Conversations table - stores AI conversation history
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  guildId TEXT,
  userMessage TEXT NOT NULL,
  botResponse TEXT NOT NULL,
  sentiment TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Raid events table - tracks detected raid attempts
CREATE TABLE IF NOT EXISTS raid_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guildId TEXT NOT NULL,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL,
  usersAffected INTEGER DEFAULT 0,
  actionsToken INTEGER DEFAULT 0,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolvedAt DATETIME,
  FOREIGN KEY (guildId) REFERENCES guilds(id) ON DELETE CASCADE
);

-- Automod rules table - custom automod rules per guild
CREATE TABLE IF NOT EXISTS automod_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guildId TEXT NOT NULL,
  ruleName TEXT NOT NULL,
  ruleType TEXT NOT NULL,
  pattern TEXT,
  action TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  createdBy TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (guildId) REFERENCES guilds(id) ON DELETE CASCADE
);

-- Indexes for performance optimization

-- Moderation logs indexes
CREATE INDEX IF NOT EXISTS idx_moderation_logs_guild 
  ON moderation_logs(guildId);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_user 
  ON moderation_logs(userId);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_timestamp 
  ON moderation_logs(timestamp DESC);

-- Warnings indexes
CREATE INDEX IF NOT EXISTS idx_warnings_guild_user 
  ON warnings(guildId, userId);
CREATE INDEX IF NOT EXISTS idx_warnings_active 
  ON warnings(active);
CREATE INDEX IF NOT EXISTS idx_warnings_timestamp 
  ON warnings(timestamp DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_guild_user 
  ON messages(guildId, userId);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp 
  ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_channel 
  ON messages(channelId);

-- Commands indexes
CREATE INDEX IF NOT EXISTS idx_commands_user 
  ON commands(userId);
CREATE INDEX IF NOT EXISTS idx_commands_guild 
  ON commands(guildId);
CREATE INDEX IF NOT EXISTS idx_commands_name 
  ON commands(commandName);
CREATE INDEX IF NOT EXISTS idx_commands_timestamp 
  ON commands(timestamp DESC);

-- Member joins indexes
CREATE INDEX IF NOT EXISTS idx_member_joins_guild 
  ON member_joins(guildId);
CREATE INDEX IF NOT EXISTS idx_member_joins_timestamp 
  ON member_joins(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_member_joins_user 
  ON member_joins(userId);

-- Member leaves indexes
CREATE INDEX IF NOT EXISTS idx_member_leaves_guild 
  ON member_leaves(guildId);
CREATE INDEX IF NOT EXISTS idx_member_leaves_timestamp 
  ON member_leaves(timestamp DESC);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user 
  ON conversations(userId);
CREATE INDEX IF NOT EXISTS idx_conversations_guild 
  ON conversations(guildId);
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp 
  ON conversations(timestamp DESC);

-- Raid events indexes
CREATE INDEX IF NOT EXISTS idx_raid_events_guild 
  ON raid_events(guildId);
CREATE INDEX IF NOT EXISTS idx_raid_events_timestamp 
  ON raid_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_raid_events_resolved 
  ON raid_events(resolvedAt);

-- Automod rules indexes
CREATE INDEX IF NOT EXISTS idx_automod_rules_guild 
  ON automod_rules(guildId);
CREATE INDEX IF NOT EXISTS idx_automod_rules_enabled 
  ON automod_rules(enabled);

-- Views for common queries

-- Active warnings view
CREATE VIEW IF NOT EXISTS active_warnings AS
SELECT 
  w.*,
  u.username
FROM warnings w
LEFT JOIN users u ON w.userId = u.id
WHERE w.active = 1
  AND (w.expiresAt IS NULL OR w.expiresAt > CURRENT_TIMESTAMP);

-- Recent moderation actions view
CREATE VIEW IF NOT EXISTS recent_mod_actions AS
SELECT 
  ml.*,
  u.username as target_username,
  m.username as moderator_username
FROM moderation_logs ml
LEFT JOIN users u ON ml.userId = u.id
LEFT JOIN users m ON ml.moderatorId = m.id
ORDER BY ml.timestamp DESC
LIMIT 100;

-- Guild statistics view
CREATE VIEW IF NOT EXISTS guild_stats AS
SELECT 
  g.id,
  g.name,
  COUNT(DISTINCT mj.userId) as total_joins,
  COUNT(DISTINCT ml.userId) as total_mod_actions,
  COUNT(DISTINCT w.userId) as total_warnings,
  COUNT(DISTINCT c.userId) as total_command_users
FROM guilds g
LEFT JOIN member_joins mj ON g.id = mj.guildId
LEFT JOIN moderation_logs ml ON g.id = ml.guildId
LEFT JOIN warnings w ON g.id = w.guildId
LEFT JOIN commands c ON g.id = c.guildId
GROUP BY g.id, g.name;

-- Triggers for automatic data management

-- Update guild updatedAt on configuration changes
CREATE TRIGGER IF NOT EXISTS update_guild_timestamp 
AFTER UPDATE ON guilds
FOR EACH ROW
BEGIN
  UPDATE guilds SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Auto-expire warnings after 90 days if not manually set
CREATE TRIGGER IF NOT EXISTS auto_expire_warnings
AFTER INSERT ON warnings
FOR EACH ROW
WHEN NEW.expiresAt IS NULL
BEGIN
  UPDATE warnings 
  SET expiresAt = datetime(NEW.timestamp, '+90 days')
  WHERE id = NEW.id;
END;

-- Insert default guild configuration
CREATE TRIGGER IF NOT EXISTS default_guild_config
AFTER INSERT ON guilds
FOR EACH ROW
WHEN NEW.antispamEnabled IS NULL
BEGIN
  UPDATE guilds 
  SET 
    antispamEnabled = 1,
    antiInviteEnabled = 1,
    antiraidEnabled = 1,
    strictMode = 0
  WHERE id = NEW.id;
END;

-- Initial data for testing (optional)

-- Sample guild configuration (commented out for production)
-- INSERT OR IGNORE INTO guilds (id, name) VALUES 
-- ('123456789012345678', 'Test Server');

-- Database version tracking
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

-- Insert current schema version
INSERT OR IGNORE INTO schema_version (version, description) 
VALUES (1, 'Initial schema with all core tables and indexes');

-- End of schema
-- This schema supports:
-- - Multi-guild bot operation
-- - Comprehensive moderation system
-- - Anti-spam and anti-raid protection
-- - AI conversation tracking
-- - Performance optimization with indexes
-- - Data integrity with foreign keys
-- - Automatic data management with triggers
