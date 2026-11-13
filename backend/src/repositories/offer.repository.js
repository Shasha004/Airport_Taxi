const { getDatabase } = require('../config/database');

function formatOffer(row) {
  if (!row) return null;
  return {
    id: row.id,
    requestId: row.request_id,
    supplierId: row.supplier_id,
    carId: row.car_id,
    offerPrice: row.offer_price,
    status: row.status,
    expiresAt: row.expires_at,
    expiredAt: row.expired_at,
    expiryMinutes: row.expiry_minutes,
    createdAt: row.created_at,
    // Database snake_case mirrors
    request_id: row.request_id,
    supplier_id: row.supplier_id,
    car_id: row.car_id,
    offer_price: row.offer_price,
    expires_at: row.expires_at,
    expired_at: row.expired_at,
    expiry_minutes: row.expiry_minutes,
    created_at: row.created_at,
  };
}

class OfferRepository {
  create(offer) {
    const db = getDatabase();
    const id = offer.id || `OFFER-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 9000)}`;
    const requestId = offer.requestId || offer.request_id;
    const supplierId = offer.supplierId || offer.supplier_id;
    const carId = offer.carId || offer.car_id;
    const offerPrice = Number(offer.offerPrice ?? offer.offer_price);
    const status = offer.status || 'assigned';
    const expiresAt = offer.expiresAt || offer.expires_at;
    const expiredAt = offer.expiredAt || offer.expired_at || null;
    const expiryMinutes = Number(offer.expiryMinutes ?? offer.expiry_minutes ?? 15);

    const stmt = db.prepare(`
      INSERT INTO offers (
        id, request_id, supplier_id, car_id, offer_price, status,
        expires_at, expired_at, expiry_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, requestId, supplierId, carId, offerPrice, status, expiresAt, expiredAt, expiryMinutes);
    return this.findById(id);
  }

  findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM offers WHERE id = ?');
    const row = stmt.get(id);
    return formatOffer(row);
  }

  findByRequestId(requestId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM offers WHERE request_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(requestId);
    return rows.map(formatOffer);
  }

  findBySupplierId(supplierId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM offers WHERE supplier_id = ? ORDER BY created_at DESC');
    const rows = stmt.all(supplierId);
    return rows.map(formatOffer);
  }

  updateStatus(id, status) {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE offers SET status = ? WHERE id = ?');
    stmt.run(status, id);
    return this.findById(id);
  }

  markExpired(id, now = new Date().toISOString()) {
    const db = getDatabase();
    const result = db.prepare(`
      UPDATE offers
      SET status = 'expired', expired_at = ?
      WHERE id = ? AND status = 'assigned' AND expires_at <= ?
    `).run(now, id, now);
    return result.changes;
  }

  expireAssignedOffers(now = new Date().toISOString()) {
    const db = getDatabase();
    const result = db.prepare(`
      UPDATE offers
      SET status = 'expired', expired_at = ?
      WHERE status = 'assigned'
        AND expires_at IS NOT NULL
        AND expires_at <= ?
    `).run(now, now);
    return result.changes;
  }

  markOtherOffersNotChosen(requestId, chosenOfferId) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE offers
      SET status = 'not_chosen'
      WHERE request_id = ? AND id != ? AND status = 'assigned'
    `);
    stmt.run(requestId, chosenOfferId);
  }

  findAssignedByRequestAndSupplierAndCar(requestId, supplierId, carId) {
    const db = getDatabase();
    const stmt = db.prepare(
      "SELECT * FROM offers WHERE request_id = ? AND supplier_id = ? AND car_id = ? AND status = 'assigned' LIMIT 1"
    );
    const row = stmt.get(requestId, supplierId, carId);
    return formatOffer(row);
  }

  updateCarAndPrice(id, carId, offerPrice) {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE offers SET car_id = ?, offer_price = ? WHERE id = ?');
    stmt.run(carId, Number(offerPrice), id);
    return this.findById(id);
  }

  countBySupplier(supplierId) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM offers WHERE supplier_id = ?');
    const row = stmt.get(supplierId);
    return row ? row.count : 0;
  }

  // Count distinct active (assigned) offers for a request so duplicate
  // clicks from a supplier never inflate the number the traveler sees.
  countAssignedByRequestId(requestId) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT DISTINCT supplier_id, car_id FROM offers
        WHERE request_id = ? AND status = 'assigned'
      )
    `);
    const row = stmt.get(requestId);
    return row ? row.count : 0;
  }
}

module.exports = new OfferRepository();

