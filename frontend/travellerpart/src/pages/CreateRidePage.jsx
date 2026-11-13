import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFlights, getHotels, getPriceRange, createRideRequest } from '../services/api.js';
import '../css/CreateRidePage.css';

const CAR_TYPES = ['ANY', 'HATCHBACK', 'SEDAN', 'SUV', 'BUS'];

const MENON = {
  travelerName: 'Menon family',
  flightId: 'FL-401',
  hotelId: 'HTL-TYO-004',
  adults: 2,
  childAges: [6],
  largeBags: 3,
  smallBags: 2,
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

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

export default function CreateRidePage() {
  const nav = useNavigate();
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
    carType: 'ANY'
  });

  const [route, setRoute] = useState({ state: 'idle' }); // idle | loading | ok | error
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getFlights().then(setFlights);
    getHotels().then(setHotels);
  }, []);

  const flight = useMemo(() => flights.find((f) => f.id === form.flightId), [flights, form.flightId]);
  const hotel = useMemo(() => hotels.find((h) => h.id === form.hotelId), [hotels, form.hotelId]);

  // Live price range (R1 / R3)
  useEffect(() => {
    if (!form.flightId || !form.hotelId) {
      setRoute({ state: 'idle' });
      return;
    }
    setRoute({ state: 'loading' });
    getPriceRange(form.flightId, form.hotelId).then((res) => {
      if (res.ok) setRoute({ state: 'ok', data: res });
      else setRoute({ state: 'error', error: res.error, rule: res.rule });
    });
  }, [form.flightId, form.hotelId]);

  // Auto-set pickup to landing + 60 min (R2)
  useEffect(() => {
    if (flight) {
      const earliest = addMinutes(flight.arrival_local, 60);
      setForm((f) => ({ ...f, pickupTime: toLocalInput(earliest) }));
    }
  }, [flight]);

  const earliest = flight ? addMinutes(flight.arrival_local, 60) : null;

  const priceOk = route.state === 'ok'
    && form.travelerPrice >= route.data.price_min_inr
    && form.travelerPrice <= route.data.price_max_inr;

  const canSubmit = route.state === 'ok' && priceOk && form.travelerName.trim() !== '' && form.adults >= 1;

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const addChild = () => setForm((f) => ({ ...f, childAges: [...f.childAges, 5] }));
  const removeChild = (i) => setForm((f) => ({ ...f, childAges: f.childAges.filter((_, idx) => idx !== i) }));
  const setChildAge = (i, age) => setForm((f) => {
    const next = [...f.childAges];
    next[i] = age;
    return { ...f, childAges: next };
  });

  const loadDemo = () => {
    setForm({ ...MENON, pickupTime: '' });
    setCreated(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await createRideRequest(form);
    setSubmitting(false);
    if (res.ok) setCreated(res.request);
    else setError(res.error);
  };

  return (
    <div className="page create">
      <div className="container create__wrap">
        <div className="create__head">
          <Link to="/traveler" className="create__back">← Back to Dashboard</Link>
          <h1 className="create__title">Request an Airport Taxi</h1>
          <button className="btn btn--solid create__demo" onClick={loadDemo}>
            Load Menon Family Demo (FL-401)
          </button>
        </div>

        {error && <div className="alert alert--bad create__alert">{error}</div>}

        {created && (
          <div className="alert alert--ok create__success">
            <strong>Ride request created!</strong> Request ID: <span className="badge">{created.id}</span>
            <div className="create__success-actions">
              <Link to="/traveler" className="btn btn--solid">View Dashboard</Link>
              <button className="btn btn--ghost" onClick={() => { setCreated(null); setForm({ travelerName: '', flightId: '', hotelId: '', adults: 1, childAges: [], largeBags: 0, smallBags: 0, pickupTime: '', travelerPrice: 0, carType: 'ANY' }); }}>
                Post Another Ride
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="create__form">
          {/* Section 1: Flight & Hotel */}
          <section className="card create__section">
            <h2 className="create__section-title">1. Flight &amp; Hotel</h2>

            <div className="field">
              <label>Traveler / Group Name</label>
              <input type="text" value={form.travelerName} onChange={(e) => update('travelerName', e.target.value)} placeholder="e.g. Menon family" />
            </div>

            <div className="field">
              <label>Arrival Flight</label>
              <select value={form.flightId} onChange={(e) => update('flightId', e.target.value)}>
                <option value="">Select arrival flight…</option>
                {flights.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.flight_number} ({f.airline}) — {f.from} ➔ {f.to} | Lands: {fmtDateTime(f.arrival_local)}
                  </option>
                ))}
              </select>
              {flight && (
                <div className="pill create__preview">
                  {flight.airline} • {flight.from} ➔ {flight.to} • Lands {fmtDateTime(flight.arrival_local)}
                </div>
              )}
            </div>

            <div className="field">
              <label>Destination Hotel</label>
              <select value={form.hotelId} onChange={(e) => update('hotelId', e.target.value)}>
                <option value="">Select destination hotel…</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>{h.name} — {h.city} ({h.area})</option>
                ))}
              </select>
              {hotel && (
                <div className="pill create__preview">
                  {hotel.city} • {hotel.area} • ★ {hotel.rating}
                </div>
              )}
            </div>

            {/* Route status */}
            <div className="create__route">
              {route.state === 'idle' && <div className="alert">Select a flight and hotel to verify the route.</div>}
              {route.state === 'loading' && (
                <div className="alert" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="spinner" /> Verifying route compatibility &amp; calculating price range...
                </div>
              )}
              {route.state === 'error' && (
                <div className="alert alert--bad">
                  <strong>R1 error:</strong> {route.error}
                </div>
              )}
              {route.state === 'ok' && (
                <div className="create__route-ok">
                  <h3>Route verified ✓</h3>
                  <div className="create__route-grid">
                    <div><label>Airport</label><span>{route.data.airport}</span></div>
                    <div><label>City / Area</label><span>{route.data.city} / {route.data.area}</span></div>
                    <div><label>Distance</label><span>{route.data.distance_km} km</span></div>
                    <div><label>Duration</label><span>{route.data.drive_minutes} mins</span></div>
                    <div className="create__route-price">
                      <label>Allowed Price Range</label>
                      <span>₹{route.data.price_min_inr.toLocaleString()} – ₹{route.data.price_max_inr.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Passengers & Baggage */}
          <section className="card create__section">
            <h2 className="create__section-title">2. Passengers &amp; Baggage</h2>

            <div className="field">
              <label>Adults (Aged 18+)</label>
              <input type="number" min="1" step="1" value={form.adults} onChange={(e) => update('adults', Math.max(1, Number(e.target.value)))} />
            </div>

            <div className="field">
              <div className="create__children-head">
                <label>Children (Aged 0–17)</label>
                <button type="button" className="btn btn--ghost create__add" onClick={addChild}>+ Add Child</button>
              </div>
              {form.childAges.length === 0 ? (
                <small>No children in travel group.</small>
              ) : (
                <div className="create__children">
                  {form.childAges.map((age, i) => (
                    <div className="create__child" key={i}>
                      <label>Child #{i + 1} Age</label>
                      <input type="number" min="0" max="17" value={age} onChange={(e) => setChildAge(i, Number(e.target.value))} />
                      <button type="button" className="create__remove" onClick={() => removeChild(i)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="create__bags">
              <div className="field">
                <label>Large Bags</label>
                <input type="number" min="0" step="1" value={form.largeBags} onChange={(e) => update('largeBags', Math.max(0, Number(e.target.value)))} />
              </div>
              <div className="field">
                <label>Small Bags</label>
                <input type="number" min="0" step="1" value={form.smallBags} onChange={(e) => update('smallBags', Math.max(0, Number(e.target.value)))} />
              </div>
            </div>
          </section>

          {/* Section 3: Pickup Time */}
          <section className="card create__section">
            <h2 className="create__section-title">3. Pickup Time</h2>
            <div className="field">
              <label>Pickup Time</label>
              <input type="datetime-local" value={form.pickupTime} min={earliest ? toLocalInput(earliest) : ''} onChange={(e) => update('pickupTime', e.target.value)} />
              <small>Must be at least 60 minutes after landing.</small>
            </div>
            {flight && earliest && (
              <div className="alert create__pickup-info">
                Flight lands at <strong>{fmtDateTime(flight.arrival_local)}</strong>. Earliest valid pickup: <strong>{fmtDateTime(toLocalInput(earliest))}</strong>.
              </div>
            )}
          </section>

          {/* Section 4: Price & Preferences */}
          <section className="card create__section">
            <h2 className="create__section-title">4. Proposed Price &amp; Preferences</h2>

            <div className="field">
              <label>Proposed Price (INR ₹)</label>
              <div className="create__price">
                <span className="create__price-prefix">₹</span>
                <input type="number" min="0" value={form.travelerPrice} onChange={(e) => update('travelerPrice', Number(e.target.value))} />
              </div>
              {route.state === 'ok' && (
                <div className="create__price-status">
                  <span className={priceOk ? 'pill pill--dot' : 'pill pill--pulse'}>{priceOk ? '✓ Within range' : '✕ Out of range'}</span>
                  <small>Allowed Range: ₹{route.data.price_min_inr.toLocaleString()} to ₹{route.data.price_max_inr.toLocaleString()}</small>
                </div>
              )}
            </div>

            <div className="field">
              <label>Car Type Preference</label>
              <select value={form.carType} onChange={(e) => update('carType', e.target.value)}>
                {CAR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </section>

          {/* Actions */}
          <div className="create__actions">
            <Link to="/traveler" className="btn btn--ghost">Cancel</Link>
            <button type="submit" className="btn btn--solid" disabled={!canSubmit || submitting}>
              {submitting ? <><div className="spinner" /> Submitting…</> : 'Submit Ride Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
