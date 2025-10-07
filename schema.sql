-- Discord SmartBot Database Schema
-- SQLite database structure

-- Tabella utenti
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  discriminator TEXT,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
  message_count INTEGER DEFAULT 0,
  opt_out BOOLEAN DEFAULT 0,
  language TEXT DEFAULT 'it',
  timezone TEXT DEFAULT 'UTC',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Statistiche giornaliere
CREATE TABLE IF NOT EXISTS stats_daily (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  user_id TEXT NOT NULL,
  messages_sent INTEGER DEFAULT 0,
  commands_used INTEGER DEFAULT 0,
  time_active_seconds INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  UNIQUE(date, user_id)
);

-- Tabella topics/argomenti discussi
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  keywords TEXT,
  message_count INTEGER DEFAULT 1,
  first_mentioned DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_mentioned DATETIME DEFAULT CURRENT_TIMESTAMP,
  sentiment_score REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Memoria contestuale (per conversazioni)
CREATE TABLE IF NOT EXISTS memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  memory_type TEXT NOT NULL CHECK(memory_type IN ('short', 'long', 'preference')),
  content TEXT NOT NULL,
  context TEXT,
  confidence REAL DEFAULT 1.0,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Audit log per GDPR compliance
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  user_id TEXT,
  guild_id TEXT,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Indici per ottimizzazione query
CREATE INDEX IF NOT EXISTS idx_stats_date ON stats_daily(date);
CREATE INDEX IF NOT EXISTS idx_stats_user ON stats_daily(user_id);
CREATE INDEX IF NOT EXISTS idx_topics_guild ON topics(guild_id);
CREATE INDEX IF NOT EXISTS idx_topics_last_mentioned ON topics(last_mentioned);
CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_memories_expires ON memories(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit(user_id);

-- Trigger per aggiornare updated_at automaticamente
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = NEW.user_id;
END;

CREATE TRIGGER IF NOT EXISTS update_memories_timestamp 
AFTER UPDATE ON memories
FOR EACH ROW
BEGIN
  UPDATE memories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
