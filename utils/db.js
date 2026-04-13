// ApproveX — SQLite database helper using better-sqlite3.

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'approvex.db');

let _db;

/** Return (and lazily create) the singleton database connection. */
function getDb() {
  if (!_db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _migrate(_db);
  }
  return _db;
}

/** Run initial schema migrations. */
function _migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS warnings (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id  TEXT NOT NULL,
      user_id   TEXT NOT NULL,
      mod_id    TEXT NOT NULL,
      reason    TEXT NOT NULL,
      created   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id    TEXT NOT NULL,
      channel_id  TEXT NOT NULL UNIQUE,
      user_id     TEXT NOT NULL,
      claimed_by  TEXT,
      priority    TEXT DEFAULT 'medium',
      status      TEXT DEFAULT 'open',
      created     DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS snipes (
      guild_id    TEXT NOT NULL,
      channel_id  TEXT NOT NULL,
      author_tag  TEXT NOT NULL,
      content     TEXT NOT NULL,
      created     DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (guild_id, channel_id)
    );

    CREATE TABLE IF NOT EXISTS afk (
      guild_id  TEXT NOT NULL,
      user_id   TEXT NOT NULL,
      reason    TEXT NOT NULL,
      created   DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id    TEXT NOT NULL,
      seller_id   TEXT NOT NULL,
      buyer_id    TEXT NOT NULL,
      amount      REAL NOT NULL,
      payment     TEXT NOT NULL,
      description TEXT NOT NULL,
      trans_id    TEXT,
      created     DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vouches (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id  TEXT NOT NULL,
      user_id   TEXT NOT NULL,
      target_id TEXT NOT NULL,
      message   TEXT NOT NULL,
      created   DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = { getDb };
