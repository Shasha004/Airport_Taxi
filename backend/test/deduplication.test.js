const assert = require('assert');
const http = require('http');
const app = require('../src/app');
const { getDatabase } = require('../src/config/database');
const rideRequestRepo = require('../src/repositories/rideRequest.repository');
const offerRepo = require('../src/repositories/offer.repository');

async function runDeduplicationTests() {
  console.log('\n--- Starting Double-Click & Deduplication Tests ---');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  async function request(path, options = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    return { status: res.status, body };
  }

  try {
    // 1. Traveler Ride Request Deduplication
    console.log('Testing traveler multiple submit clicks (ride request deduplication)...');
    const ridePayload = {
      travelerName: 'Rapid Clicker Traveler',
      flightId: 'FL-401',
      hotelId: 'HTL-TYO-004',
      adults: 2,
      childAges: [5],
      largeBags: 2,
      smallBags: 1,
      pickupTime: '2027-04-10T12:00:00',
      travelerPrice: 13000,
      carType: 'SUV',
    };

    // Simulate 5 simultaneous rapid clicks on "Submit Ride Request"
    const clickPromises = Array.from({ length: 5 }, () =>
      request('/api/ride-requests', {
        method: 'POST',
        body: ridePayload,
      })
    );

    const responses = await Promise.all(clickPromises);
    responses.forEach((res) => {
      assert.strictEqual(res.status, 201, 'Every submission call should succeed');
      assert.ok(res.body.data && res.body.data.id, 'Response should contain request data');
    });

    // Verify all 5 responses return the EXACT SAME request ID
    const firstId = responses[0].body.data.id;
    for (let i = 1; i < responses.length; i++) {
      assert.strictEqual(
        responses[i].body.data.id,
        firstId,
        `Duplicate click #${i + 1} must return identical request ID (${firstId})`
      );
    }
    console.log(`✓ 5 concurrent clicks returned single identical request ID: ${firstId}`);

    // Verify database only has ONE ride request for this traveler/trip
    const allMatching = rideRequestRepo.findAll({ travelerName: 'Rapid Clicker Traveler' });
    assert.strictEqual(
      allMatching.length,
      1,
      `Database must contain exactly 1 ride request, found ${allMatching.length}`
    );
    console.log('✓ Database verified: exactly 1 ride request stored despite 5 clicks');

    // 2. Supplier Offer Deduplication
    console.log('\nTesting supplier multiple submit clicks (offer deduplication)...');
    const offerPayloadSakura = {
      supplierId: 'TX-JP-01',
      carId: 'SC-3', // Sakura SUV
      price: 13200,
    };

    // Simulate 5 simultaneous rapid clicks on "Submit Offer to Traveler"
    const offerClickPromises = Array.from({ length: 5 }, () =>
      request(`/api/offers/requests/${firstId}`, {
        method: 'POST',
        body: offerPayloadSakura,
      })
    );

    const offerResponses = await Promise.all(offerClickPromises);
    offerResponses.forEach((res) => {
      assert.strictEqual(res.status, 201, 'Every offer call should succeed');
      assert.ok(res.body.data && res.body.data.id, 'Response should contain offer data');
    });

    // Verify all 5 offer responses return the EXACT SAME offer ID
    const firstOfferId = offerResponses[0].body.data.id;
    for (let i = 1; i < offerResponses.length; i++) {
      assert.strictEqual(
        offerResponses[i].body.data.id,
        firstOfferId,
        `Duplicate click #${i + 1} must return identical offer ID (${firstOfferId})`
      );
    }
    console.log(`✓ 5 concurrent clicks returned single identical offer ID: ${firstOfferId}`);

    // Verify that retrieving offers for the request returns exactly 1 offer from Sakura Cabs
    const getOffersRes = await request(`/api/offers/requests/${firstId}`);
    assert.strictEqual(getOffersRes.status, 200);
    const sakuraOffers = getOffersRes.body.data.filter((o) => o.supplierId === 'TX-JP-01');
    assert.strictEqual(
      sakuraOffers.length,
      1,
      `Must reflect only 1 offer from Sakura Cabs, found ${sakuraOffers.length}`
    );
    console.log('✓ GET /api/offers/requests verified: exactly 1 offer reflects for supplier');

    // 3. Different Supplier Can Still Submit Offer
    const offerPayloadTokyoExp = {
      supplierId: 'TX-JP-03',
      carId: 'EP-2', // Tokyo Express SUV
      price: 12900,
    };
    const tokyoExpRes = await request(`/api/offers/requests/${firstId}`, {
      method: 'POST',
      body: offerPayloadTokyoExp,
    });
    assert.strictEqual(tokyoExpRes.status, 201);

    const updatedOffersRes = await request(`/api/offers/requests/${firstId}`);
    assert.strictEqual(updatedOffersRes.body.count, 2, 'Should have 1 offer from each distinct supplier');
    console.log('✓ Multiple distinct suppliers each reflect exactly 1 offer without duplicates');

    console.log('\n======================================');
    console.log('ALL DEDUPLICATION TESTS PASSED!');
    console.log('======================================\n');
  } finally {
    server.close();
  }
}

runDeduplicationTests().catch((err) => {
  console.error('Deduplication test failed:', err);
  process.exit(1);
});
