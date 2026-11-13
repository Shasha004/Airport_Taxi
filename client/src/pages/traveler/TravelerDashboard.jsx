import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  RefreshCw,
  Plane,
  Building,
  Clock,
  Users,
  Briefcase,
  IndianRupee,
  Navigation,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { rideRequestApi } from '../../api/api';

export default function TravelerDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' or 'open'

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filter === 'open' ? { status: 'open' } : {};
      const res = await rideRequestApi.getRideRequests(params);
      setRequests(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load ride requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header bar */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Traveler Dashboard</h1>
          <p className="dashboard-subtitle">
            Manage your airport ride requests and track status in real-time
          </p>
        </div>
        <div className="dashboard-actions">
          <button
            className="btn-secondary"
            onClick={fetchRequests}
            disabled={loading}
            title="Refresh requests"
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/traveler/create" className="btn-primary">
            <PlusCircle size={18} />
            <span>Create New Ride</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Requests ({requests.length})
        </button>
        <button
          className={`tab-btn ${filter === 'open' ? 'active' : ''}`}
          onClick={() => setFilter('open')}
        >
          Open Requests
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert-banner alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && requests.length === 0 ? (
        <div className="loading-state">
          <RefreshCw size={36} className="spin text-primary" />
          <p>Loading your ride requests...</p>
        </div>
      ) : requests.length === 0 ? (
        /* Empty state */
        <div className="empty-state">
          <Plane size={48} className="empty-icon" />
          <h3>No Ride Requests Found</h3>
          <p>You haven't posted any airport taxi requests yet.</p>
          <Link to="/traveler/create" className="btn-primary" style={{ marginTop: '1rem' }}>
            <PlusCircle size={18} />
            <span>Post Your First Ride</span>
          </Link>
        </div>
      ) : (
        /* Requests Grid */
        <div className="requests-grid">
          {requests.map((req) => {
            const childCount = Array.isArray(req.childAges) ? req.childAges.length : 0;
            const totalPassengers = (req.adults || 0) + childCount;

            return (
              <div key={req.id} className="request-card">
                <div className="request-card-header">
                  <div>
                    <span className="request-id-badge">{req.id}</span>
                    <span className="traveler-name-tag">{req.travelerName || 'Traveler'}</span>
                  </div>
                  <span className={`status-pill status-${req.status}`}>
                    {req.status === 'open' && <span className="status-dot"></span>}
                    {req.status.toUpperCase()}
                  </span>
                </div>

                <div className="request-route-banner">
                  <div className="route-segment">
                    <Plane size={18} className="route-icon" />
                    <div>
                      <span className="segment-label">Arrival Flight</span>
                      <strong className="segment-value">
                        {req.flight?.flight_number || req.flightId}
                      </strong>
                      <span className="segment-sub">
                        {req.flight ? `${req.flight.from} → ${req.flight.to}` : req.flightId}
                      </span>
                    </div>
                  </div>

                  <div className="route-arrow">→</div>

                  <div className="route-segment">
                    <Building size={18} className="route-icon" />
                    <div>
                      <span className="segment-label">Destination Hotel</span>
                      <strong className="segment-value">
                        {req.hotel?.name || req.hotelId}
                      </strong>
                      <span className="segment-sub">
                        {req.hotel ? `${req.hotel.city}, ${req.hotel.area}` : req.hotelId}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="request-details-grid">
                  <div className="detail-item">
                    <Clock size={16} className="detail-icon" />
                    <div>
                      <span className="detail-label">Pickup Time (Local)</span>
                      <span className="detail-val">{formatDate(req.pickupTime || req.pickupAt)}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Users size={16} className="detail-icon" />
                    <div>
                      <span className="detail-label">Passengers</span>
                      <span className="detail-val">
                        {req.adults} {req.adults > 1 ? 'Adults' : 'Adult'}
                        {childCount > 0 && ` + ${childCount} Child (${req.childAges.join(', ')}y)`}
                        {' '}({totalPassengers} seats)
                      </span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Briefcase size={16} className="detail-icon" />
                    <div>
                      <span className="detail-label">Luggage</span>
                      <span className="detail-val">
                        {req.largeBags} Large, {req.smallBags} Small
                      </span>
                    </div>
                  </div>

                  {req.carType && (
                    <div className="detail-item">
                      <Navigation size={16} className="detail-icon" />
                      <div>
                        <span className="detail-label">Car Preference</span>
                        <span className="detail-val">{req.carType}</span>
                      </div>
                    </div>
                  )}

                  {req.route && (
                    <div className="detail-item">
                      <Navigation size={16} className="detail-icon" />
                      <div>
                        <span className="detail-label">Drive Duration</span>
                        <span className="detail-val">
                          ~{req.route.drive_minutes} mins ({req.route.distance_km} km)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="request-card-footer">
                  <div className="price-tag-block">
                    <span className="price-label">Proposed Price:</span>
                    <strong className="price-val">
                      ₹{Number(req.travelerPrice).toLocaleString()}
                    </strong>
                  </div>
                  {req.route && (
                    <div className="range-tag-block">
                      <span className="range-label">Route Range:</span>
                      <span className="range-val">
                        ₹{req.route.price_min_inr.toLocaleString()} – ₹{req.route.price_max_inr.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

