// ApproveX — SQLite database helper.

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
  `);
}

module.exports = { getDb };
