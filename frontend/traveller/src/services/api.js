/**
 * API Service layer for Traveler Portal.
 * Connects directly to the Express backend running on http://localhost:5000/api
 * (forwarded via Vite proxy '/api') with full catalog and ride-request endpoints.
 */

const API_BASE = '/api';

// Fallback mock catalogs if backend is unreachable
const fallbackAirports = [
  { id: 'NRT', name: 'Narita International Airport', city: 'Tokyo', serves_cities: ['Tokyo', 'Yokohama'] },
  { id: 'HND', name: 'Haneda Airport', city: 'Tokyo', serves_cities: ['Tokyo', 'Yokohama', 'Kawasaki'] }
];

const fallbackFlights = [
  { id: 'FL-401', flight_number: 'FL-401', airline: 'Air India', from: 'BLR', to: 'NRT', arrival_local: '2027-04-10T10:30:00' },
  { id: 'FL-220', flight_number: 'FL-220', airline: 'ANA', from: 'SIN', to: 'HND', arrival_local: '2027-04-11T14:05:00' },
  { id: 'FL-777', flight_number: 'FL-777', airline: 'JAL', from: 'LHR', to: 'NRT', arrival_local: '2027-04-12T09:15:00' }
];

const fallbackHotels = [
  { id: 'HTL-TYO-004', name: 'Ueno Garden Inn', city: 'Tokyo', area: 'Ueno', rating: 4.2 },
  { id: 'HTL-TYO-010', name: 'Shinjuku Sky Hotel', city: 'Tokyo', area: 'Shinjuku', rating: 4.5 },
  { id: 'HTL-TYO-022', name: 'Ginza Pearl Suites', city: 'Tokyo', area: 'Ginza', rating: 4.7 }
];

/**
 * Fetch Flights Catalog
 */
export async function getFlights() {
  try {
    const res = await fetch(`${API_BASE}/catalog/flights`);
    if (res.ok) {
      const json = await res.json();
      const list = json.data || json;
      return list.map((f) => ({
        id: f.flight_id || f.id,
        flight_number: f.flight_number || f.flightNumber,
        airline: f.airline,
        from: f.from,
        to: f.to,
        arrival_local: f.arrival_local || f.arrivalLocal
      }));
    }
  } catch (err) {
    console.warn('[API] Could not fetch flights from backend, using fallback:', err.message);
  }
  return fallbackFlights;
}

/**
 * Fetch Hotels Catalog
 */
export async function getHotels() {
  try {
    const res = await fetch(`${API_BASE}/catalog/hotels`);
    if (res.ok) {
      const json = await res.json();
      const list = json.data || json;
      return list.map((h) => ({
        id: h.hotel_id || h.id,
        name: h.name,
        city: h.city,
        area: h.area,
        rating: h.rating || 4.2
      }));
    }
  } catch (err) {
    console.warn('[API] Could not fetch hotels from backend, using fallback:', err.message);
  }
  return fallbackHotels;
}

/**
 * Fetch Airports Catalog
 */
export async function getAirports() {
  try {
    const res = await fetch(`${API_BASE}/catalog/airports`);
    if (res.ok) {
      const json = await res.json();
      return json.data || json;
    }
  } catch (err) {
    console.warn('[API] Could not fetch airports from backend, using fallback:', err.message);
  }
  return fallbackAirports;
}

/**
 * Fetch Route Distance, Drive Time, and Allowed Price Range (Rule R3)
 */
export async function getPriceRange(flightId, hotelId) {
  try {
    const res = await fetch(`${API_BASE}/routes/price-range?flightId=${encodeURIComponent(flightId)}&hotelId=${encodeURIComponent(hotelId)}`);
    if (res.ok) {
      const json = await res.json();
      const data = json.data || json;
      const distance = data.distance_km ?? data.distanceKm ?? data.route?.distance_km ?? 73.3;
      const driveMins = data.drive_minutes ?? data.driveMinutes ?? data.route?.drive_minutes ?? 90;
      const minP = data.price_min_inr ?? data.priceMinInr ?? data.minPrice ?? 10200;
      const maxP = data.price_max_inr ?? data.priceMaxInr ?? data.maxPrice ?? 16800;

      return {
        ok: true,
        distance_km: distance,
        drive_minutes: driveMins,
        price_min_inr: minP,
        price_max_inr: maxP
      };
    } else {
      const errJson = await res.json().catch(() => ({}));
      return { ok: false, error: errJson.error || 'Route not found or incompatible.' };
    }
  } catch (err) {
    console.warn('[API] Could not fetch price range from backend:', err.message);
  }

  // Fallback for Narita to Ueno
  return {
    ok: true,
    distance_km: 73.3,
    drive_minutes: 90,
    price_min_inr: 10200,
    price_max_inr: 16800
  };
}

/**
 * Fetch All Ride Requests from Backend
 */
export async function getRideRequests() {
  try {
    const res = await fetch(`${API_BASE}/ride-requests`);
    if (res.ok) {
      const json = await res.json();
      const list = json.data || json;
      return list.map((r) => ({
        id: r.id || r.requestId,
        travelerName: r.travelerName || r.traveler_name || 'Traveler',
        flightId: r.flightId || r.flight_id,
        hotelId: r.hotelId || r.hotel_id,
        adults: r.adults,
        childAges: r.childAges || r.child_ages || [],
        largeBags: r.largeBags ?? r.large_bags ?? 0,
        smallBags: r.smallBags ?? r.small_bags ?? 0,
        pickupTime: r.pickupTime || r.pickupAt || r.pickup_at,
        travelerPrice: r.travelerPrice ?? r.traveler_price ?? 0,
        carType: r.carType || r.car_type || 'SEDAN',
        status: (r.status || 'OPEN').toUpperCase(),
        bookingCode: r.bookingCode || r.booking_code,
        flight: r.flight ? {
          flight_number: r.flight.flight_number || r.flight.flightNumber,
          airline: r.flight.airline,
          from: r.flight.from,
          to: r.flight.to,
          arrival_local: r.flight.arrival_local || r.flight.arrivalLocal
        } : null,
        hotel: r.hotel ? {
          name: r.hotel.name,
          city: r.hotel.city,
          area: r.hotel.area
        } : null,
        route: r.route ? {
          distance_km: r.route.distance_km || r.route.distanceKm,
          drive_minutes: r.route.drive_minutes || r.route.driveMinutes,
          price_min_inr: r.route.price_min_inr || r.route.priceMinInr,
          price_max_inr: r.route.price_max_inr || r.route.priceMaxInr
        } : null
      }));
    }
  } catch (err) {
    console.warn('[API] Could not fetch ride requests from backend:', err.message);
  }

  return [];
}

/**
 * Submit New Ride Request to Backend POST /api/ride-requests
 */
export async function createRideRequest(payload) {
  try {
    const res = await fetch(`${API_BASE}/ride-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        travelerName: payload.travelerName,
        flightId: payload.flightId,
        hotelId: payload.hotelId,
        adults: Number(payload.adults),
        childAges: payload.childAges || [],
        largeBags: Number(payload.largeBags || 0),
        smallBags: Number(payload.smallBags || 0),
        pickupTime: payload.pickupTime,
        travelerPrice: Number(payload.travelerPrice),
        carType: payload.carType || 'SEDAN'
      })
    });

    const json = await res.json();
    if (res.ok && json.success !== false) {
      return { ok: true, request: json.data };
    } else {
      return { ok: false, error: json.error || (json.errors && json.errors.join(', ')) || 'Failed to create ride request.' };
    }
  } catch (err) {
    return { ok: false, error: `Backend connection error: ${err.message}` };
  }
}

/**
 * Report Flight Delay for a ride request
 */
export async function reportFlightDelay(requestId, payload) {
  try {
    const res = await fetch(`${API_BASE}/ride-requests/${requestId}/delay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (res.ok && json.success !== false) {
      return { ok: true, data: json };
    } else {
      return { ok: false, error: json.error || 'Failed to report flight delay' };
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
