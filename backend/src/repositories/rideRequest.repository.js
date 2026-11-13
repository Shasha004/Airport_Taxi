const { getDatabase } = require('../config/database');

function formatRequest(row) {
  if (!row) return null;
  let childAges = [];
  try {
    childAges = row.child_ages_json ? JSON.parse(row.child_ages_json) : [];
  } catch (e) {
    childAges = [];
  }

  return {
    id: row.id,
    requestId: row.id,
    travelerName: row.traveler_name || 'Traveler',
    flightId: row.flight_id,
    hotelId: row.hotel_id,
    adults: row.adults,
    childAges: childAges,
    childAgesJson: row.child_ages_json,
    largeBags: row.large_bags,
    smallBags: row.small_bags,
    pickupAt: row.pickup_at,
    pickupTime: row.pickup_at,
    carType: row.car_type || null,
    travelerPrice: row.traveler_price,
    status: row.status,
    createdAt: row.created_at,
    // Database snake_case mirrors for compatibility
    flight_id: row.flight_id,
    hotel_id: row.hotel_id,
    child_ages: childAges,
    child_ages_json: row.child_ages_json,
    large_bags: row.large_bags,
    small_bags: row.small_bags,
    pickup_at: row.pickup_at,
    car_type: row.car_type,
    traveler_price: row.traveler_price,
    created_at: row.created_at,
  };
}

class RideRequestRepository {
  create(request) {
    const db = getDatabase();
    const id = request.id || request.requestId;
    const travelerName = request.travelerName || request.traveler_name || 'Traveler';
    const flightId = request.flightId || request.flight_id;
    const hotelId = request.hotelId || request.hotel_id;
    const adults = Number(request.adults);
    const childAgesJson = typeof request.childAges === 'string'
      ? request.childAges
      : typeof request.child_ages_json === 'string'
      ? request.child_ages_json
      : JSON.stringify(request.childAges || request.child_ages || []);
    const largeBags = Number(request.largeBags ?? request.large_bags ?? 0);
    const smallBags = Number(request.smallBags ?? request.small_bags ?? 0);
    const pickupAt = request.pickupTime || request.pickupAt || request.pickup_at || request.pickup;
    const carType = request.carType || request.car_type || null;
    const travelerPrice = Number(request.travelerPrice ?? request.traveler_price ?? request.price_inr);
    const status = request.status || 'open';

    const stmt = db.prepare(`
      INSERT INTO ride_requests (
        id, traveler_name, flight_id, hotel_id, adults, child_ages_json,
        large_bags, small_bags, pickup_at, car_type, traveler_price, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      travelerName,
      flightId,
      hotelId,
      adults,
      childAgesJson,
      largeBags,
      smallBags,
      pickupAt,
      carType,
      travelerPrice,
      status
    );

    return this.findById(id);
  }

  findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM ride_requests WHERE id = ?');
    const row = stmt.get(id);
    return formatRequest(row);
  }

  findAll() {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM ride_requests ORDER BY created_at DESC');
    const rows = stmt.all();
    return rows.map(formatRequest);
  }

  findOpenRequests() {
    const db = getDatabase();
    const stmt = db.prepare("SELECT * FROM ride_requests WHERE status = 'open' ORDER BY created_at DESC");
    const rows = stmt.all();
    return rows.map(formatRequest);
  }
}

module.exports = new RideRequestRepository();

