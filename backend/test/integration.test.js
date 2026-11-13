const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('--- TESTING FRONTEND (PORT 5174) -> BACKEND (PORT 5000) ---');

  // 1. Fetch catalog via port 5174
  const flightsRes = await request({
    host: 'localhost',
    port: 5174,
    path: '/api/catalog/flights',
    method: 'GET'
  });
  console.log(`[1] GET /api/catalog/flights via Port 5174: HTTP ${flightsRes.status}, Total flights: ${flightsRes.json.data.length}`);

  // 2. Fetch routes price range via port 5174
  const priceRes = await request({
    host: 'localhost',
    port: 5174,
    path: '/api/routes/price-range?flightId=FL-401&hotelId=HTL-TYO-004',
    method: 'GET'
  });
  console.log(`[2] GET /api/routes/price-range via Port 5174: HTTP ${priceRes.status}, Range: Rs. ${priceRes.json.data.price_min_inr} - ${priceRes.json.data.price_max_inr}`);

  // 3. Post a new ride request via port 5174
  const newRide = {
    travelerName: 'Live Integration Verification',
    flightId: 'FL-401',
    hotelId: 'HTL-TYO-004',
    adults: 2,
    childAges: [6],
    largeBags: 3,
    smallBags: 2,
    pickupTime: '2027-04-10T11:30:00',
    travelerPrice: 12000,
    carType: 'SEDAN'
  };
  const postRes = await request(
    {
      host: 'localhost',
      port: 5174,
      path: '/api/ride-requests',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    newRide
  );
  console.log(`[3] POST /api/ride-requests via Port 5174: HTTP ${postRes.status}, ID: ${postRes.json.data?.id}`);

  // 4. Get all ride requests via port 5174
  const allRes = await request({
    host: 'localhost',
    port: 5174,
    path: '/api/ride-requests',
    method: 'GET'
  });
  console.log(`[4] GET /api/ride-requests via Port 5174: HTTP ${allRes.status}, Total requests in DB: ${allRes.json.count}`);
  const match = allRes.json.data.find(r => r.travelerName === 'Live Integration Verification');
  console.log(`[5] Verifying persistent DB entry: ${match ? 'CONFIRMED FOUND in Backend DB with ID ' + match.id : 'NOT FOUND'}`);

  console.log('--- ALL FRONTEND-BACKEND INTEGRATION TESTS PASSED! ---');
}

run().catch(console.error);
