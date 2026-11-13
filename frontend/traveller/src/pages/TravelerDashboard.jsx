import React, { useState, useEffect } from 'react';
import { getRideRequests, reportFlightDelay } from '../services/api.js';
import '../css/TravelerDashboard.css';

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: 'numeric', 
    minute: '2-digit'
  });
}

function RideCard({ req, onOpenDelay }) {
  const flight = req.flight || {
    flight_number: 'FL-401',
    airline: 'Air India',
    from: 'BLR',
    to: 'NRT'
  };
  const hotel = req.hotel || {
    name: 'Ueno Garden Inn',
    city: 'Tokyo',
    area: 'Ueno'
  };
  const route = req.route || {
    drive_minutes: 90,
    distance_km: 73.3,
    price_min_inr: 10200,
    price_max_inr: 16800
  };

  const seats = (req.adults || 2) + (req.childAges?.length || 1);
  const childStr = req.childAges?.length
    ? `${req.childAges.length} Child (${req.childAges.map((a) => a + 'y').join(', ')})`
    : 'No children';

  return (
    <article className="card ride">
      {/* Top Badges */}
      <div className="ride__top">
        <span className="badge">{req.id}</span>
        <span className="pill">{req.travelerName}</span>
        <span className="pill pill--pulse">&#9679; {req.status}</span>
      </div>

      {/* Dashed Route Box */}
      <div className="ride__route">
        <div className="ride__route-side">
          <strong>{flight.flight_number}</strong>
          <span>{flight.airline}</span>
          <span>{flight.from} &rarr; {flight.to}</span>
        </div>
        <div className="ride__arrow">&rarr;</div>
        <div className="ride__route-side ride__route-side--right">
          <strong>{hotel.name}</strong>
          <span>{hotel.city}</span>
          <span>{hotel.area}</span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="ride__grid">
        <div>
          <label>PICKUP</label>
          <span>{fmtDate(req.pickupTime)}</span>
        </div>
        <div>
          <label>PASSENGERS</label>
          <span>{req.adults} Adults + {childStr} ({seats} seats)</span>
        </div>
        <div>
          <label>LUGGAGE</label>
          <span>{req.largeBags} Large, {req.smallBags} Small</span>
        </div>
        <div>
          <label>CAR PREFERENCE</label>
          <span className="car-pill">{req.carType}</span>
        </div>
        <div>
          <label>DRIVE</label>
          <span>~{route.drive_minutes} mins ({route.distance_km} km)</span>
        </div>
      </div>

      {/* Price Footer */}
      <div className="ride__price">
        <span className="ride__price-value">&#8377;{Number(req.travelerPrice).toLocaleString()}</span>
        <span className="ride__price-range">
          &#8377;{Number(route.price_min_inr).toLocaleString()} &ndash; &#8377;{Number(route.price_max_inr).toLocaleString()}
        </span>
      </div>

      <button
        type="button"
        className="btn btn--solid"
        style={{ marginTop: '12px', width: '100%', background: '#000', color: '#fff' }}
        onClick={() => onOpenDelay(req)}
      >
        Flight Delayed? Edit Pickup Schedule
      </button>
    </article>
  );
}

function TravelerDashboard({ onNavigate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [delayModalReq, setDelayModalReq] = useState(null);
  const [delayMins, setDelayMins] = useState(45);
  const [newPickup, setNewPickup] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    const data = await getRideRequests();
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDelayModal = (req) => {
    setDelayModalReq(req);
    setStatusMsg('');
    const base = req.pickupTime;
    if (base) {
      const ms = new Date(base.endsWith('Z') ? base : base + 'Z').getTime();
      const d = new Date(ms + 45 * 60 * 1000);
      setNewPickup(d.toISOString().slice(0, 16));
    }
  };

  const handleDelaySubmit = async (e) => {
    e.preventDefault();
    if (!delayModalReq) return;
    setStatusMsg('Submitting delay update...');
    const res = await reportFlightDelay(delayModalReq.id, {
      delayMinutes: delayMins,
      newPickupAt: newPickup.includes(':00', 14) ? newPickup : `${newPickup}:00`,
      reason: 'Flight delayed'
    });
    if (res.ok) {
      setStatusMsg('Delay update sent! If a supplier accepted before, it is sent to them to accept/reject.');
      setTimeout(() => {
        setDelayModalReq(null);
        loadData();
      }, 1800);
    } else {
      setStatusMsg(`Error: ${res.error}`);
    }
  };

  const openCount = requests.filter((r) => r.status === 'OPEN').length;
  const filteredList = filter === 'open' 
    ? requests.filter((r) => r.status === 'OPEN') 
    : requests;

  return (
    <div className="page dashboard">
      <div className="container">
        {/* Dashboard Header */}
        <div className="dash-head">
          <div>
            <h1 className="dash-head__title">Traveler Dashboard</h1>
            <p className="dash-head__sub">Manage your airport ride requests and track status in real-time.</p>
          </div>
          <div className="dash-head__actions">
            <button type="button" className="btn btn--ghost" onClick={loadData}>
              Refresh
            </button>
            <button 
              type="button" 
              className="btn btn--solid" 
              onClick={() => onNavigate('create')}
            >
              Create New Ride
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="dash-tabs">
          <button
            type="button"
            className={`dash-tab ${filter === 'all' ? 'dash-tab--active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Requests ({requests.length})
          </button>
          <button
            type="button"
            className={`dash-tab ${filter === 'open' ? 'dash-tab--active' : ''}`}
            onClick={() => setFilter('open')}
          >
            Open Requests ({openCount})
          </button>
        </div>

        {/* List of Requests */}
        {loading ? (
          <div className="empty">
            <div className="spinner" style={{ margin: '0 auto 14px' }} />
            Loading your ride requests...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="card empty">
            <div className="empty__icon">&#9992;&#65039;</div>
            <h3>No Ride Requests Found</h3>
            <p style={{ margin: '8px 0 20px', color: 'var(--muted)' }}>
              Post your first airport ride request to get quotes from verified taxi suppliers.
            </p>
            <button 
              type="button" 
              className="btn btn--solid"
              onClick={() => onNavigate('create')}
            >
              Post Your First Ride
            </button>
          </div>
        ) : (
          <div className="ride-list">
            {filteredList.map((req) => (
              <RideCard key={req.id} req={req} onOpenDelay={openDelayModal} />
            ))}
          </div>
        )}

        {/* Modal */}
        {delayModalReq && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: 16
          }} onClick={() => setDelayModalReq(null)}>
            <div className="card" style={{ maxWidth: 500, width: '100%', background: '#fff' }} onClick={(e) => e.stopPropagation()}>
              <h3>Flight Delayed? Edit Pickup Schedule</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--muted)', margin: '8px 0 16px' }}>
                Request #{delayModalReq.id} • Flight {delayModalReq.flight?.flight_number || delayModalReq.flightId}
              </p>

              {statusMsg && (
                <div style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #000', marginBottom: 16, fontSize: '0.85rem' }}>
                  {statusMsg}
                </div>
              )}

              <form onSubmit={handleDelaySubmit}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                    QUICK PRESET DELAYS
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[15, 30, 45, 60, 120].map((m) => (
                      <button
                        key={m}
                        type="button"
                        className="btn btn--ghost"
                        style={{ flex: 1, padding: '6px 4px', fontSize: '0.78rem' }}
                        onClick={() => {
                          setDelayMins(m);
                          const base = delayModalReq.pickupTime;
                          if (base) {
                            const ms = new Date(base.endsWith('Z') ? base : base + 'Z').getTime();
                            const d = new Date(ms + m * 60 * 1000);
                            setNewPickup(d.toISOString().slice(0, 16));
                          }
                        }}
                      >
                        +{m}m
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                    NEW SCHEDULED PICKUP (LOCAL)
                  </label>
                  <input
                    type="datetime-local"
                    value={newPickup}
                    onChange={(e) => setNewPickup(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}
                    required
                  />
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 16 }}>
                  Note: If a supplier previously accepted this ride, they will be given the option:
                  <br />
                  <strong>"Would you like to accept or reject?"</strong>
                  <br />
                  Previous schedule will be replaced with current upon acceptance.
                </p>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn--ghost" onClick={() => setDelayModalReq(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn--solid" style={{ background: '#000', color: '#fff' }}>
                    Submit Delay
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TravelerDashboard;

