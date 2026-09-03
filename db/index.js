const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// On Vercel the filesystem is read-only (except /tmp, which doesn't persist
// across invocations anyway), so there's no point writing a .db file there.
// Use an in-memory database instead — it reseeds itself on every cold start.
const isServerless = !!process.env.VERCEL;

let db;
if (isServerless) {
  db = new DatabaseSync(':memory:');
} else {
  const dataDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  db = new DatabaseSync(path.join(dataDir, 'shop.db'));
  db.exec('PRAGMA journal_mode = WAL');
}

db.transaction = (fn) => (...args) => {
  db.exec('BEGIN');
  try {
    const result = fn(...args);
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
};

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    tagline TEXT NOT NULL,
    description TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    icon TEXT NOT NULL DEFAULT 'sensor'
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    total_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'paid (demo)',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price_cents INTEGER NOT NULL
  );
`);

const { count: productCount } = db.prepare('SELECT COUNT(*) AS count FROM products').get();
if (productCount === 0) {
  const { seedProducts } = require('./products');
  seedProducts(db);
}

module.exports = db;
