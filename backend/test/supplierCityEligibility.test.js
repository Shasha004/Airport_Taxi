const assert = require('assert');
const http = require('http');
const app = require('../src/app');

async function runSupplierCityEligibilityTests() {
  console.log('\n--- Starting Supplier City & Airport Reflection Tests ---');

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
    // 1. Create a ride request arriving at NRT heading to Tokyo (Ueno)
    const reqRes = await request('/api/ride-requests', {
      method: 'POST',
      body: {
        travelerName: 'Iyer Family NRT Test',
        flightId: 'FL-401', // Lands at NRT
        hotelId: 'HTL-TYO-004', // In Tokyo, Ueno
        adults: 2,
        childAges: [6],
        largeBags: 3,
        smallBags: 2,
        pickupTime: '2027-04-10T12:00:00',
        travelerPrice: 12500,
      },
    });

    assert.strictEqual(reqRes.status, 201);
    const createdReqId = reqRes.body.data.id;
    console.log(`✓ Created ride request arriving at NRT: ${createdReqId}`);

    // 2. Query Narita Star Taxi (TX-JP-02) which operates at NRT in Tokyo
    const nrtSupplierRes = await request('/api/suppliers/TX-JP-02/requests');
    assert.strictEqual(nrtSupplierRes.status, 200);
    assert.ok(
      nrtSupplierRes.body.data.some((r) => r.id === createdReqId),
      'Narita Star Taxi (TX-JP-02) MUST see the request arriving at NRT for Tokyo'
    );
    console.log(
      `✓ Narita Star Taxi (TX-JP-02) successfully reflects NRT Tokyo request (total eligible: ${nrtSupplierRes.body.count})`
    );

    // 3. Query Sakura Cabs (TX-JP-01) which also operates at NRT/HND in Tokyo
    const sakuraRes = await request('/api/suppliers/TX-JP-01/requests');
    assert.strictEqual(sakuraRes.status, 200);
    assert.ok(
      sakuraRes.body.data.some((r) => r.id === createdReqId),
      'Sakura Cabs (TX-JP-01) MUST also see the request arriving at NRT for Tokyo'
    );
    console.log('✓ Sakura Cabs (TX-JP-01) also reflects NRT Tokyo request');

    // 4. Query Haneda Family Rides (TX-JP-04) which ONLY operates at HND, NOT NRT
    const hndOnlyRes = await request('/api/suppliers/TX-JP-04/requests');
    assert.strictEqual(hndOnlyRes.status, 200);
    assert.ok(
      !hndOnlyRes.body.data.some((r) => r.id === createdReqId),
      'Haneda-only supplier (TX-JP-04) must NOT see NRT arrival requests'
    );
    console.log('✓ Haneda-only supplier (TX-JP-04) does not see NRT arrival request');

    // 5. Query UAE supplier Falcon Taxi (TX-AE-01) which operates in Dubai (DXB)
    const uaeRes = await request('/api/suppliers/TX-AE-01/requests');
    assert.strictEqual(uaeRes.status, 200);
    assert.ok(
      !uaeRes.body.data.some((r) => r.id === createdReqId),
      'Dubai supplier (TX-AE-01) must NOT see NRT / Tokyo request'
    );
    console.log('✓ Dubai supplier (TX-AE-01) does not see NRT Tokyo request');

    // 6. Narita Star Taxi submits an offer using suitable vehicle NS-2 (BUS)
    const offerRes = await request(`/api/offers/requests/${createdReqId}`, {
      method: 'POST',
      body: {
        supplierId: 'TX-JP-02',
        carId: 'NS-2',
        price: 13000,
      },
    });
    assert.strictEqual(offerRes.status, 201);
    console.log(`✓ Narita Star Taxi successfully created offer: ${offerRes.body.data.id}`);

    console.log('\n======================================');
    console.log('ALL SUPPLIER CITY & AIRPORT TESTS PASSED!');
    console.log('======================================\n');
  } finally {
    server.close();
  }
}

runSupplierCityEligibilityTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
