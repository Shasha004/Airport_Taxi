const fs = require('fs');
const paths = require('./paths');

function readJsonFile(filePath, description) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Data file not found at ${filePath}`);
    }
    const rawData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(rawData);
  } catch (err) {
    console.error(`[Loader] Error loading ${description} from ${filePath}:`, err.message);
    throw err;
  }
}

let cache = {
  flights: null,
  hotels: null,
  airports: null,
  routes: null,
  taxiCompanies: null,
  bookedRides: null,
  openRequests: null,
};

function loadFlights() {
  cache.flights = readJsonFile(paths.flightsPath, 'Flights Catalog');
  return cache.flights;
}

function loadHotels() {
  cache.hotels = readJsonFile(paths.hotelsPath, 'Hotels Catalog');
  return cache.hotels;
}

function loadAirports() {
  cache.airports = readJsonFile(paths.airportsPath, 'Airports Catalog');
  return cache.airports;
}

function loadRoutes() {
  cache.routes = readJsonFile(paths.routesPath, 'Routes Catalog');
  return cache.routes;
}

function loadTaxiCompanies() {
  cache.taxiCompanies = readJsonFile(paths.taxiCompaniesPath, 'Taxi Companies');
  return cache.taxiCompanies;
}

function loadBookedRides() {
  cache.bookedRides = readJsonFile(paths.bookedRidesPath, 'Booked Rides');
  return cache.bookedRides;
}

function loadOpenRequests() {
  cache.openRequests = readJsonFile(paths.openRequestsPath, 'Open Requests');
  return cache.openRequests;
}

function loadAllData() {
  console.log('[Loader] Loading all catalog and problem dataset files...');
  const flights = loadFlights();
  const hotels = loadHotels();
  const airports = loadAirports();
  const routes = loadRoutes();
  const taxiCompanies = loadTaxiCompanies();
  const bookedRides = loadBookedRides();
  const openRequests = loadOpenRequests();
  console.log(`[Loader] Loaded: ${flights.length} flights, ${hotels.length} hotels, ${airports.length} airports, ${routes.length} routes, ${taxiCompanies.length} taxi companies, ${bookedRides.length} booked rides, ${openRequests.length} open requests.`);
  return cache;
}

module.exports = {
  loadFlights,
  loadHotels,
  loadAirports,
  loadRoutes,
  loadTaxiCompanies,
  loadBookedRides,
  loadOpenRequests,
  loadAllData,
  get cache() {
    return cache;
  }
};

