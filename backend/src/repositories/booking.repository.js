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

  saveBookingTransaction(booking, offerId, requestId) {
    const db = getDatabase();

    const transaction = db.transaction(() => {
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

      // 2. Mark this offer as booked
      db.prepare("UPDATE offers SET status = 'booked' WHERE id = ?").run(offerId);

      // 3. Mark other assigned offers for this request as not_chosen
      db.prepare(`
        UPDATE offers
        SET status = 'not_chosen'
        WHERE request_id = ? AND id != ? AND status = 'assigned'
      `).run(requestId, offerId);

      // 4. Update request status to booked
      db.prepare("UPDATE ride_requests SET status = 'booked' WHERE id = ?").run(requestId);
    });

    transaction();
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
      // 3. Re-open the ride request
      db.prepare("UPDATE ride_requests SET status = 'open' WHERE id = ?").run(requestId);
    });
    transaction();
    return this.findById(bookingId);
  }
}

module.exports = new BookingRepository();

