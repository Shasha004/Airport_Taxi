const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const catalogRoutes = require('./routes/catalog.routes');
const routeRoutes = require('./routes/route.routes');
const rideRequestRoutes = require('./routes/rideRequest.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Airport Taxi Backend', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/catalog', catalogRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/ride-requests', rideRequestRoutes);

// Serve static frontend build if it exists
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // 404 handler for unknown routes if client build is not present
  app.use((req, res, next) => {
    res.status(404).json({
      success: false,
      error: `Route not found: ${req.method} ${req.originalUrl}`
    });
  });
}

// Error handling middleware
app.use(errorHandler);

module.exports = app;
