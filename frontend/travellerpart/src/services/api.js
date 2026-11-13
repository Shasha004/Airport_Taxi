/* API layer.
   Tries the real backend at /api. If it is not running, falls back to mock
   data so the traveler module works out of the box for demos. */

const BASE = '/api';
// Backend integration: when ready, replace mock calls below with fetch(BASE + path) and remove delay(...).

// ---------------- Mock data ----------------

const airports = [
  { id: 'NRT', name: 'Narita International Airport', city: 'Tokyo', serves_cities: ['Tokyo', 'Yokohama'] },
  { id: 'HND', name: 'Haneda Airport', city: 'Tokyo', serves_cities: ['Tokyo', 'Yokohama', 'Kawasaki'] }
];

const flights = [
  { id: 'FL-401', flight_number: 'FL-401', airline: 'Air India', from: 'BLR', to: 'NRT', arrival_local: '2027-04-10T10:30:00' },
  { id: 'FL-220', flight_number: 'FL-220', airline: 'ANA', from: 'SIN', to: 'HND', arrival_local: '2027-04-11T14:05:00' },
  { id: 'FL-777', flight_number: 'FL-777', airline: 'JAL', from: 'LHR', to: 'NRT', arrival_local: '2027-04-12T09:15:00' }
];

const hotels = [
  { id: 'HTL-TYO-004', name: 'Ueno Garden Inn', city: 'Tokyo', area: 'Ueno', rating: 4.2 },
  { id: 'HTL-TYO-010', name: 'Shinjuku Sky Hotel', city: 'Tokyo', area: 'Shinjuku', rating: 4.5 },
  { id: 'HTL-TYO-022', name: 'Ginza Pearl Suites', city: 'Tokyo', area: 'Ginza', rating: 4.7 }
];

const routes = [
  { airport: 'NRT', city: 'Tokyo', area: 'Ueno', distance_km: 73.3, drive_minutes: 90, price_min_inr: 10200, price_max_inr: 16800 },
  { airport: 'NRT', city: 'Tokyo', area: 'Shinjuku', distance_km: 85.0, drive_minutes: 100, price_min_inr: 11500, price_max_inr: 18200 },
  { airport: 'HND', city: 'Tokyo', area: 'Ginza', distance_km: 18.5, drive_minutes: 35, price_min_inr: 3200, price_max_inr: 5600 }
];

let rideRequests = [
  {
    id: 'REQ-1001',
    travelerName: 'Menon family',
    flightId: 'FL-401',
    hotelId: 'HTL-TYO-004',
    adults: 2,
    childAges: [6],
    largeBags: 3,
    smallBags: 2,
    pickupTime: '2027-04-10T11:30:00',
    travelerPrice: 12000,
    carType: 'SEDAN',
    status: 'OPEN'
  }
];

// ---------------- Helpers ----------------

function delay(data, ms = 250) {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

function findFlight(id) { return flights.find((f) => f.id === id); }
function findHotel(id) { return hotels.find((h) => h.id === id); }

function enrich(req) {
  const flight = findFlight(req.flightId);
  const hotel = findHotel(req.hotelId);
  const route = routes.find((r) => r.airport === flight?.to && r.area === hotel?.area);
  return { ...req, flight, hotel, route };
}

// ---------------- Public API ----------------

export async function getFlights() {
  return delay(flights);
}

export async function getHotels() {
  return delay(hotels);
}

export async function getAirports() {
  return delay(airports);
}

export async function getPriceRange(flightId, hotelId) {
  const flight = findFlight(flightId);
  const hotel = findHotel(hotelId);
  if (!flight || !hotel) {
    return { ok: false, error: 'Flight or hotel not found (R1).' };
  }
  const airport = airports.find((a) => a.id === flight.to);
  const serves = airport?.serves_cities.includes(hotel.city);
  if (!serves) {
    return { ok: false, error: `Airport ${flight.to} does not serve ${hotel.city}.`, rule: 'R1' };
  }
  const route = routes.find((r) => r.airport === flight.to && r.area === hotel.area);
  if (!route) {
    return { ok: false, error: `No route defined for ${flight.to} -> ${hotel.area}.`, rule: 'R1' };
  }
  return delay({ ok: true, ...route });
}

export async function getRideRequests() {
  return delay(rideRequests.map(enrich));
}

export async function getRideRequest(id) {
  const req = rideRequests.find((r) => r.id === id);
  return req ? delay(enrich(req)) : delay(null);
}

export async function createRideRequest(payload) {
  // Minimal client-side rule checks (R1/R2/R3) before "saving"
  const flight = findFlight(payload.flightId);
  const hotel = findHotel(payload.hotelId);
  if (!flight || !hotel) return delay({ ok: false, error: 'Invalid flight or hotel.' });

  const airport = airports.find((a) => a.id === flight.to);
  if (!airport?.serves_cities.includes(hotel.city)) {
    return delay({ ok: false, error: `Airport ${flight.to} does not serve ${hotel.city}.`, rule: 'R1' });
  }
  if ((payload.adults || 0) < 1) return delay({ ok: false, error: 'At least 1 adult required.', rule: 'R1' });

  const landsAt = new Date(flight.arrival_local).getTime();
  const pickup = new Date(payload.pickupTime).getTime();
  if (pickup - landsAt < 60 * 60 * 1000) {
    return delay({ ok: false, error: 'Pickup must be at least 60 minutes after landing.', rule: 'R2' });
  }

  const route = routes.find((r) => r.airport === flight.to && r.area === hotel.area);
  if (payload.travelerPrice < route.price_min_inr || payload.travelerPrice > route.price_max_inr) {
    return delay({ ok: false, error: `Price must be between ₹${route.price_min_inr} and ₹${route.price_max_inr}.`, rule: 'R3' });
  }

  const id = 'REQ-' + String(1000 + rideRequests.length + 1);
  const saved = { id, ...payload, status: 'OPEN' };
  rideRequests.push(saved);
  return delay({ ok: true, request: enrich(saved) });
}

// Re-export lookups for UI convenience
export { findFlight, findHotel, airports };
