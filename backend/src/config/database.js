/**
 * Pure JavaScript Database Engine (Zero C++ dependency, Windows-native compatible).
 * Persists data to JSON file while mimicking standard DB prepared statements.
 */
const path = require('path');
const fs = require('fs');
const { loadOpenRequests } = require('../data/loader');

class PureJSDatabase {
  constructor(storagePath) {
    this.storagePath = storagePath;
    this.tables = {
      ride_requests: []
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf-8');
        this.tables = JSON.parse(raw);
        if (!this.tables.ride_requests) this.tables.ride_requests = [];
      }
    } catch (e) {
      console.warn('[Database] Initializing empty storage:', e.message);
      this.tables = { ride_requests: [] };
    }
  }

  save() {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.storagePath, JSON.stringify(this.tables, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Database] Failed to save storage file:', e.message);
    }
  }

  exec(sql) {
    // No-op for schema creates since tables are in-memory JS arrays
    return this;
  }

  pragma(sql) {
    return this;
  }

  transaction(fn) {
    return (data) => {
      const res = fn(data);
      this.save();
      return res;
    };
  }

  prepare(sql) {
    const trimmed = sql.trim();
    const upper = trimmed.toUpperCase();
    const self = this;

    // 1. INSERT INTO ride_requests
    if (upper.startsWith('INSERT')) {
      return {
        run(...params) {
          // Flat params or array
          const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          const [
            id, traveler_name, flight_id, hotel_id, adults, child_ages_json,
            large_bags, small_bags, pickup_at, car_type, traveler_price, status
          ] = args;

          const existingIdx = self.tables.ride_requests.findIndex((r) => r.id === id);
          const record = {
            id,
            traveler_name: traveler_name || 'Traveler',
            flight_id,
            hotel_id,
            adults: Number(adults) || 1,
            child_ages_json: child_ages_json || '[]',
            large_bags: Number(large_bags) || 0,
            small_bags: Number(small_bags) || 0,
            pickup_at: pickup_at || '',
            car_type: car_type || null,
            traveler_price: Number(traveler_price) || 0,
            status: status || 'open',
            created_at: new Date().toISOString()
          };

          if (existingIdx >= 0) {
            if (!upper.includes('IGNORE')) {
              self.tables.ride_requests[existingIdx] = record;
            }
          } else {
            self.tables.ride_requests.unshift(record);
          }

          self.save();
          return { changes: 1 };
        }
      };
    }

    // 2. SELECT WHERE id = ?
    if (upper.includes('WHERE ID =')) {
      return {
        get(id) {
          return self.tables.ride_requests.find((r) => r.id === id) || null;
        }
      };
    }

    // 3. SELECT WHERE status = 'open'
    if (upper.includes("WHERE STATUS = 'OPEN'") || upper.includes('WHERE STATUS = "OPEN"')) {
      return {
        all() {
          return self.tables.ride_requests
            .filter((r) => r.status && r.status.toLowerCase() === 'open')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
      };
    }

    // 4. Default SELECT * FROM ride_requests
    if (upper.startsWith('SELECT')) {
      return {
        all() {
          return [...self.tables.ride_requests].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
        },
        get(id) {
          if (id) {
            return self.tables.ride_requests.find((r) => r.id === id) || null;
          }
          return self.tables.ride_requests[0] || null;
        }
      };
    }

    // Fallback
    return {
      run() { return { changes: 0 }; },
      get() { return null; },
      all() { return []; }
    };
  }
}

let dbInstance = null;

function connectDatabase(dbPath) {
  if (dbInstance) return dbInstance;
  const resolvedPath = dbPath || process.env.DB_PATH || path.resolve(__dirname, '../../airport_taxi_db.json');
  dbInstance = new PureJSDatabase(resolvedPath);
  return dbInstance;
}

function initializeDatabase(dbPath) {
  const db = connectDatabase(dbPath);

  // Seed open_requests.json if empty
  try {
    if (db.tables.ride_requests.length === 0) {
      const openRequests = loadOpenRequests();
      if (Array.isArray(openRequests) && openRequests.length > 0) {
        for (const req of openRequests) {
          db.prepare('INSERT OR IGNORE INTO ride_requests').run([
            req.request_id || req.id || 'REQ-1001',
            req.traveler_name || 'Menon family',
            req.flight_id || 'FL-401',
            req.hotel_id || 'HTL-TYO-004',
            req.adults || 2,
            JSON.stringify(req.child_ages || [6]),
            req.large_bags ?? 3,
            req.small_bags ?? 2,
            req.pickup || '2027-04-10T11:30:00',
            req.car_type || 'SEDAN',
            req.price_inr ?? 12000,
            'open'
          ]);
        }
        console.log(`[Database] Initial open requests seeded (${openRequests.length} requests).`);
      }
    }
  } catch (err) {
    console.warn('[Database] Seeding initial open requests warning:', err.message);
  }

  console.log('[Database] Pure JS database engine initialized successfully.');
  return db;
}

function getDatabase() {
  if (!dbInstance) {
    return connectDatabase();
  }
  return dbInstance;
}

module.exports = {
  connectDatabase,
  initializeDatabase,
  getDatabase,
};
