import React, { useState, useEffect } from 'react';
import { getFlights, getHotels, getPriceRange, createRideRequest } from '../services/api.js';
import '../css/CreateRidePage.css';

const CAR_TYPES = ['ANY', 'HATCHBACK', 'SEDAN', 'SUV', 'BUS'];

const MENON_SCENARIO = {
  travelerName: 'Menon family',
  flightId: 'FL-401',
  hotelId: 'HTL-TYO-004',
  adults: 2,
  childAges: [6],
  largeBags: 3,
  smallBags: 2,
  pickupTime: '2027-04-10T11:30',
  travelerPrice: 12000,
  carType: 'SEDAN'
};

function addMinutes(iso, mins) {
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getFlights().then(setFlights);
    getHotels().then(setHotels);
  }, []);

  const selectedFlight = flights.find((f) => f.id === form.flightId);
  const selectedHotel = hotels.find((h) => h.id === form.hotelId);

  // Compute Route Price Bounds (Rule R3)
  useEffect(() => {
    if (form.flightId && form.hotelId) {
      getPriceRange(form.flightId, form.hotelId).then((res) => {
        if (res.ok) {
          setRouteInfo(res);
          if (form.travelerPrice === 0) {
            setForm((prev) => ({ ...prev, travelerPrice: res.price_min_inr }));
          }
        }
      });
    }
  }, [form.flightId, form.hotelId]);

  // Enforce 60m pickup buffer after arrival (Rule R2)
  useEffect(() => {
    if (selectedFlight && !form.pickupTime) {
      const earliest = addMinutes(selectedFlight.arrival_local, 60);
      setForm((prev) => ({ ...prev, pickupTime: toLocalInput(earliest) }));
    }
  }, [selectedFlight]);

  const update = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const loadDemo = () => {
    setForm(MENON_SCENARIO);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.adults < 1) {
      setError('Rule R1 Error: At least 1 adult passenger is required.');
      return;
    }

    if (routeInfo) {
      if (form.travelerPrice < routeInfo.price_min_inr || form.travelerPrice > routeInfo.price_max_inr) {
        setError(`Rule R3 Error: Price must be between ₹${routeInfo.price_min_inr.toLocaleString()} and ₹${routeInfo.price_max_inr.toLocaleString()}.`);
        return;
      }
    }

    setSubmitting(true);
    const res = await createRideRequest(form);
    setSubmitting(false);

    if (res.ok) {
      onNavigate('traveler');
    } else {
      setError(res.error || 'Failed to submit ride request.');
    }
  };

  return (
    <div className="page create-page">
      <div className="container create__wrap">
        <div className="create__head">
          <button type="button" className="create__back" onClick={() => onNavigate('traveler')}>
            &larr; Back to Dashboard
          </button>
          <div className="create__title-box">
            <h1 className="create__title">Request an Airport Taxi</h1>
            <p className="create__sub">Submit your travel details and proposed price for supplier bids.</p>
          </div>
          <button type="button" className="btn btn--solid create__demo" onClick={loadDemo}>
            Load Menon Family Demo (FL-401)
          </button>
        </div>

        {error && (
          <div className="alert alert--bad" style={{ marginBottom: 20 }}>
            <span>&#9888; {error}</span>
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
                <label>Arrival Flight (Airport Catalog)</label>
                <select
                  value={form.flightId}
                  onChange={(e) => update('flightId', e.target.value)}
                  required
                >
                  <option value="">Select an arriving flight...</option>
                  {flights.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.flight_number} — {f.airline} ({f.from} &rarr; {f.to}, Lands {f.arrival_local.replace('T', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Destination Hotel</label>
                <select
                  value={form.hotelId}
                  onChange={(e) => update('hotelId', e.target.value)}
                  required
                >
                  <option value="">Select destination hotel...</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} — {h.city} ({h.area})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {routeInfo && (
              <div className="create__route-preview">
                <label>CALCULATED ROUTE DISTANCE &amp; PRICE BAND (RULE R3)</label>
                <div className="create__route-details">
                  <span>Drive: ~{routeInfo.drive_minutes} mins ({routeInfo.distance_km} km)</span>
                  <strong>&#8377;{routeInfo.price_min_inr.toLocaleString()} &ndash; &#8377;{routeInfo.price_max_inr.toLocaleString()}</strong>
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
                <label>Children (0–17 yrs)</label>
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
                <label>Large Bags</label>
                <input
                  type="number"
                  min="0"
                  value={form.largeBags}
                  onChange={(e) => update('largeBags', Math.max(0, Number(e.target.value)))}
                />
              </div>
              <div className="field">
                <label>Small Bags</label>
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
              <small>Flight lands at Narita at 10:30 &rarr; Earliest compliant pickup is 11:30.</small>
            </div>
          </section>

          {/* Section 4: Price & Vehicle */}
          <section className="card create__section">
            <h2 className="create__section-title">4. Proposed Fare &amp; Vehicle Class</h2>
            <div className="create__grid">
              <div className="field">
                <label>Proposed Price (INR &#8377;)</label>
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

          {/* Actions */}
          <div className="create__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => onNavigate('traveler')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--solid"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Post Ride Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateRidePage;

