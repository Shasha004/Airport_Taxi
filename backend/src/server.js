require('dotenv').config();
const app = require('./app');
const { initializeDatabase } = require('./config/database');
const { loadAllData } = require('./data/loader');
const { startOfferExpiryWorker } = require('./services/offerExpiryWorker');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('--- Initializing Airport Taxi Server ---');

    // 1. Load catalog and problem data
    loadAllData();

    // 2. Initialize SQLite database and seed initial open requests
    initializeDatabase();

    // 3. Expire offers after the database schema is ready.
    startOfferExpiryWorker();

    // 4. Start Express server
    const server = app.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    return server;
  } catch (err) {
    console.error('[Server] Fatal initialization error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
