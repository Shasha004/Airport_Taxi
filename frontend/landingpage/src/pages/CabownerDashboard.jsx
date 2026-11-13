import React, { useState, useEffect } from 'react';
import { getRideRequests, dispatchRideRequest } from '../services/api.js';
import '../css/CabownerDashboard.css';

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

function CabownerDashboard({ onNavigate }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState('Toyota Crown Sedan (License: 88-21)');
  const [notification, setNotification] = useState('');

  const loadData = async () => {
    setLoading(true);
    const data = await getRideRequests();
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcceptRide = async (reqId, price) => {
    setNotification('');
    const res = await dispatchRideRequest(
      reqId,
      'Sakura Cabs Tokyo',
      selectedVehicle,
      price
    );
    if (res.ok) {
      setNotification(`Ride ${reqId} accepted & dispatched! 10-Digit Booking: ${res.request.bookingCode}`);
      loadData();
    }
  };

  const openRequests = requests.filter((r) => r.status === 'OPEN');
  const confirmedRequests = requests.filter((r) => r.status === 'CONFIRMED');

  return (
    <div className="page cabowner-page">
      <div className="container">
        {/* Cabowner Head */}
        <div className="dash-head">
          <div>
            <h1 className="dash-head__title">Cabowner Fleet Portal</h1>
            <p className="dash-head__sub">Review traveler ride offers, assign vehicles, and manage flight schedules.</p>
          </div>
          <div className="dash-head__actions">
            <button type="button" className="btn btn--ghost" onClick={loadData}>
              Refresh Queue
            </button>
            <button 
              type="button" 
              className="btn btn--solid"
              onClick={() => onNavigate('traveler')}
            >
              Switch to Traveler View
            </button>
          </div>
        </div>

        {notification && (
          <div className="alert alert--ok" style={{ marginBottom: 20 }}>
            <strong>&#10003; {notification}</strong>
          </div>
        )}

        {/* Supplier Verified Badge Box */}
        <section className="card supplier-info-card">
          <div className="supplier-info-header">
            <div>
              <span className="badge badge--fill">Rule R4 Verified Supplier</span>
              <h2 className="supplier-info-title">Sakura Cabs Tokyo</h2>
            </div>
            <span className="pill pill--pulse">● Active &amp; Ready for Dispatch</span>
          </div>

          <div className="supplier-info-grid">
            <div>
              <label>LICENSED AIRPORTS (RULE R4)</label>
              <span>Narita (NRT) &amp; Haneda (HND)</span>
            </div>
            <div>
              <label>OPERATING HOURS (RULE R4)</label>
              <span>06:00 – 23:00 Daily</span>
            </div>
            <div>
              <label>FLEET CAPACITY (RULE R5)</label>
              <span>8 Sedans, 4 SUVs, 2 Airport Vans</span>
            </div>
            <div>
              <label>PERFORMANCE RATING</label>
              <span>4.9 &#9733; (1,420 completed transfers)</span>
            </div>
          </div>
        </section>

        {/* Incoming Ride Offers Queue */}
        <div className="queue-section">
          <div className="queue-title-row">
            <h2>Incoming Ride Requests ({openRequests.length})</h2>
            <small>Traveler proposals within allowed route pricing band</small>
          </div>

          {loading ? (
            <div className="empty">
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              Loading ride queue...
            </div>
          ) : openRequests.length === 0 ? (
            <div className="card empty">
              <h3>No Pending Ride Requests</h3>
              <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
                All requests have been assigned. Switch to Traveler View to submit a new ride.
              </p>
            </div>
          ) : (
            <div className="ride-list">
              {openRequests.map((req) => (
                <article className="card ride" key={req.id}>
                  <div className="ride__top">
                    <span className="badge">{req.id}</span>
                    <span className="pill">{req.travelerName}</span>
                    <span className="pill pill--pulse">● OPEN OFFER</span>
                  </div>

                  <div className="ride__route">
                    <div className="ride__route-side">
                      <strong>{req.flight?.flight_number || 'FL-401'}</strong>
                      <span>{req.flight?.airline || 'Air India'}</span>
                      <span>{req.flight?.from || 'BLR'} &rarr; {req.flight?.to || 'NRT'}</span>
                    </div>
                    <div className="ride__arrow">&rarr;</div>
                    <div className="ride__route-side ride__route-side--right">
                      <strong>{req.hotel?.name || 'Ueno Garden Inn'}</strong>
                      <span>{req.hotel?.city || 'Tokyo'}</span>
                      <span>{req.hotel?.area || 'Ueno'}</span>
                    </div>
                  </div>

                  <div className="ride__grid">
                    <div>
                      <label>SCHEDULED PICKUP</label>
                      <span>{fmtDate(req.pickupTime)} (Min 60m buffer)</span>
                    </div>
                    <div>
                      <label>PASSENGER GROUP</label>
                      <span>{req.adults} Adults + {req.childAges?.length || 0} Child ({req.carType} preferred)</span>
                    </div>
                    <div>
                      <label>LUGGAGE LOAD</label>
                      <span>{req.largeBags} Large, {req.smallBags} Small</span>
                    </div>
                    <div>
                      <label>ESTIMATED TRIP TIME</label>
                      <span>~90 mins (73.3 km via Narita Expressway)</span>
                    </div>
                  </div>

                  {/* Dispatch Controls */}
                  <div className="dispatch-controls">
                    <div className="field">
                      <label>ASSIGN VEHICLE (RULE R5)</label>
                      <select 
                        value={selectedVehicle} 
                        onChange={(e) => setSelectedVehicle(e.target.value)}
                      >
                        <option value="Toyota Crown Sedan (License: 88-21)">
                          Toyota Crown Sedan (License: 88-21) · 4 Seats, 3L + 2S Bags
                        </option>
                        <option value="Lexus LX Luxury SUV (License: 33-14)">
                          Lexus LX Luxury SUV (License: 33-14) · 6 Seats, 5L + 4S Bags
                        </option>
                      </select>
                    </div>

                    <div className="dispatch-busy-box">
                      <label>SCHEDULED BUSY WINDOW (RULE R6)</label>
                      <span>11:30 AM to 1:00 PM &bull; Non-overlapping booking guaranteed</span>
                    </div>

                    <div className="dispatch-action-row">
                      <div className="dispatch-price-box">
                        <label>OFFERED FARE</label>
                        <span className="dispatch-price">&#8377;{Number(req.travelerPrice).toLocaleString()}</span>
                        <small className="dispatch-range">
                          (Allowed Band: &#8377;{Number(req.route?.price_min_inr || 10200).toLocaleString()} &ndash; &#8377;{Number(req.route?.price_max_inr || 16800).toLocaleString()})
                        </small>
                      </div>

                      <button
                        type="button"
                        className="btn btn--solid"
                        onClick={() => handleAcceptRide(req.id, req.travelerPrice)}
                      >
                        Accept &amp; Dispatch Vehicle
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Confirmed Dispatches */}
        {confirmedRequests.length > 0 && (
          <div className="confirmed-section" style={{ marginTop: 40 }}>
            <h2>Confirmed Dispatches ({confirmedRequests.length})</h2>
            <div className="ride-list" style={{ marginTop: 16 }}>
              {confirmedRequests.map((req) => (
                <article className="card ride" key={req.id}>
                  <div className="ride__top">
                    <span className="badge badge--fill">10-Digit Booking #{req.bookingCode}</span>
                    <span className="pill">{req.travelerName}</span>
                    <span className="pill pill--dot">● DISPATCHED</span>
                  </div>
                  <p style={{ marginTop: 8, fontSize: '0.92rem' }}>
                    Vehicle <strong>{req.assignedCar}</strong> dispatched for flight <strong>{req.flight?.flight_number}</strong>.
                    Agreed Fare: <strong>&#8377;{Number(req.travelerPrice).toLocaleString()}</strong>.
                  </p>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CabownerDashboard;

