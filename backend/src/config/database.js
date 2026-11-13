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
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  return db;
}

function initializeDatabase(dbPath) {
  const database = connectDatabase(dbPath);

  // Table 1: ride_requests (from Part 1)
  database.exec(`
    CREATE TABLE IF NOT EXISTS ride_requests (
      id TEXT PRIMARY KEY,
      traveler_id TEXT,
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

  // Migration: ensure traveler_id column exists
  try {
    database.exec(`ALTER TABLE ride_requests ADD COLUMN traveler_id TEXT;`);
  } catch (e) {
    // Column already exists, safe to ignore
  }

  // Backfill traveler_id for known records
  try {
    database.exec(`
      UPDATE ride_requests SET traveler_id = 'TRV-001' WHERE (traveler_id IS NULL OR traveler_id = '') AND traveler_name = 'Kavya Rao';
      UPDATE ride_requests SET traveler_id = 'TRV-002' WHERE (traveler_id IS NULL OR traveler_id = '') AND traveler_name = 'Arjun and Meera';
      UPDATE ride_requests SET traveler_id = 'TRV-003' WHERE (traveler_id IS NULL OR traveler_id = '') AND traveler_name = 'Iyer family';
      UPDATE ride_requests SET traveler_id = 'TRV-004' WHERE (traveler_id IS NULL OR traveler_id = '') AND traveler_name = 'Menon family';
      UPDATE ride_requests SET traveler_id = 'TRV-005' WHERE (traveler_id IS NULL OR traveler_id = '') AND traveler_name = 'Menon family P2';
      UPDATE ride_requests SET traveler_id = 'TRV-006' WHERE (traveler_id IS NULL OR traveler_id = '') AND id = 'REQ-70625337';
      UPDATE ride_requests SET traveler_id = 'TRV-007' WHERE (traveler_id IS NULL OR traveler_id = '') AND id = 'REQ-81268979';
      UPDATE ride_requests SET traveler_id = 'TRV-' || SUBSTR(REPLACE(id, 'REQ-', ''), -4) WHERE traveler_id IS NULL OR traveler_id = '';
    `);
  } catch (e) {
    // ignore
  }

  // Table 2: offers (Part 2)
  database.exec(`
    CREATE TABLE IF NOT EXISTS offers (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      supplier_id TEXT NOT NULL,
      car_id TEXT NOT NULL,
      offer_price REAL NOT NULL,
      status TEXT DEFAULT 'assigned',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES ride_requests(id)
    );
  `);

  // Table 3: bookings (Part 2)
  database.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      booking_number TEXT UNIQUE NOT NULL,
      request_id TEXT NOT NULL,
      offer_id TEXT NOT NULL,
      supplier_id TEXT NOT NULL,
      car_id TEXT NOT NULL,
      flight_id TEXT NOT NULL,
      hotel_id TEXT NOT NULL,
      pickup_at TEXT NOT NULL,
      drive_minutes INTEGER NOT NULL,
      price REAL NOT NULL,
      status TEXT DEFAULT 'confirmed',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES ride_requests(id),
      FOREIGN KEY (offer_id) REFERENCES offers(id)
    );
  `);

  // Table 4: change_requests (Part 2)
  database.exec(`
    CREATE TABLE IF NOT EXISTS change_requests (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      new_flight_id TEXT,
      new_pickup_at TEXT,
      status TEXT DEFAULT 'pending',
      supplier_response TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    );
  `);

  // Seed open_requests.json if not present
  try {
    const openRequests = loadOpenRequests();
    if (Array.isArray(openRequests) && openRequests.length > 0) {
      const insertStmt = database.prepare(`
        INSERT OR IGNORE INTO ride_requests (
          id, traveler_id, traveler_name, flight_id, hotel_id, adults, child_ages_json,
          large_bags, small_bags, pickup_at, car_type, traveler_price, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = database.transaction((requests) => {
        for (const req of requests) {
          const travelerId = req.traveler_id || `TRV-${(req.request_id || '').replace(/\D/g, '').slice(-3) || '001'}`;
          insertStmt.run(
            req.request_id,
            travelerId,
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

  console.log('[Database] Database initialized successfully with Part 1 and Part 2 tables.');
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
  get db() {
    return getDatabase();
  }
};
