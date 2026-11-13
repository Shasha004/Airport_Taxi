const { getDatabase } = require('../config/database');

function formatRequest(row) {
  if (!row) return null;
  let childAges = [];
  try {
    childAges = row.child_ages_json ? JSON.parse(row.child_ages_json) : [];
  } catch (e) {
    childAges = [];
  }

  const travelerId = row.traveler_id || `TRV-${(row.id || '').replace(/\D/g, '').slice(-3) || '001'}`;

  return {
    id: row.id,
    requestId: row.id,
    travelerId: travelerId,
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
    traveler_id: travelerId,
    traveler_name: row.traveler_name || 'Traveler',
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
    const travelerId = request.travelerId || request.traveler_id || `TRV-${Math.floor(100 + Math.random() * 900)}`;
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
        id, traveler_id, traveler_name, flight_id, hotel_id, adults, child_ages_json,
        large_bags, small_bags, pickup_at, car_type, traveler_price, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      travelerId,
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

  findAll(filters = {}) {
    const db = getDatabase();
    let query = 'SELECT * FROM ride_requests WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.travelerId) {
      query += ' AND LOWER(traveler_id) = ?';
      params.push(filters.travelerId.trim().toLowerCase());
    }
    if (filters.travelerName) {
      query += ' AND LOWER(traveler_name) LIKE ?';
      params.push(`%${filters.travelerName.trim().toLowerCase()}%`);
    }

    query += ' ORDER BY created_at DESC';
    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    return rows.map(formatRequest);
  }

  findOpenRequests() {
    return this.findAll({ status: 'open' });
  }

  getDistinctTravelers() {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT
        COALESCE(traveler_id, 'TRV-' || SUBSTR(id, -4)) as travelerId,
        traveler_name as travelerName,
        COUNT(id) as count
      FROM ride_requests
      WHERE traveler_name IS NOT NULL
      GROUP BY travelerId, travelerName
      ORDER BY travelerId ASC
    `).all();
    return rows;
  }

  updateFlightAndPickup(id, flightId, pickupAt) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE ride_requests
      SET flight_id = ?, pickup_at = ?
      WHERE id = ?
    `);
    stmt.run(flightId, pickupAt, id);
    return this.findById(id);
  }

  update(id, fields = {}) {
    const db = getDatabase();
    const setClauses = [];
    const params = [];

    if (fields.flightId || fields.flight_id) {
      setClauses.push('flight_id = ?');
      params.push(fields.flightId || fields.flight_id);
    }
    if (fields.pickupAt || fields.pickup_at || fields.pickupTime) {
      setClauses.push('pickup_at = ?');
      params.push(fields.pickupAt || fields.pickup_at || fields.pickupTime);
    }
    if (fields.status) {
      setClauses.push('status = ?');
      params.push(fields.status);
    }
    if (fields.travelerPrice || fields.traveler_price) {
      setClauses.push('traveler_price = ?');
      params.push(fields.travelerPrice || fields.traveler_price);
    }

    if (setClauses.length === 0) return this.findById(id);

    params.push(id);
    const query = `UPDATE ride_requests SET ${setClauses.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...params);
    return this.findById(id);
  }
}

module.exports = new RideRequestRepository();
