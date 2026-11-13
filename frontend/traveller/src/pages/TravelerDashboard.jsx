import React, { useState, useEffect } from 'react';
import { getRideRequests } from '../services/api.js';
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

function RideCard({ req }) {
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
    </article>
  );
}

function TravelerDashboard({ onNavigate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadData = async () => {
    setLoading(true);
    const data = await getRideRequests();
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

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
              <RideCard key={req.id} req={req} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TravelerDashboard;
