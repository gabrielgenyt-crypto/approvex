const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'approvex.db');

let _db;

function getDb() {
  if (!_db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _migrate(_db);
  }
  return _db;
}

function _migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS seller_config (
      user_id   TEXT NOT NULL,
      key       TEXT NOT NULL,
      value     TEXT NOT NULL,
      PRIMARY KEY (user_id, key)
    );

    CREATE TABLE IF NOT EXISTS transcripts (
      ticket_id TEXT PRIMARY KEY,
      filepath  TEXT NOT NULL
    );

    -- Security fee limit per exchanger (set by staff via /securefee)
    CREATE TABLE IF NOT EXISTS exchanger_limits (
      user_id     TEXT PRIMARY KEY,
      max_amount  REAL NOT NULL DEFAULT 0
    );

    -- Active exchange claims: tracks which exchanger claimed which ticket
    CREATE TABLE IF NOT EXISTS exchange_claims (
      ticket_id     TEXT PRIMARY KEY,
      channel_id    TEXT NOT NULL,
      exchanger_id  TEXT NOT NULL,
      amount        REAL NOT NULL DEFAULT 0,
      status        TEXT NOT NULL DEFAULT 'active',
      claimed_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

module.exports = { getDb };
