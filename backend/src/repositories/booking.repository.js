const { getDatabase } = require('../config/database');

function formatBooking(row) {
  if (!row) return null;
  return {
    id: row.id,
    bookingNumber: row.booking_number,
    requestId: row.request_id,
    offerId: row.offer_id,
    supplierId: row.supplier_id,
    carId: row.car_id,
    flightId: row.flight_id,
    hotelId: row.hotel_id,
    pickupAt: row.pickup_at,
    driveMinutes: row.drive_minutes,
    price: row.price,
    status: row.status,
    createdAt: row.created_at,
    // Database snake_case mirrors
    booking_number: row.booking_number,
    request_id: row.request_id,
    offer_id: row.offer_id,
    supplier_id: row.supplier_id,
    car_id: row.car_id,
    flight_id: row.flight_id,
    hotel_id: row.hotel_id,
    pickup_at: row.pickup_at,
    drive_minutes: row.drive_minutes,
    created_at: row.created_at,
  };
}

class BookingRepository {
  findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM bookings WHERE id = ?');
    const row = stmt.get(id);
    return formatBooking(row);
  }

  findByBookingNumber(bookingNumber) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM bookings WHERE booking_number = ?');
    const row = stmt.get(bookingNumber);
    return formatBooking(row);
  }

  findBySupplierId(supplierId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM bookings WHERE supplier_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(supplierId);
    return rows.map(formatBooking);
  }

  findByRequestId(requestId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM bookings WHERE request_id = ?');
    const row = stmt.get(requestId);
    return formatBooking(row);
  }

  saveBookingTransaction(booking, offerId, requestId, now = new Date().toISOString()) {
    const db = getDatabase();

    const transaction = db.transaction(() => {
      const offer = db.prepare('SELECT status, expires_at FROM offers WHERE id = ?').get(offerId);
      if (!offer) {
        return { error: 'not_found' };
      }
      if (offer.status !== 'assigned') {
        return { error: 'unavailable', status: offer.status };
      }

      const expiryTime = Date.parse(offer.expires_at);
      const currentTime = Date.parse(now);
      if (!Number.isFinite(expiryTime) || !Number.isFinite(currentTime) || expiryTime <= currentTime) {
        db.prepare(`
          UPDATE offers
          SET status = 'expired', expired_at = ?
          WHERE id = ? AND status = 'assigned'
        `).run(now, offerId);
        return { error: 'expired' };
      }

      const request = db.prepare('SELECT status FROM ride_requests WHERE id = ?').get(requestId);
      if (!request || request.status !== 'open') {
        return { error: 'request_unavailable', status: request?.status };
      }

      const claim = db.prepare(`
        UPDATE offers
        SET status = 'booked'
        WHERE id = ? AND status = 'assigned' AND expires_at > ?
      `).run(offerId, now);
      if (claim.changes !== 1) {
        return { error: 'expired' };
      }

      // 1. Insert booking
      db.prepare(`
        INSERT INTO bookings (
          id, booking_number, request_id, offer_id, supplier_id,
          car_id, flight_id, hotel_id, pickup_at, drive_minutes, price, status
        ) VALUES (
          @id, @booking_number, @request_id, @offer_id, @supplier_id,
          @car_id, @flight_id, @hotel_id, @pickup_at, @drive_minutes, @price, @status
        )
      `).run({
        id: booking.id,
        booking_number: booking.bookingNumber || booking.booking_number,
        request_id: requestId,
        offer_id: offerId,
        supplier_id: booking.supplierId || booking.supplier_id,
        car_id: booking.carId || booking.car_id,
        flight_id: booking.flightId || booking.flight_id,
        hotel_id: booking.hotelId || booking.hotel_id,
        pickup_at: booking.pickupAt || booking.pickup_at,
        drive_minutes: booking.driveMinutes || booking.drive_minutes,
        price: booking.price,
        status: booking.status || 'confirmed',
      });

      // Expire competing offers before marking the remaining active ones not chosen.
      db.prepare(`
        UPDATE offers
        SET status = 'expired', expired_at = ?
        WHERE request_id = ? AND status = 'assigned' AND expires_at <= ?
      `).run(now, requestId, now);

      db.prepare(`
        UPDATE offers
        SET status = 'not_chosen'
        WHERE request_id = ? AND id != ? AND status = 'assigned' AND expires_at > ?
      `).run(requestId, offerId, now);

      // Update the request in the same transaction as the booking and offer.
      db.prepare("UPDATE ride_requests SET status = 'booked' WHERE id = ?").run(requestId);
      return { success: true };
    });

    const result = transaction.immediate();
    if (result?.error) {
      const messages = {
        not_found: ['Offer not found.', 404],
        unavailable: [`Offer is no longer available (status: ${result.status}).`, 409],
        expired: ['This offer has expired and cannot be booked.', 409],
        request_unavailable: [`Ride request is no longer open (status: ${result.status || 'not found'}).`, 409],
      };
      const [message, statusCode] = messages[result.error];
      const err = new Error(message);
      err.statusCode = statusCode;
      throw err;
    }

    return this.findById(booking.id);
  }

  updateFlightAndPickup(bookingId, flightId, pickupAt) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE bookings
      SET flight_id = ?, pickup_at = ?
      WHERE id = ?
    `);
    stmt.run(flightId, pickupAt, bookingId);
    return this.findById(bookingId);
  }

  cancelBookingTransaction(bookingId, offerId, requestId) {
    const db = getDatabase();
    const transaction = db.transaction(() => {
      // 1. Mark booking as cancelled
      db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(bookingId);
      // 2. Restore offer to 'assigned' so the request can be re-offered
      db.prepare("UPDATE offers SET status = 'assigned' WHERE id = ?").run(offerId);
      // 3. Restore other offers for this request that were not chosen
      db.prepare("UPDATE offers SET status = 'assigned' WHERE request_id = ? AND status = 'not_chosen'").run(requestId);
      // 4. Re-open the ride request
      db.prepare("UPDATE ride_requests SET status = 'open' WHERE id = ?").run(requestId);
    });
    transaction();
    return this.findById(bookingId);
  }
}

module.exports = new BookingRepository();
