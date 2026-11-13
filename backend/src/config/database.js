const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { loadOpenRequests } = require('../data/loader');

let db = null;

function connectDatabase(dbPath) {
  if (db) return db;

  const resolvedPath = dbPath || process.env.DB_PATH || path.resolve(__dirname, '../../airport_taxi.db');
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(resolvedPath, { verbose: process.env.DB_VERBOSE === 'true' ? console.log : null });
  // Enable WAL mode for better concurrency and performance
  db.pragma('journal_mode = WAL');
  return db;
}

function initializeDatabase(dbPath) {
  const database = connectDatabase(dbPath);

  // Initial table as per specification
  database.exec(`
    CREATE TABLE IF NOT EXISTS ride_requests (
      id TEXT PRIMARY KEY,
      traveler_name TEXT,
      flight_id TEXT NOT NULL,
      hotel_id TEXT NOT NULL,
      adults INTEGER NOT NULL,
      child_ages_json TEXT NOT NULL,
      large_bags INTEGER NOT NULL,
      small_bags INTEGER NOT NULL,
      pickup_at TEXT NOT NULL,
      car_type TEXT,
      traveler_price REAL NOT NULL,
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed open_requests.json if not present
  try {
    const openRequests = loadOpenRequests();
    if (Array.isArray(openRequests) && openRequests.length > 0) {
      const insertStmt = database.prepare(`
        INSERT OR IGNORE INTO ride_requests (
          id, traveler_name, flight_id, hotel_id, adults, child_ages_json,
          large_bags, small_bags, pickup_at, car_type, traveler_price, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = database.transaction((requests) => {
        for (const req of requests) {
          insertStmt.run(
            req.request_id,
            req.traveler_name || 'Traveler',
            req.flight_id,
            req.hotel_id,
            req.adults,
            JSON.stringify(req.child_ages || []),
            req.large_bags,
            req.small_bags,
            req.pickup,
            req.car_type || null,
            req.price_inr,
            'open'
          );
        }
      });

      insertMany(openRequests);
      console.log(`[Database] Initial open requests verified/seeded.`);
    }
  } catch (err) {
    console.warn(`[Database] Seeding initial open requests failed or skipped:`, err.message);
  }

  console.log('[Database] Database initialized successfully.');
  return database;
}

function getDatabase() {
  if (!db) {
    return connectDatabase();
  }
  return db;
}

module.exports = {
  connectDatabase,
  initializeDatabase,
  getDatabase,
};

