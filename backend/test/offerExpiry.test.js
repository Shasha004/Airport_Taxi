const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'airport-taxi-expiry-'));
const testDbPath = path.join(tempDir, 'offers.sqlite');
process.env.DB_PATH = testDbPath;

const Database = require('better-sqlite3');
const { loadAllData } = require('../src/data/loader');
const { getDatabase, initializeDatabase } = require('../src/config/database');

loadAllData();
initializeDatabase();

const app = require('../src/app');
const bookingRepo = require('../src/repositories/booking.repository');
const offerRepo = require('../src/repositories/offer.repository');
const rideRequestRepo = require('../src/repositories/rideRequest.repository');
const bookingService = require('../src/services/booking.service');
const offerExpiryService = require('../src/services/offerExpiry.service');
const offerService = require('../src/services/offer.service');
const { startOfferExpiryWorker } = require('../src/services/offerExpiryWorker');
const { validateExpiryDuration } = require('../src/validators/offer.validator');

function createRequest(id, pickupAt = '2027-04-12T10:15:00') {
  return rideRequestRepo.create({
    id,
    travelerId: `TRV-${id.slice(-3)}`,
    travelerName: `Expiry Test ${id}`,
    flightId: 'FL-501',
    hotelId: 'HTL-OSA-001',
    adults: 2,
    childAges: [],
    largeBags: 2,
    smallBags: 2,
    pickupTime: pickupAt,
    travelerPrice: 9000,
    carType: 'SEDAN',
    status: 'open',
  });
}

function createRawOffer(id, requestId, status, expiresAt) {
  return offerRepo.create({
    id,
    requestId,
    supplierId: 'TX-JP-06',
    carId: 'KN-2',
    offerPrice: 9000,
    status,
    expiresAt,
    expiryMinutes: 5,
  });
}

async function runOfferExpiryTests() {
  let server;
  let worker;

  try {
    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const apiResponse = await fetch(`${baseUrl}/api/offers/requests/REQ-0002`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierId: 'TX-JP-06',
        carId: 'KN-1',
        offerPrice: 9000,
        expiryMinutes: 10,
      }),
    });
    const apiBody = await apiResponse.json();
    assert.strictEqual(apiResponse.status, 201);
    assert.strictEqual(apiBody.data.expiryMinutes, 10);
    assert.ok(Date.parse(apiBody.data.expiresAt) > Date.now());
    assert.strictEqual(offerRepo.findById(apiBody.data.id).expiresAt, apiBody.data.expiresAt);
    console.log('✓ API saves the selected duration and UTC expiry timestamp');

    const invalidResponse = await fetch(`${baseUrl}/api/offers/requests/REQ-0002`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierId: 'TX-JP-06',
        carId: 'KN-2',
        offerPrice: 9000,
        expiryMinutes: 7,
      }),
    });
    assert.strictEqual(invalidResponse.status, 400);
    assert.match((await invalidResponse.json()).error, /Expiry must be 5, 10, 15, 30 or 60/);
    assert.throws(() => validateExpiryDuration(0), /Expiry must be/);
    console.log('✓ Invalid expiry durations are rejected');

    const defaultRequest = createRequest('REQ-EXP-DEFAULT');
    const defaultStart = Date.now();
    const defaultOffer = offerService.assignCarAndPrice(
      defaultRequest.id, 'TX-JP-06', 'KN-2', 9000
    );
    const defaultEnd = Date.now();
    assert.strictEqual(defaultOffer.expiryMinutes, 15);
    assert.ok(Date.parse(defaultOffer.expiresAt) >= defaultStart + 15 * 60 * 1000);
    assert.ok(Date.parse(defaultOffer.expiresAt) <= defaultEnd + 15 * 60 * 1000);
    console.log('✓ Legacy offer submissions receive the 15-minute default');

    const bookingRequest = createRequest('REQ-EXP-BOOK');
    const bookingStart = new Date();
    const bookableOffer = offerService.assignCarAndPrice(
      bookingRequest.id, 'TX-JP-06', 'KN-1', 9000, 5, bookingStart
    );
    const booking = bookingService.bookOffer(
      bookableOffer.id,
      new Date(bookingStart.getTime() + 4 * 60 * 1000)
    );
    assert.strictEqual(booking.status, 'confirmed');
    assert.strictEqual(offerRepo.findById(bookableOffer.id).status, 'booked');
    console.log('✓ Booking before the deadline succeeds and preserves booked status');

    const expiredRequest = createRequest('REQ-EXP-LATE');
    const expiryStart = new Date();
    const expiredOffer = offerService.assignCarAndPrice(
      expiredRequest.id, 'TX-JP-06', 'KN-2', 9000, 5, expiryStart
    );
    assert.throws(
      () => bookingService.bookOffer(expiredOffer.id, new Date(expiryStart.getTime() + 5 * 60 * 1000)),
      error => error.statusCode === 409 && /expired/i.test(error.message)
    );
    assert.strictEqual(offerRepo.findById(expiredOffer.id).status, 'expired');
    assert.strictEqual(
      getDatabase().prepare('SELECT COUNT(*) AS count FROM bookings WHERE offer_id = ?').get(expiredOffer.id).count,
      0
    );
    console.log('✓ Booking at the expiry deadline is rejected and creates no booking');

    const atomicRequest = createRequest('REQ-EXP-ATOMIC');
    const atomicOffer = createRawOffer(
      'OFFER-EXP-ATOMIC',
      atomicRequest.id,
      'assigned',
      new Date(Date.now() - 1000).toISOString()
    );
    assert.throws(
      () => bookingRepo.saveBookingTransaction(
        { id: 'BOOK-EXP-ATOMIC', bookingNumber: '9999999999' },
        atomicOffer.id,
        atomicRequest.id,
        new Date().toISOString()
      ),
      error => error.statusCode === 409 && /expired/i.test(error.message)
    );
    assert.strictEqual(offerRepo.findById(atomicOffer.id).status, 'expired');
    assert.strictEqual(
      getDatabase().prepare('SELECT COUNT(*) AS count FROM bookings WHERE offer_id = ?').get(atomicOffer.id).count,
      0
    );
    console.log('✓ Transaction rechecks expiry immediately before booking writes');

    const protectedStatuses = ['booked', 'rejected', 'not_chosen'];
    const now = new Date();
    const pastDeadline = new Date(now.getTime() - 60_000).toISOString();
    const assignedRequest = createRequest('REQ-EXP-WORK');
    createRawOffer('OFFER-EXP-ASSIGNED', assignedRequest.id, 'assigned', pastDeadline);
    for (const status of protectedStatuses) {
      const request = createRequest(`REQ-EXP-${status.toUpperCase()}`);
      createRawOffer(`OFFER-EXP-${status.toUpperCase()}`, request.id, status, pastDeadline);
    }

    assert.ok(offerExpiryService.expireOffers(now) > 0);
    assert.strictEqual(offerRepo.findById('OFFER-EXP-ASSIGNED').status, 'expired');
    for (const status of protectedStatuses) {
      assert.strictEqual(offerRepo.findById(`OFFER-EXP-${status.toUpperCase()}`).status, status);
    }
    console.log('✓ Expiry worker updates assigned offers only');

    const workerRequest = createRequest('REQ-EXP-TIMER');
    const workerOffer = createRawOffer(
      'OFFER-EXP-TIMER',
      workerRequest.id,
      'assigned',
      new Date(Date.now() + 1500).toISOString()
    );
    worker = startOfferExpiryWorker();
    await new Promise(resolve => setTimeout(resolve, 5500));
    assert.strictEqual(offerRepo.findById(workerOffer.id).status, 'expired');
    console.log('✓ Background worker expires offers automatically');

    const listedResponse = await fetch(`${baseUrl}/api/offers/requests/${expiredRequest.id}`);
    const listedBody = await listedResponse.json();
    assert.strictEqual(listedResponse.status, 200);
    assert.ok(listedBody.data.some(offer => offer.id === expiredOffer.id && offer.status === 'expired'));
    console.log('✓ Offer listing reflects persisted expiration status');

    const legacyDbPath = path.join(tempDir, 'legacy.sqlite');
    const legacyDb = new Database(legacyDbPath);
    legacyDb.exec(`
      CREATE TABLE offers (
        id TEXT PRIMARY KEY,
        request_id TEXT NOT NULL,
        supplier_id TEXT NOT NULL,
        car_id TEXT NOT NULL,
        offer_price REAL NOT NULL,
        status TEXT DEFAULT 'assigned',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO offers (id, request_id, supplier_id, car_id, offer_price, status, created_at)
      VALUES ('OLD-OFFER', 'REQ-OLD', 'TX-JP-06', 'KN-1', 9000, 'assigned', '2026-01-01 10:00:00');
    `);
    legacyDb.close();

    const configPath = path.resolve(__dirname, '../src/config/database.js');
    execFileSync(process.execPath, ['-e', `
      const { initializeDatabase } = require(${JSON.stringify(configPath)});
      initializeDatabase();
    `], {
      cwd: path.resolve(__dirname, '../..'),
      env: { ...process.env, DB_PATH: legacyDbPath },
      stdio: 'ignore',
    });
    const migratedDb = new Database(legacyDbPath);
    const migratedOffer = migratedDb.prepare('SELECT * FROM offers WHERE id = ?').get('OLD-OFFER');
    assert.strictEqual(migratedOffer.expiry_minutes, 15);
    assert.ok(Date.parse(migratedOffer.expires_at));
    migratedDb.close();
    console.log('✓ Existing offers tables migrate and receive a backfilled deadline');
  } finally {
    if (worker) clearInterval(worker);
    if (server) await new Promise(resolve => server.close(resolve));
    getDatabase().close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

runOfferExpiryTests().catch(error => {
  console.error('Offer expiry test failed:', error);
  process.exitCode = 1;
});
