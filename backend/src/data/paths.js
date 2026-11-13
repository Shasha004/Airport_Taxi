const path = require('path');
const fs = require('fs');

let candidateDataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : null;

if (!candidateDataDir || !fs.existsSync(candidateDataDir)) {
  const tryPath1 = path.resolve(__dirname, '../../../data');
  const tryPath2 = path.resolve(__dirname, '../../data');
  if (fs.existsSync(tryPath1)) {
    candidateDataDir = tryPath1;
  } else if (fs.existsSync(tryPath2)) {
    candidateDataDir = tryPath2;
  } else {
    candidateDataDir = tryPath1;
  }
}

const DATA_DIR = candidateDataDir;

module.exports = {
  DATA_DIR,
  flightsPath: path.join(DATA_DIR, 'catalog', 'flights.json'),
  hotelsPath: path.join(DATA_DIR, 'catalog', 'hotels.json'),
  airportsPath: path.join(DATA_DIR, 'catalog', 'airports.json'),
  routesPath: path.join(DATA_DIR, 'problem-2', 'routes.json'),
  taxiCompaniesPath: path.join(DATA_DIR, 'problem-2', 'taxi_companies.json'),
  bookedRidesPath: path.join(DATA_DIR, 'problem-2', 'booked_rides.json'),
  openRequestsPath: path.join(DATA_DIR, 'problem-2', 'open_requests.json'),
};
