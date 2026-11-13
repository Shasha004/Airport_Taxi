const assert = require('assert');
const app = require('../src/app');
const { initializeDatabase } = require('../src/config/database');
const { loadAllData } = require('../src/data/loader');
const http = require('http');

let server;
let baseUrl;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Integration & Rule Tests ---');
  loadAllData();
  initializeDatabase();

  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  try {
    // 1. Health check
    const health = await request('/api/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.body.status, 'ok');
    console.log('✓ Health check passed');

    // 2. Catalog APIs
    const flightsRes = await request('/api/catalog/flights');
    assert.strictEqual(flightsRes.status, 200);
    assert.ok(flightsRes.body.count > 0, 'Flights list should not be empty');
    console.log(`✓ Catalog Flights passed (${flightsRes.body.count} arrival flights)`);

    const hotelsRes = await request('/api/catalog/hotels');
    assert.strictEqual(hotelsRes.status, 200);
    assert.strictEqual(hotelsRes.body.count, 49);
    console.log('✓ Catalog Hotels passed (49 hotels)');

    const airportsRes = await request('/api/catalog/airports');
    assert.strictEqual(airportsRes.status, 200);
    assert.strictEqual(airportsRes.body.count, 10);
    console.log('✓ Catalog Airports passed (10 airports)');

    const suppliersRes = await request('/api/catalog/suppliers');
    assert.strictEqual(suppliersRes.status, 200);
    assert.strictEqual(suppliersRes.body.count, 11);
    console.log('✓ Catalog Suppliers passed (11 suppliers)');

    // 3. Route & Pricing API
    // FL-401 arrives at NRT at 2027-04-10T10:30:00. HTL-TYO-004 is in Tokyo Ueno.
    const priceRangeRes = await request('/api/routes/price-range?flightId=FL-401&hotelId=HTL-TYO-004');
    assert.strictEqual(priceRangeRes.status, 200);
    assert.strictEqual(priceRangeRes.body.data.price_min_inr, 10200);
    assert.strictEqual(priceRangeRes.body.data.price_max_inr, 16800);
    assert.strictEqual(priceRangeRes.body.data.route.drive_minutes, 90);
    console.log('✓ Route price range for FL-401 -> HTL-TYO-004 passed (10,200 - 16,800 INR, 90 min)');

    // 4. Incompatible airport & hotel (R1)
    // FL-401 lands at NRT (Tokyo), HTL-OSA-001 is in Osaka
    const badRouteRes = await request('/api/routes/price-range?flightId=FL-401&hotelId=HTL-OSA-001');
    assert.strictEqual(badRouteRes.status, 400);
    assert.ok(badRouteRes.body.error.includes('does not serve hotel city Osaka'));
    console.log('✓ Incompatible flight/hotel correctly rejected by route pricing (R1)');

    // 5. Create Ride Request - Success (Menon family scenario)
    const validPayload = {
      flightId: 'FL-401',
      hotelId: 'HTL-TYO-004',
      travelerName: 'Menon family',
      adults: 2,
      childAges: [6],
      largeBags: 3,
      smallBags: 2,
      pickupTime: '2027-04-10T11:30:00',
      travelerPrice: 12000
    };
    const createRes = await request('/api/ride-requests', {
      method: 'POST',
      body: validPayload
    });
    assert.strictEqual(createRes.status, 201);
    assert.ok(createRes.body.data.id.startsWith('REQ-'));
    assert.strictEqual(createRes.body.data.travelerPrice, 12000);
    assert.strictEqual(createRes.body.data.status, 'open');
    const createdId = createRes.body.data.id;
    console.log(`✓ Create ride request passed (Menon family -> ${createdId})`);

    // 6. Retrieve Ride Request by ID
    const getByIdRes = await request(`/api/ride-requests/${createdId}`);
    assert.strictEqual(getByIdRes.status, 200);
    assert.strictEqual(getByIdRes.body.data.id, createdId);
    assert.strictEqual(getByIdRes.body.data.flightId, 'FL-401');
    assert.strictEqual(getByIdRes.body.data.hotelId, 'HTL-TYO-004');
    assert.strictEqual(getByIdRes.body.data.adults, 2);
    assert.deepStrictEqual(getByIdRes.body.data.childAges, [6]);
    console.log('✓ Retrieve ride request by ID passed');

    // 7. R1 Validation Tests
    // a) Flight not found
    const invalidFlight = await request('/api/ride-requests', {
      method: 'POST',
      body: { ...validPayload, flightId: 'FL-NONEXISTENT' }
    });
    assert.strictEqual(invalidFlight.status, 400);
    assert.ok(invalidFlight.body.error.includes('FL-NONEXISTENT'));
    console.log('✓ Non-existent flight rejected (R1)');

    // b) Hotel not found
    const invalidHotel = await request('/api/ride-requests', {
      method: 'POST',
      body: { ...validPayload, hotelId: 'HTL-NONEXISTENT' }
    });
    assert.strictEqual(invalidHotel.status, 400);
    assert.ok(invalidHotel.body.error.includes('HTL-NONEXISTENT'));
    console.log('✓ Non-existent hotel rejected (R1)');

    // c) Airport does not serve hotel city
    const incompatibleReq = await request('/api/ride-requests', {
      method: 'POST',
      body: { ...validPayload, hotelId: 'HTL-OSA-001' }
    });
    assert.strictEqual(incompatibleReq.status, 400);
    assert.ok(incompatibleReq.body.error.includes('does not serve hotel city'));
    console.log('✓ Incompatible airport-hotel pair rejected (R1)');

    // d) Adults < 1
    const noAdultsReq = await request('/api/ride-requests', {
      method: 'POST',
      body: { ...validPayload, adults: 0 }
    });
    assert.strictEqual(noAdultsReq.status, 400);
    assert.ok(noAdultsReq.body.error.includes('adult'));
    console.log('✓ Zero adults rejected (R1)');

    // e) Invalid child age (> 17)
    const badChildAge = await request('/api/ride-requests', {
      method: 'POST',
      body: { ...validPayload, childAges: [18] }
    });
    assert.strictEqual(badChildAge.status, 400);
    assert.ok(badChildAge.body.error.includes('Children must be aged 0 to 17'));
    console.log('✓ Child age > 17 rejected (R1)');

    // 8. R2 Validation Tests
    // Landing is 10:30. Pickup at 11:00 (< 60 minutes)
    const earlyPickupReq = await request('/api/ride-requests', {
      method: 'POST',
      body: { ...validPayload, pickupTime: '2027-04-10T11:00:00' }
    });
    assert.strictEqual(earlyPickupReq.status, 400);
    assert.ok(earlyPickupReq.body.error.includes('at least 60 minutes after'));
    console.log('✓ Pickup earlier than 60 minutes after landing rejected (R2)');

    // Default pickup time if omitted (landing 10:30 -> default 11:30:00)
    const omittedPickupReq = await request('/api/ride-requests', {
      method: 'POST',
      body: {
        flightId: 'FL-401',
        hotelId: 'HTL-TYO-004',
        adults: 1,
        childAges: [],
        travelerPrice: 12000
      }
    });
    assert.strictEqual(omittedPickupReq.status, 201);
    assert.strictEqual(omittedPickupReq.body.data.pickupTime, '2027-04-10T11:30:00');
    console.log('✓ Default pickup time (landing + 60m) successfully applied (R2)');

    // 9. R3 Validation Tests
    // Price below min (10,200) -> 9000
    const lowPriceReq = await request('/api/ride-requests', {
      method: 'POST',
      body: { ...validPayload, travelerPrice: 9000 }
    });
    assert.strictEqual(lowPriceReq.status, 400);
    assert.ok(lowPriceReq.body.error.includes('outside the allowed route range'));
    console.log('✓ Price below route minimum rejected (R3)');

    // Price above max (16,800) -> 18000
    const highPriceReq = await request('/api/ride-requests', {
      method: 'POST',
      body: { ...validPayload, travelerPrice: 18000 }
    });
    assert.strictEqual(highPriceReq.status, 400);
    assert.ok(highPriceReq.body.error.includes('outside the allowed route range'));
    console.log('✓ Price above route maximum rejected (R3)');

    // 10. List Ride Requests
    const listRes = await request('/api/ride-requests');
    assert.strictEqual(listRes.status, 200);
    assert.ok(listRes.body.count >= 5); // 3 seeded + 2 created in tests
    console.log(`✓ List ride requests passed (${listRes.body.count} requests)`);

    console.log('\n======================================');
    console.log('ALL BACKEND INTEGRATION & RULE TESTS PASSED!');
    console.log('======================================\n');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  if (server) server.close();
  process.exit(1);
});

