const assert = require('assert');
const app = require('../src/app');
const { initializeDatabase, getDatabase } = require('../src/config/database');
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

async function runPart2Tests() {
  console.log('--- Starting Part 2 Integration & Rule Tests ---');
  loadAllData();
  initializeDatabase();

  // Reset Part 2 tables so test suite is idempotent and re-runnable
  const db = getDatabase();
  db.prepare('DELETE FROM change_requests').run();
  db.prepare('DELETE FROM bookings').run();
  db.prepare('DELETE FROM offers').run();
  db.prepare("DELETE FROM ride_requests WHERE traveler_name LIKE '%Menon family P2%' OR traveler_name IS NULL").run();

  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  try {
    // 1. Post a test ride request (Menon family scenario)
    // Flight FL-401 lands NRT 2027-04-10T10:30:00. Hotel HTL-TYO-004 is Ueno Garden Inn (Tokyo, Ueno).
    // Route NRT -> Tokyo Ueno: 73.3 km, 90 mins drive, price: 10,200 - 16,800 INR.
    // Pickup: 2027-04-10T11:30:00. Busy interval: 11:30 to 14:30.
    const reqPayload = {
      travelerName: 'Menon family P2',
      flightId: 'FL-401',
      hotelId: 'HTL-TYO-004',
      adults: 2,
      childAges: [6],
      largeBags: 3,
      smallBags: 2,
      pickupTime: '2027-04-10T11:30:00',
      travelerPrice: 12000
    };

    const reqRes = await request('/api/ride-requests', {
      method: 'POST',
      body: reqPayload
    });
    assert.strictEqual(reqRes.status, 201);
    const testReqId = reqRes.body.data.id;
    console.log(`✓ Test ride request created: ${testReqId}`);

    // 2. R4: Supplier Eligibility
    // Sakura Cabs (TX-JP-01) works at NRT, HND, serves Tokyo Ueno, hours 06:00-23:00.
    // Vehicle SC-2 is busy 11:00-14:00 (booked_rides.json).
    // But SC-3 is an SUV (seats: 6, large_bags: 4, small_bags: 3) and is FREE!
    // So Sakura Cabs should see this request!
    const sakuraRequests = await request('/api/suppliers/TX-JP-01/requests');
    assert.strictEqual(sakuraRequests.status, 200);
    assert.ok(sakuraRequests.body.data.some(r => r.id === testReqId), 'Sakura Cabs should see eligible request');
    console.log(`✓ R4: Eligible supplier (Sakura Cabs) sees request (${sakuraRequests.body.count} eligible requests)`);

    // Ineligible supplier: Fast Track Taxis (TX-AE-01) operates in Dubai/UAE (DXB, AUH), NOT NRT/Tokyo!
    const uaeRequests = await request('/api/suppliers/TX-AE-01/requests');
    assert.strictEqual(uaeRequests.status, 200);
    assert.ok(!uaeRequests.body.data.some(r => r.id === testReqId), 'UAE supplier must NOT see Tokyo request');
    console.log('✓ R4: Supplier not operating at airport/city cannot see request');

    // 3. R5: Vehicle Capacity Validation
    // Sakura Cabs SC-1 is a SEDAN (seats: 4, large_bags: 2, small_bags: 2).
    // Menon family has 3 large bags, but SC-1 only fits 2 large bags!
    const badCapOffer = await request(`/api/offers/requests/${testReqId}`, {
      method: 'POST',
      body: {
        supplierId: 'TX-JP-01',
        carId: 'SC-1',
        price: 13000
      }
    });
    assert.strictEqual(badCapOffer.status, 400);
    assert.ok(badCapOffer.body.error.includes('Insufficient large luggage capacity'));
    console.log('✓ R5: Vehicle with insufficient luggage capacity rejected');

    // 4. R6: Car Availability & Pre-booked Rides Validation
    // Sakura Cabs SC-2 is in booked_rides.json: RIDE-0001 (2027-04-10T11:00 to 14:00).
    // Menon request busy interval is 11:30 to 14:30 -> OVERLAPS!
    const busyCarOffer = await request(`/api/offers/requests/${testReqId}`, {
      method: 'POST',
      body: {
        supplierId: 'TX-JP-01',
        carId: 'SC-2',
        price: 13000
      }
    });
    assert.strictEqual(busyCarOffer.status, 400);
    assert.ok(busyCarOffer.body.error.includes('not available') || busyCarOffer.body.error.includes('busy'));
    console.log('✓ R6: Busy vehicle (from booked_rides.json) correctly rejected');

    // 5. R7: Offer Price Validation
    // Route range is 10,200 to 16,800. Try 9,000 (below min) and 18,000 (above max).
    const lowOffer = await request(`/api/offers/requests/${testReqId}`, {
      method: 'POST',
      body: {
        supplierId: 'TX-JP-01',
        carId: 'SC-3',
        price: 9000
      }
    });
    assert.strictEqual(lowOffer.status, 400);
    assert.ok(lowOffer.body.error.includes('outside the allowed route range'));

    const highOffer = await request(`/api/offers/requests/${testReqId}`, {
      method: 'POST',
      body: {
        supplierId: 'TX-JP-01',
        carId: 'SC-3',
        price: 18000
      }
    });
    assert.strictEqual(highOffer.status, 400);
    assert.ok(highOffer.body.error.includes('outside the allowed route range'));
    console.log('✓ R7: Offer price outside route boundaries rejected');

    // 6. Create Valid Offers
    // Offer 1 from Sakura Cabs with SC-3 at ₹13,500
    const validOffer1 = await request(`/api/offers/requests/${testReqId}`, {
      method: 'POST',
      body: {
        supplierId: 'TX-JP-01',
        carId: 'SC-3',
        price: 13500
      }
    });
    assert.strictEqual(validOffer1.status, 201);
    const offer1Id = validOffer1.body.data.id;
    console.log(`✓ R7: Valid offer 1 created: ${offer1Id} (₹13,500)`);

    // Offer 2 from Tokyo Express (TX-JP-03) with EP-2 (SUV) at ₹12,800
    const validOffer2 = await request(`/api/offers/requests/${testReqId}`, {
      method: 'POST',
      body: {
        supplierId: 'TX-JP-03',
        carId: 'EP-2',
        price: 12800
      }
    });
    assert.strictEqual(validOffer2.status, 201);
    const offer2Id = validOffer2.body.data.id;
    console.log(`✓ R7: Valid offer 2 created: ${offer2Id} (₹12,800)`);

    // List offers for request
    const listOffers = await request(`/api/offers/requests/${testReqId}`);
    assert.strictEqual(listOffers.status, 200);
    assert.strictEqual(listOffers.body.count, 2);
    console.log('✓ Retrieve all offers for request passed');

    // 7. R8: Reject an Offer
    const rejectRes = await request(`/api/offers/${offer1Id}/reject`, { method: 'POST' });
    assert.strictEqual(rejectRes.status, 200);
    assert.strictEqual(rejectRes.body.data.status, 'rejected');

    // Attempting to book a rejected offer must fail (R8)
    const bookRejected = await request(`/api/bookings/offers/${offer1Id}`, { method: 'POST' });
    assert.strictEqual(bookRejected.status, 400);
    assert.ok(bookRejected.body.error.includes('already been rejected'));
    console.log('✓ R8: Rejection works and rejected offer cannot be booked');

    // 8. R8: Book a Valid Offer (Offer 2)
    const bookRes = await request(`/api/bookings/offers/${offer2Id}`, { method: 'POST' });
    assert.strictEqual(bookRes.status, 201);
    const booking = bookRes.body.data;
    assert.strictEqual(booking.status, 'confirmed');
    assert.strictEqual(booking.offerId, offer2Id);
    assert.strictEqual(booking.price, 12800);
    assert.strictEqual(booking.bookingNumber.length, 10);
    assert.match(booking.bookingNumber, /^\d{10}$/);
    const bookingNumber = booking.bookingNumber;
    console.log(`✓ R8: Booking confirmed with 10-digit number: ${bookingNumber}`);

    // Check that other offers became 'not_chosen' or were rejected
    const recheckedOffer1 = await request(`/api/offers/requests/${testReqId}`);
    const o1 = recheckedOffer1.body.data.find(o => o.id === offer1Id);
    assert.strictEqual(o1.status, 'rejected'); // Was rejected before

    // Create another dummy request to test 'not_chosen' transition
    const dummyReq = await request('/api/ride-requests', {
      method: 'POST',
      body: {
        flightId: 'FL-401',
        hotelId: 'HTL-TYO-004',
        adults: 1,
        childAges: [],
        travelerPrice: 12000
      }
    });
    const dReqId = dummyReq.body.data.id;
    // Offer A
    const offA = await request(`/api/offers/requests/${dReqId}`, {
      method: 'POST',
      body: { supplierId: 'TX-JP-01', carId: 'SC-1', price: 11000 }
    });
    // Offer B
    const offB = await request(`/api/offers/requests/${dReqId}`, {
      method: 'POST',
      body: { supplierId: 'TX-JP-01', carId: 'SC-3', price: 12000 }
    });
    // Book Offer A
    await request(`/api/bookings/offers/${offA.body.data.id}`, { method: 'POST' });
    // Check Offer B is not_chosen
    const dOffers = await request(`/api/offers/requests/${dReqId}`);
    const bOff = dOffers.body.data.find(o => o.id === offB.body.data.id);
    assert.strictEqual(bOff.status, 'not_chosen');
    console.log('✓ R8: Unselected assigned offers marked as not_chosen');

    // 9. R8: Retrieve Booking by 10-digit Number
    const getBookingRes = await request(`/api/bookings/${bookingNumber}`);
    assert.strictEqual(getBookingRes.status, 200);
    assert.strictEqual(getBookingRes.body.data.bookingNumber, bookingNumber);
    assert.strictEqual(getBookingRes.body.data.flightId, 'FL-401');
    assert.strictEqual(getBookingRes.body.data.hotelId, 'HTL-TYO-004');
    assert.strictEqual(getBookingRes.body.data.supplierId, 'TX-JP-03');
    console.log('✓ R8: Retrieve booking by 10-digit number passed');

    // Non-existent booking lookup returns BOOKING_NOT_FOUND
    const badBookingRes = await request('/api/bookings/9999999999');
    assert.strictEqual(badBookingRes.status, 404);
    assert.strictEqual(badBookingRes.body.error.code, 'BOOKING_NOT_FOUND');
    console.log('✓ R8: Non-existent booking returns BOOKING_NOT_FOUND');

    // 10. R9: Change Request Workflow
    // Traveler sends a change request for new pickup: 2027-04-10T14:30:00 (FL-401 lands 10:30, 14:30 is 4 hours later -> valid R2)
    const changeReqRes = await request(`/api/change-requests/${bookingNumber}`, {
      method: 'POST',
      body: {
        newPickupAt: '2027-04-10T14:30:00'
      }
    });
    assert.strictEqual(changeReqRes.status, 201);
    const changeReqId = changeReqRes.body.data.id;
    assert.strictEqual(changeReqRes.body.data.status, 'pending');
    console.log(`✓ R9: Change request submitted: ${changeReqId}`);

    // Supplier retrieves pending change requests
    const supplierChanges = await request('/api/change-requests/supplier/TX-JP-03');
    assert.strictEqual(supplierChanges.status, 200);
    assert.ok(supplierChanges.body.data.some(c => c.id === changeReqId));
    console.log('✓ R9: Supplier views pending change requests');

    // Supplier accepts change request
    const acceptRes = await request(`/api/change-requests/${changeReqId}`, {
      method: 'PATCH',
      body: {
        action: 'accept',
        reason: 'Sure, new time accepted'
      }
    });
    assert.strictEqual(acceptRes.status, 200);
    assert.strictEqual(acceptRes.body.changeRequest.status, 'accepted');
    assert.strictEqual(acceptRes.body.booking.pickup_at, '2027-04-10T14:30:00');
    console.log('✓ R9: Supplier accepts change request, booking pickup updated');

    // Traveler submits another change request that gets rejected
    const changeReq2 = await request(`/api/change-requests/${bookingNumber}`, {
      method: 'POST',
      body: {
        newPickupAt: '2027-04-10T16:00:00'
      }
    });
    assert.strictEqual(changeReq2.status, 201);
    const changeReq2Id = changeReq2.body.data.id;

    const rejectChangeRes = await request(`/api/change-requests/${changeReq2Id}`, {
      method: 'PATCH',
      body: {
        action: 'reject',
        reason: 'Driver not available at 16:00'
      }
    });
    assert.strictEqual(rejectChangeRes.status, 200);
    assert.strictEqual(rejectChangeRes.body.changeRequest.status, 'rejected');

    // Verify original booking is preserved after rejection
    const verifyBooking = await request(`/api/bookings/${bookingNumber}`);
    assert.strictEqual(verifyBooking.body.data.pickupAt, '2027-04-10T14:30:00'); // Preserved from previous accepted
    console.log('✓ R9: Rejected change preserves original booking');

    console.log('\n======================================');
    console.log('ALL PART 2 BACKEND INTEGRATION & RULE TESTS PASSED!');
    console.log('======================================\n');
  } finally {
    server.close();
  }
}

runPart2Tests().catch(err => {
  console.error('PART 2 TEST FAILED:', err);
  if (server) server.close();
  process.exit(1);
});
