import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRideRequests } from '../services/api.js';
import '../css/TravelerDashboard.css';

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

function RideCard({ req }) {
  const { flight, hotel, route } = req;
  const seats = req.adults + (req.childAges?.length || 0);
  const childStr = req.childAges?.length
    ? `${req.childAges.length} Child (${req.childAges.map((a) => a + 'y').join(', ')})`
    : 'No children';

  return (
    <article className="ride">
      <div className="ride__top">
        <span className="badge">{req.id}</span>
        <span className="pill">{req.travelerName}</span>
        <span className="pill pill--pulse">{req.status}</span>
      </div>

      <div className="ride__route">
        <div className="ride__route-side">
          <strong>{flight.flight_number}</strong>
          <span>{flight.airline}</span>
          <span>{flight.from} → {flight.to}</span>
        </div>
        <div className="ride__arrow">➔</div>
        <div className="ride__route-side ride__route-side--right">
          <strong>{hotel.name}</strong>
          <span>{hotel.city}</span>
          <span>{hotel.area}</span>
        </div>
      </div>

      <div className="ride__grid">
        <div><label>Pickup</label><span>{fmtDate(req.pickupTime)}</span></div>
        <div><label>Passengers</label><span>{req.adults} Adults + {childStr} ({seats} seats)</span></div>
        <div><label>Luggage</label><span>{req.largeBags} Large, {req.smallBags} Small</span></div>
        <div><label>Car Preference</label><span className="badge">{req.carType}</span></div>
        <div><label>Drive</label><span>~{route.drive_minutes} mins ({route.distance_km} km)</span></div>
      </div>

      <div className="ride__price">
        <span className="ride__price-value">₹{req.travelerPrice.toLocaleString()}</span>
        <span className="ride__price-range">₹{route.price_min_inr.toLocaleString()} – ₹{route.price_max_inr.toLocaleString()}</span>
      </div>
    </article>
  );
}

function TravelerDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRideRequests();
      setRequests(data);
    } catch (e) {
      setError('Could not load ride requests. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCount = requests.filter((r) => r.status === 'OPEN').length;
  const list = filter === 'open' ? requests.filter((r) => r.status === 'OPEN') : requests;

  return (
    <div className="page dashboard">
      <div className="container">
        <div className="dash-head">
          <div>
            <h1 className="dash-head__title">Traveler Dashboard</h1>
            <p className="dash-head__sub">Manage your airport ride requests and track status in real-time.</p>
          </div>
          <div className="dash-head__actions">
            <button className="btn btn--ghost" onClick={load}>Refresh</button>
            <Link to="/traveler/create" className="btn btn--solid">Create New Ride</Link>
          </div>
        </div>

        <div className="dash-tabs">
          <button
            className={filter === 'all' ? 'dash-tab dash-tab--active' : 'dash-tab'}
            onClick={() => setFilter('all')}
          >
            All Requests ({requests.length})
          </button>
          <button
            className={filter === 'open' ? 'dash-tab dash-tab--active' : 'dash-tab'}
            onClick={() => setFilter('open')}
          >
            Open Requests ({openCount})
          </button>
        </div>

        {error && <div className="alert alert--bad" style={{ marginBottom: 20 }}>{error}</div>}

        {loading ? (
          <div className="empty">
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            Loading your ride requests...
          </div>
        ) : list.length === 0 ? (
          <div className="empty">
            <div className="empty__icon">✈️</div>
            <h3>No Ride Requests Found</h3>
            <p style={{ margin: '8px 0 20px', color: 'var(--muted)' }}>Post your first airport ride request.</p>
            <Link to="/traveler/create" className="btn btn--solid">Post Your First Ride</Link>
          </div>
        ) : (
          <div className="ride-list">
            {list.map((r) => <RideCard key={r.id} req={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default TravelerDashboard;
