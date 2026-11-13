/**
 * API Service layer for Cab Owner Portal.
 * Provides catalog data and ride request dispatch management.
 */

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

// Initial ride request matching the Menon Family scenario from the problem statement
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
    status: 'OPEN',
    assignedSupplier: null,
    assignedCar: null,
    bookingCode: null
  }
];

function delay(data, ms = 150) {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

function findFlight(id) {
  return flights.find((f) => f.id === id);
}

function findHotel(id) {
  return hotels.find((h) => h.id === id);
}

function enrich(req) {
  const flight = findFlight(req.flightId);
  const hotel = findHotel(req.hotelId);
  const route = routes.find((r) => r.airport === flight?.to && r.area === hotel?.area) || {
    distance_km: 73.3,
    drive_minutes: 90,
    price_min_inr: 10200,
    price_max_inr: 16800
  };
  return { ...req, flight, hotel, route };
}

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
    return { ok: false, error: 'Flight or hotel not found (Rule R1).' };
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

export async function dispatchRideRequest(requestId, supplierName, vehicleName, agreedPrice) {
  const idx = rideRequests.findIndex((r) => r.id === requestId);
  if (idx === -1) return delay({ ok: false, error: 'Request not found.' });

  // Generate 10-digit booking number (Rule R8)
  const bookingCode = Math.floor(1000000000 + Math.random() * 9000000000).toString();

  rideRequests[idx] = {
    ...rideRequests[idx],
    status: 'CONFIRMED',
    assignedSupplier: supplierName,
    assignedCar: vehicleName,
    travelerPrice: agreedPrice,
    bookingCode: bookingCode
  };

  return delay({ ok: true, request: enrich(rideRequests[idx]) });
}

export { findFlight, findHotel, airports };
