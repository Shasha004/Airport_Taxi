import React, { useState, useEffect, useRef } from 'react';
import { getFlights, getHotels, getAirports, getPriceRange, createRideRequest } from '../services/api.js';
import '../css/CreateRidePage.css';

const CAR_TYPES = ['ANY', 'HATCHBACK', 'SEDAN', 'SUV', 'BUS'];

const SCENARIOS = [
  {
    label: '⭐ Menon Family (NRT → Ueno, Tokyo)',
    sub: 'FL-401 • Ueno Garden Inn • ₹12,000',
    data: {
      travelerName: 'Menon family',
      largeBags: 3,
      smallBags: 2,
      flightId: 'FL-401',
      hotelId: 'HTL-TYO-004',
      adults: 2,
      childAges: [6],
      pickupTime: '2027-04-10T11:30',
      travelerPrice: 12000,
      carType: 'SEDAN'
    }
  },
  {
    label: '⭐ Tokyo Haneda Transfer (HND → Ginza)',
    sub: 'FL-1001 • Ginza Pearl Hotel • ₹3,800',
    data: {
      travelerName: 'Arjun & Priya',
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
  },
  {
    label: '⭐ Kansai Osaka Express (KIX → Namba)',
    sub: 'FL-501 • Namba Oriental Hotel • ₹9,000',
    data: {
      travelerName: 'Rohan Sharma',
      flightId: 'FL-501',
      hotelId: 'HTL-OSA-001',
      adults: 1,
      childAges: [],
      largeBags: 1,
      smallBags: 1,
      pickupTime: '2027-04-09T10:15',
      travelerPrice: 9000,
      carType: 'SEDAN'
    }
  }
];

function addMinutes(iso, mins) {
  if (!iso) return new Date();
  return new Date(new Date(iso).getTime() + mins * 60000);
}

function toLocalInput(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CreateRidePage({ onNavigate }) {
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [airports, setAirports] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [form, setForm] = useState({
    travelerName: '',
    flightId: '',
    hotelId: '',
    adults: 1,
    childAges: [],
    largeBags: 0,
    smallBags: 0,
    pickupTime: '',
    travelerPrice: 0,
    carType: 'SEDAN'
  });

  const [routeInfo, setRouteInfo] = useState(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Initial Load of Catalogs from Live Database
  useEffect(() => {
    async function init() {
      setLoadingCatalogs(true);
      const [fList, hList, aList] = await Promise.all([
        getFlights(),
        getHotels(),
        getAirports()
      ]);
      setFlights(fList);
      setHotels(hList);
      setAirports(aList);
      setLoadingCatalogs(false);
    }
    init();
  }, []);

  const selectedFlight = flights.find((f) => f.id === form.flightId);
  const arrivalAirportCode = selectedFlight?.to;
  const arrivalAirport = airports.find((a) => a.code === arrivalAirportCode);
  const servedCities = arrivalAirport?.serves_cities || (arrivalAirport?.city ? [arrivalAirport.city] : []);

  // Filter hotels by arrival airport's served cities (Rule R1)
  const filteredHotels = selectedFlight && servedCities.length > 0
    ? hotels.filter((h) => servedCities.map((c) => c.toLowerCase()).includes(h.city.toLowerCase()))
    : hotels;

  // Auto-set earliest compliant pickup time (Rule R2: landing + 60 minutes)
  useEffect(() => {
    if (selectedFlight?.arrival_local) {
      const earliest = addMinutes(selectedFlight.arrival_local, 60);
      setForm((prev) => ({
        ...prev,
        pickupTime: toLocalInput(earliest)
      }));
    }
  }, [form.flightId]);

  // Recalculate route distance & allowable price range when flight & hotel are selected (Rule R3)
  useEffect(() => {
    if (form.flightId && form.hotelId) {
      setCalculatingPrice(true);
      setError('');
      getPriceRange(form.flightId, form.hotelId).then((res) => {
        setCalculatingPrice(false);
        if (res.ok) {
          setRouteInfo(res);
          // Set suggested price to min price if not already within range
          setForm((prev) => {
            if (prev.travelerPrice < res.price_min_inr || prev.travelerPrice > res.price_max_inr || prev.travelerPrice === 0) {
              return { ...prev, travelerPrice: res.price_min_inr };
            }
            return prev;
          });
        } else {
          setRouteInfo(null);
          setError(res.error || 'Could not calculate price band for this route.');
        }
      });
    } else {
      setRouteInfo(null);
    }
  }, [form.flightId, form.hotelId]);

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const loadScenario = (scenario) => {
    setError('');
    setSuccessMsg('');
    setForm(scenario.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || submitLockRef.current) return;
    setError('');
    setSuccessMsg('');

    // Rule R1 Check: Adults >= 1
    if (form.adults < 1) {
      setError('Rule R1 Error: At least 1 adult passenger is required.');
      return;
    }

    // Rule R2 Check: 60 mins buffer
    if (selectedFlight?.arrival_local && form.pickupTime) {
      const arrivalMs = new Date(selectedFlight.arrival_local).getTime();
      const pickupMs = new Date(form.pickupTime).getTime();
      const diffMins = (pickupMs - arrivalMs) / 60000;
      if (diffMins < 60) {
        setError(`Rule R2 Error: Pickup must be at least 60 minutes after flight landing (${selectedFlight.arrival_local.replace('T', ' ')}).`);
        return;
      }
    }

    // Rule R3 Check: Price bounds
    if (routeInfo) {
      if (form.travelerPrice < routeInfo.price_min_inr || form.travelerPrice > routeInfo.price_max_inr) {
        setError(`Rule R3 Error: Proposed price (₹${form.travelerPrice.toLocaleString()}) must be within the route band ₹${routeInfo.price_min_inr.toLocaleString()} – ₹${routeInfo.price_max_inr.toLocaleString()}.`);
        return;
      }
    }

    submitLockRef.current = true;
    setSubmitting(true);
    try {
      const res = await createRideRequest(form);
      if (res.ok) {
        setSuccessMsg(`Ride Request ${res.request?.id || ''} created successfully! Redirecting...`);
        setTimeout(() => {
          onNavigate('dashboard');
        }, 1200);
      } else {
        submitLockRef.current = false;
        setError(res.error || 'Failed to submit ride request to database.');
      }
    } catch (err) {
      submitLockRef.current = false;
      setError(err.message || 'Failed to submit ride request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page create-page">
      <div className="container create__wrap">
        {/* Navigation & Header */}
        <div className="create__head">
          <button type="button" className="create__back" onClick={() => onNavigate('dashboard')}>
            &larr; Back to Dashboard
          </button>
          <div className="create__title-box">
            <h1 className="create__title">Request an Airport Taxi</h1>
            <p className="create__sub">Submit flight &amp; destination details. Real-time pricing with zero hidden fees.</p>
          </div>
        </div>

        {/* Quick 1-Click Scenario Loader Bar */}
        <div className="card" style={{ padding: '16px 20px', marginBottom: 24, background: '#fafafa', border: '1px solid #111111' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <strong style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚡ 1-Click Test Scenarios:</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#666' }}>Instantly populate validated flight, hotel, and pricing data:</p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SCENARIOS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="btn btn--ghost"
                  style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                  onClick={() => loadScenario(s)}
                  title={s.sub}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="alert alert--bad" style={{ marginBottom: 20 }}>
            <span>&#9888; {error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert--good" style={{ marginBottom: 20 }}>
            <span>&#10003; {successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="create__form">
          {/* Section 1: Trip & Route Selection */}
          <section className="card create__section">
            <h2 className="create__section-title">1. Trip &amp; Route Selection (Rule R1)</h2>
            <div className="field">
              <label>Traveler / Family Name</label>
              <input
                type="text"
                placeholder="e.g. Menon family"
                value={form.travelerName}
                onChange={(e) => update('travelerName', e.target.value)}
                required
              />
            </div>

            <div className="create__grid">
              <div className="field">
                <label>Arrival Flight (Airport Catalog &bull; {flights.length} flights)</label>
                <select
                  value={form.flightId}
                  onChange={(e) => {
                    const nextFlightId = e.target.value;
                    update('flightId', nextFlightId);
                    // Clear hotel if it is not served by new flight's airport
                    const f = flights.find((item) => item.id === nextFlightId);
                    const apt = airports.find((a) => a.code === f?.to);
                    const cities = apt?.serves_cities || (apt?.city ? [apt.city] : []);
                    const curHotel = hotels.find((h) => h.id === form.hotelId);
                    if (curHotel && !cities.map(c => c.toLowerCase()).includes(curHotel.city.toLowerCase())) {
                      update('hotelId', '');
                    }
                  }}
                  required
                >
                  <option value="">Select an arriving flight...</option>
                  {flights.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.flight_number} — {f.airline} ({f.from} &rarr; {f.to}, Lands {f.arrival_local?.replace('T', ' ')})
                    </option>
                  ))}
                </select>
                {selectedFlight && (
                  <small style={{ color: '#555', marginTop: 4, display: 'block' }}>
                    Lands at <strong>{selectedFlight.to}</strong> ({arrivalAirport?.name || selectedFlight.to}). Serves: {servedCities.join(', ')}.
                  </small>
                )}
              </div>

              <div className="field">
                <label>
                  Destination Hotel
                  {selectedFlight && servedCities.length > 0 && (
                    <span style={{ fontWeight: 'normal', color: '#666', marginLeft: 6 }}>
                      (Filtered for {servedCities.join(', ')})
                    </span>
                  )}
                </label>
                <select
                  value={form.hotelId}
                  onChange={(e) => update('hotelId', e.target.value)}
                  required
                >
                  <option value="">
                    {selectedFlight ? `Select hotel in ${servedCities.join(' / ')}...` : 'Select flight first...'}
                  </option>
                  {filteredHotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} — {h.city} ({h.area})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Calculated Route Preview Box */}
            {calculatingPrice && (
              <div className="create__route-preview" style={{ opacity: 0.7 }}>
                <label>CALCULATING ROUTE &amp; PRICE BAND...</label>
              </div>
            )}

            {routeInfo && !calculatingPrice && (
              <div className="create__route-preview">
                <label>CALCULATED ROUTE DISTANCE &amp; PRICE BAND (RULE R3)</label>
                <div className="create__route-details">
                  <span>Drive: ~{routeInfo.drive_minutes} mins ({routeInfo.distance_km} km)</span>
                  <strong>&#8377;{Number(routeInfo.price_min_inr).toLocaleString()} &ndash; &#8377;{Number(routeInfo.price_max_inr).toLocaleString()}</strong>
                </div>
              </div>
            )}
          </section>

          {/* Section 2: Passengers & Baggage */}
          <section className="card create__section">
            <h2 className="create__section-title">2. Passengers &amp; Baggage (Rules R1 &amp; R5)</h2>
            <div className="create__grid">
              <div className="field">
                <label>Adults (Min 1)</label>
                <input
                  type="number"
                  min="1"
                  value={form.adults}
                  onChange={(e) => update('adults', Math.max(1, Number(e.target.value)))}
                  required
                />
              </div>
              <div className="field">
                <label>Children (Ages)</label>
                <input
                  type="number"
                  min="0"
                  value={form.childAges.length}
                  onChange={(e) => {
                    const count = Math.max(0, Number(e.target.value));
                    update('childAges', Array(count).fill(6));
                  }}
                />
              </div>
            </div>

            <div className="create__grid">
              <div className="field">
                <label>Large Bags (Suitcases)</label>
                <input
                  type="number"
                  min="0"
                  value={form.largeBags}
                  onChange={(e) => update('largeBags', Math.max(0, Number(e.target.value)))}
                />
              </div>
              <div className="field">
                <label>Small Bags (Backpacks / Carry-ons)</label>
                <input
                  type="number"
                  min="0"
                  value={form.smallBags}
                  onChange={(e) => update('smallBags', Math.max(0, Number(e.target.value)))}
                />
              </div>
            </div>
          </section>

          {/* Section 3: Pickup Time */}
          <section className="card create__section">
            <h2 className="create__section-title">3. Scheduled Pickup (Rule R2 - 60 Min Buffer)</h2>
            <div className="field">
              <label>Pickup Date &amp; Time</label>
              <input
                type="datetime-local"
                value={form.pickupTime}
                onChange={(e) => update('pickupTime', e.target.value)}
                required
              />
              {selectedFlight?.arrival_local ? (
                <small style={{ color: '#555', marginTop: 4, display: 'block' }}>
                  Flight lands at {selectedFlight.arrival_local.replace('T', ' ')} &rarr; Earliest compliant pickup: {toLocalInput(addMinutes(selectedFlight.arrival_local, 60)).replace('T', ' ')}.
                </small>
              ) : (
                <small style={{ color: '#777', marginTop: 4, display: 'block' }}>
                  Must be at least 60 minutes after flight landing.
                </small>
              )}
            </div>
          </section>

          {/* Section 4: Price & Vehicle Class */}
          <section className="card create__section">
            <h2 className="create__section-title">4. Proposed Fare &amp; Vehicle Class (Rule R3)</h2>
            <div className="create__grid">
              <div className="field">
                <label>
                  Proposed Price (INR &#8377;)
                  {routeInfo && (
                    <span style={{ fontWeight: 'normal', color: '#555', marginLeft: 6 }}>
                      (Allowable: &#8377;{Number(routeInfo.price_min_inr).toLocaleString()} &ndash; &#8377;{Number(routeInfo.price_max_inr).toLocaleString()})
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  value={form.travelerPrice}
                  onChange={(e) => update('travelerPrice', Number(e.target.value))}
                  required
                />
              </div>
              <div className="field">
                <label>Preferred Vehicle</label>
                <select
                  value={form.carType}
                  onChange={(e) => update('carType', e.target.value)}
                >
                  {CAR_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Form Actions */}
          <div className="create__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => onNavigate('dashboard')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--solid"
              disabled={submitting || calculatingPrice}
            >
              {submitting ? 'Submitting to Database...' : 'Post Ride Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateRidePage;
