const assert = require('assert');
const http = require('http');
const app = require('../src/app');

let server;
let baseUrl;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const bodyStr = options.body ? JSON.stringify(options.body) : null;

    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        ...options.headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed,
        });
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function runFlightDelayTests() {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;

  console.log('--- Starting Flight Delay Feature Tests ---');

  try {
    // 1. Create a ride request (FL-1242 lands at 2027-04-14T09:50:00)
    const createReq = await request('/api/ride-requests', {
      method: 'POST',
      body: {
        travelerName: 'Verma family',
        flightId: 'FL-1242',
        hotelId: 'HTL-TYO-004',
        adults: 2,
        childAges: [5],
        largeBags: 2,
        smallBags: 2,
        pickupTime: '2027-04-14T11:00:00',
        travelerPrice: 12000,
        carType: 'SEDAN'
      }
    });
    assert.strictEqual(createReq.status, 201);
    const reqId = createReq.body.data.id;
    console.log(`✓ Ride request created: ${reqId}`);

    // 2. Open request delay update (before supplier accepted)
    const openDelayRes = await request(`/api/ride-requests/${reqId}/delay`, {
      method: 'POST',
      body: {
        delayMinutes: 30, // 11:00 -> 11:30
      }
    });
    assert.strictEqual(openDelayRes.status, 200);
    assert.strictEqual(openDelayRes.body.isBooked, false);
    assert.strictEqual(openDelayRes.body.request.pickupAt, '2027-04-14T11:30:00');
    console.log('✓ Open request flight delay directly updates pickup time (11:00 -> 11:30)');

    // 3. Supplier assigns car
    const offerRes = await request(`/api/offers/requests/${reqId}`, {
      method: 'POST',
      body: {
        supplierId: 'TX-JP-01',
        carId: 'SC-1',
        price: 12000
      }
    });
    assert.strictEqual(offerRes.status, 201);
    const offerId = offerRes.body.data.id;

    // 4. Traveler books offer -> Booking confirmed
    const bookRes = await request(`/api/bookings/offers/${offerId}`, { method: 'POST' });
    assert.strictEqual(bookRes.status, 201);
    const bookingNumber = bookRes.body.data.bookingNumber;
    console.log(`✓ Booking confirmed with supplier TX-JP-01: #${bookingNumber}`);

    // 5. Flight gets delayed further by 45 minutes! Traveler reports delay
    const delayRes = await request(`/api/ride-requests/${reqId}/delay`, {
      method: 'POST',
      body: {
        delayMinutes: 45, // 11:30 -> 12:15
        reason: 'Inbound flight delayed due to weather'
      }
    });
    assert.strictEqual(delayRes.status, 200);
    assert.strictEqual(delayRes.body.isBooked, true);
    assert.strictEqual(delayRes.body.changeRequest.status, 'pending');
    assert.strictEqual(delayRes.body.changeRequest.newPickupAt, '2027-04-14T12:15:00');
    const changeReqId = delayRes.body.changeRequest.id;
    console.log(`✓ Delayed flight reported for booked ride: change request created (${changeReqId})`);

    // 6. Check supplier receives this update with details
    const supChangesRes = await request('/api/change-requests/supplier/TX-JP-01');
    assert.strictEqual(supChangesRes.status, 200);
    const foundCr = supChangesRes.body.data.find(c => c.id === changeReqId);
    assert.ok(foundCr, 'Supplier can see pending delay change request');
    assert.strictEqual(foundCr.bookingNumber, bookingNumber);
    assert.strictEqual(foundCr.currentPickupAt, '2027-04-14T11:30:00');
    assert.strictEqual(foundCr.newPickupAt, '2027-04-14T12:15:00');
    assert.strictEqual(foundCr.delayMinutes, 45);
    console.log('✓ Supplier reflects updated delayed pickup (+45m delay, previous: 11:30, current: 12:15)');

    // 7. Supplier ACCEPTS delayed schedule: "previous will delete, current will accept"
    const acceptRes = await request(`/api/change-requests/${changeReqId}`, {
      method: 'PATCH',
      body: {
        action: 'accept',
        reason: 'Accepted delayed schedule'
      }
    });
    assert.strictEqual(acceptRes.status, 200);
    assert.strictEqual(acceptRes.body.changeRequest.status, 'accepted');
    assert.strictEqual(acceptRes.body.booking.pickup_at, '2027-04-14T12:15:00');

    // Verify booking now has new pickup (previous deleted, current accepted)
    const checkBooking = await request(`/api/bookings/${bookingNumber}`);
    assert.strictEqual(checkBooking.body.data.pickupAt, '2027-04-14T12:15:00');

    // Verify ride request now also has new pickup
    const checkReq = await request(`/api/ride-requests/${reqId}`);
    assert.strictEqual(checkReq.body.data.pickupAt, '2027-04-14T12:15:00');
    console.log('✓ Supplier ACCEPT: Previous schedule deleted/replaced, current delayed schedule accepted!');

    // 8. Test REJECT option: traveler requests another delay that supplier cannot accommodate
    const delay2Res = await request(`/api/ride-requests/${reqId}/delay`, {
      method: 'POST',
      body: {
        delayMinutes: 60, // 12:15 -> 13:15
      }
    });
    assert.strictEqual(delay2Res.status, 200);
    const cr2Id = delay2Res.body.changeRequest.id;

    const rejectRes = await request(`/api/change-requests/${cr2Id}`, {
      method: 'PATCH',
      body: {
        action: 'reject',
        reason: 'Driver has another commitment at 13:15'
      }
    });
    assert.strictEqual(rejectRes.status, 200);
    assert.strictEqual(rejectRes.body.changeRequest.status, 'rejected');

    // Verify booking is cancelled because delayed flight schedule cannot be accommodated
    const verifyBookingAfterReject = await request(`/api/bookings/${bookingNumber}`);
    assert.strictEqual(verifyBookingAfterReject.body.data.status, 'cancelled');
    assert.strictEqual(verifyBookingAfterReject.body.data.pickupAt, '2027-04-14T12:15:00');

    // Verify ride request status is cancelled and hasBooking is false (does not show as booked)
    const verifyReqAfterReject = await request(`/api/ride-requests/${reqId}`);
    assert.strictEqual(verifyReqAfterReject.body.data.status, 'cancelled');
    assert.strictEqual(verifyReqAfterReject.body.data.hasBooking, false);
    console.log('✓ Supplier REJECT: Booking cancelled and ride request does not show as booked');

    console.log('\n======================================');
    console.log('ALL FLIGHT DELAY FEATURE TESTS PASSED!');
    console.log('======================================\n');
  } finally {
    server.close();
  }
}

runFlightDelayTests().catch(err => {
  console.error('FLIGHT DELAY TEST FAILED:', err);
  if (server) server.close();
  process.exit(1);
});
