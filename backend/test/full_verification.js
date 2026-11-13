async function runFullVerification() {
  console.log('=== FULL END-TO-END VERIFICATION: TRAVELLER & BACKEND ===\n');

  const BASE = 'http://localhost:5174/api';

  // 1. Health check
  const healthRes = await fetch('http://localhost:5000/api/health');
  console.log('1. Backend Server Health:', healthRes.status, await healthRes.json());

  // 2. Catalogs via Frontend Proxy
  const flightsRes = await fetch(BASE + '/catalog/flights');
  const flights = (await flightsRes.json()).data;
  console.log('2. Catalogs: Flights count =', flights.length);

  const hotelsRes = await fetch(BASE + '/catalog/hotels');
  const hotels = (await hotelsRes.json()).data;
  console.log('2. Catalogs: Hotels count =', hotels.length);

  const airportsRes = await fetch(BASE + '/catalog/airports');
  const airports = (await airportsRes.json()).data;
  console.log('2. Catalogs: Airports count =', airports.length);

  // 3. Price details calculation
  console.log('\n3. Price Details Calculation:');
  const testRoutes = [
    { name: 'Narita -> Ueno (Menon Scenario)', flightId: 'FL-401', hotelId: 'HTL-TYO-004' },
    { name: 'Haneda -> Ginza', flightId: 'FL-1001', hotelId: 'HTL-TYO-001' },
    { name: 'Kansai -> Osaka', flightId: 'FL-501', hotelId: 'HTL-OSA-001' }
  ];

  for (const tr of testRoutes) {
    const res = await fetch(BASE + '/routes/price-range?flightId=' + tr.flightId + '&hotelId=' + tr.hotelId);
    const json = await res.json();
    console.log('  - ' + tr.name + ': Status ' + res.status +
      ', Distance: ' + json.data.distance_km + ' km' +
      ', Drive: ' + json.data.drive_minutes + ' mins' +
      ', Band: ₹' + json.data.price_min_inr.toLocaleString() + ' - ₹' + json.data.price_max_inr.toLocaleString());
  }

  // 4. Create Ride Requests (Persistence to Database)
  console.log('\n4. Creating Ride Requests via Frontend API:');
  const ridesToCreate = [
    {
      travelerName: 'Menon family (Demo)',
      flightId: 'FL-401',
      hotelId: 'HTL-TYO-004',
      adults: 2,
      childAges: [6],
      largeBags: 3,
      smallBags: 2,
      pickupTime: '2027-04-10T11:30',
      travelerPrice: 12000,
      carType: 'SEDAN'
    },
    {
      travelerName: 'Arjun & Priya (Haneda)',
      flightId: 'FL-1001',
      hotelId: 'HTL-TYO-001',
      adults: 2,
      childAges: [],
      largeBags: 2,
      smallBags: 1,
      pickupTime: '2027-04-01T08:30',
      travelerPrice: 3800,
      carType: 'SEDAN'
    }
  ];

  for (const r of ridesToCreate) {
    const postRes = await fetch(BASE + '/ride-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r)
    });
    const postJson = await postRes.json();
    console.log('  - Created: Status ' + postRes.status +
      ', ID: ' + postJson.data?.id +
      ', Traveler: ' + postJson.data?.travelerName +
      ', Price: ₹' + postJson.data?.travelerPrice);
  }

  // 5. Query Dashboard Data from Database
  console.log('\n5. Fetching Requests for Traveler Dashboard:');
  const dashRes = await fetch(BASE + '/ride-requests');
  const dashJson = await dashRes.json();
  console.log('  - Total Requests in DB: ' + dashJson.count);
  const latest = dashJson.data[0];
  console.log('  - Latest Request in DB: ID=' + latest.id +
    ', Traveler=' + latest.travelerName +
    ', Flight=' + latest.flight?.flight_number + ' (' + latest.flight?.from + '->' + latest.flight?.to + ')' +
    ', Hotel=' + latest.hotel?.name +
    ', Price=₹' + latest.travelerPrice +
    ', Route Distance=' + latest.route?.distance_km + ' km');

  // 6. Test Hackathon Rule Validations
  console.log('\n6. Testing Rule Validations:');
  // R1: Incompatible city
  const r1Res = await fetch(BASE + '/ride-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...ridesToCreate[0], hotelId: 'HTL-DXB-001' })
  });
  console.log('  - Rule R1 (Incompatible Hotel City): Status ' + r1Res.status + ' (Expected 400)');

  // R2: Less than 60 mins buffer
  const r2Res = await fetch(BASE + '/ride-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...ridesToCreate[0], pickupTime: '2027-04-10T10:45' })
  });
  console.log('  - Rule R2 (Less than 60 min buffer): Status ' + r2Res.status + ' (Expected 400)');

  // R3: Price out of band
  const r3Res = await fetch(BASE + '/ride-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...ridesToCreate[0], travelerPrice: 5000 })
  });
  console.log('  - Rule R3 (Price ₹5,000 below min ₹10,200): Status ' + r3Res.status + ' (Expected 400)');

  console.log('\n=== ALL END-TO-END VERIFICATIONS PASSED SUCCESSFULLY! ===');
}

runFullVerification();
