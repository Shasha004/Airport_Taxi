const { getDatabase } = require('../config/database');

function formatChangeRequest(row) {
  if (!row) return null;
  return {
    id: row.id,
    bookingId: row.booking_id,
    newFlightId: row.new_flight_id,
    newPickupAt: row.new_pickup_at,
    status: row.status,
    supplierResponse: row.supplier_response,
    createdAt: row.created_at,
    // Database snake_case mirrors
    booking_id: row.booking_id,
    new_flight_id: row.new_flight_id,
    new_pickup_at: row.new_pickup_at,
    supplier_response: row.supplier_response,
    created_at: row.created_at,
    // Joined booking metadata if present
    bookingNumber: row.booking_number,
    supplierId: row.supplier_id,
    carId: row.car_id,
    currentFlightId: row.current_flight_id,
    currentPickupAt: row.current_pickup_at,
  };
}

class ChangeRequestRepository {
  create(changeReq) {
    const db = getDatabase();
    const id = changeReq.id || `CHG-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;
    const bookingId = changeReq.bookingId || changeReq.booking_id;
    const newFlightId = changeReq.newFlightId || changeReq.new_flight_id || null;
    const newPickupAt = changeReq.newPickupAt || changeReq.new_pickup_at || null;
    const status = changeReq.status || 'pending';
    const supplierResponse = changeReq.supplierResponse || changeReq.supplier_response || null;

    const stmt = db.prepare(`
      INSERT INTO change_requests (id, booking_id, new_flight_id, new_pickup_at, status, supplier_response)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, bookingId, newFlightId, newPickupAt, status, supplierResponse);
    return this.findById(id);
  }

  findById(id) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT cr.*, b.booking_number, b.supplier_id, b.car_id, b.flight_id AS current_flight_id, b.pickup_at AS current_pickup_at
      FROM change_requests cr
      JOIN bookings b ON cr.booking_id = b.id
      WHERE cr.id = ?
    `);
    const row = stmt.get(id);
    return formatChangeRequest(row);
  }

  findByBookingId(bookingId) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT cr.*, b.booking_number, b.supplier_id, b.car_id, b.flight_id AS current_flight_id, b.pickup_at AS current_pickup_at
      FROM change_requests cr
      JOIN bookings b ON cr.booking_id = b.id
      WHERE cr.booking_id = ?
      ORDER BY cr.created_at DESC
    `);
    const rows = stmt.all(bookingId);
    return rows.map(formatChangeRequest);
  }

  findBySupplierId(supplierId) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT cr.*, b.booking_number, b.supplier_id, b.car_id, b.flight_id AS current_flight_id, b.pickup_at AS current_pickup_at
      FROM change_requests cr
      JOIN bookings b ON cr.booking_id = b.id
      WHERE b.supplier_id = ?
      ORDER BY cr.created_at DESC
    `);
    const rows = stmt.all(supplierId);
    return rows.map(formatChangeRequest);
  }

  updateDecision(id, status, supplierResponse) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE change_requests
      SET status = ?, supplier_response = ?
      WHERE id = ?
    `);
    stmt.run(status, supplierResponse || null, id);
    return this.findById(id);
  }

  acceptChangeTransaction(changeRequestId, bookingId, targetFlightId, targetPickupAt, supplierResponse) {
    const db = getDatabase();

    const transaction = db.transaction(() => {
      // 1. Update booking with new flight and pickup
      db.prepare(`
        UPDATE bookings
        SET flight_id = ?, pickup_at = ?
        WHERE id = ?
      `).run(targetFlightId, targetPickupAt, bookingId);

      // 2. Update change request to accepted
      db.prepare(`
        UPDATE change_requests
        SET status = 'accepted', supplier_response = ?
        WHERE id = ?
      `).run(supplierResponse || 'Accepted by supplier', changeRequestId);
    });

    transaction();
    return this.findById(changeRequestId);
  }
}

module.exports = new ChangeRequestRepository();
