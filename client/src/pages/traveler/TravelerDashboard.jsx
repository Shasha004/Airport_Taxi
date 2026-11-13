import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Search,
  Car,
  User,
  LogOut,
  Hash,
} from 'lucide-react';
import { rideRequestApi } from '../../api/api';

const TRAVELER_NAME_KEY = 'airportTaxi_travelerName';
const TRAVELER_ID_KEY = 'airportTaxi_travelerId';

export default function TravelerDashboard() {
  const navigate = useNavigate();
  const [travelerName, setTravelerName] = useState(() => localStorage.getItem(TRAVELER_NAME_KEY) || '');
  const [travelerId, setTravelerId] = useState(() => localStorage.getItem(TRAVELER_ID_KEY) || '');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' or 'open'
  const [searchTerm, setSearchTerm] = useState('');

  // If no identity, redirect to landing
  useEffect(() => {
    if (!travelerName && !travelerId) {
      navigate('/', { replace: true });
    }
  }, [travelerName, travelerId, navigate]);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filter === 'open' ? { status: 'open' } : {};
      const res = await rideRequestApi.getRideRequests(params);
      const all = res.data || [];

      const cleanName = (travelerName || '').trim().toLowerCase();
      const cleanId = (travelerId || '').trim().toLowerCase();

      // Case-insensitive filtering matching either Traveler ID or Traveler Name
      const mine = all.filter((r) => {
        const reqName = (r.travelerName || '').trim().toLowerCase();
        const reqId = (r.travelerId || '').trim().toLowerCase();

        if (cleanId && reqId && cleanId === reqId) return true;
        if (cleanName && reqName && (cleanName === reqName || reqName.includes(cleanName) || cleanName.includes(reqName))) return true;
        if (cleanId && !cleanName && reqId === cleanId) return true;
        if (cleanName && !cleanId && (cleanName === reqName || reqName.includes(cleanName))) return true;

        return false;
      });

      setRequests(mine);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load ride requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (travelerName || travelerId) fetchRequests();
  }, [filter, travelerName, travelerId]);

  const handleSwitchUser = () => {
    localStorage.removeItem(TRAVELER_NAME_KEY);
    localStorage.removeItem(TRAVELER_ID_KEY);
    navigate('/', { replace: true });
  };

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

  // 100% Case-Insensitive Search (lowercase & uppercase friendly)
  const filteredRequests = requests.filter((req) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();

    const idMatch = (req.id || '').toLowerCase().includes(term);
    const travelerIdMatch = (req.travelerId || '').toLowerCase().includes(term);
    const nameMatch = (req.travelerName || '').toLowerCase().includes(term);

    const flightIdMatch = (req.flightId || '').toLowerCase().includes(term);
    const flightNumMatch = (req.flight?.flight_number || '').toLowerCase().includes(term);
    const airlineMatch = (req.flight?.airline || '').toLowerCase().includes(term);
    const originMatch = (req.flight?.from || '').toLowerCase().includes(term);
    const destMatch = (req.flight?.to || '').toLowerCase().includes(term);

    const hotelIdMatch = (req.hotelId || '').toLowerCase().includes(term);
    const hotelNameMatch = (req.hotel?.name || '').toLowerCase().includes(term);
    const cityMatch = (req.hotel?.city || '').toLowerCase().includes(term);
    const areaMatch = (req.hotel?.area || '').toLowerCase().includes(term);

    const carMatch = (req.carType || '').toLowerCase().includes(term);
    const statusMatch = (req.status || '').toLowerCase().includes(term);
    const priceMatch = String(req.travelerPrice || '').includes(term);

    return (
      idMatch ||
      travelerIdMatch ||
      nameMatch ||
      flightIdMatch ||
      flightNumMatch ||
      airlineMatch ||
      originMatch ||
      destMatch ||
      hotelIdMatch ||
      hotelNameMatch ||
      cityMatch ||
      areaMatch ||
      carMatch ||
      statusMatch ||
      priceMatch
    );
  });

  return (
    <div className="dashboard-container">
      {/* Header bar */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Traveler Dashboard</h1>
          <p className="dashboard-subtitle">
            Manage your airport ride requests and track status in real-time
          </p>
          {(travelerName || travelerId) && (
            <div className="traveler-identity-bar">
              <User size={14} />
              <span>Viewing as: <strong>{travelerName || 'Traveler'}</strong></span>
              {travelerId && (
                <span className="traveler-id-tag" style={{ marginLeft: '4px' }}>
                  ID: {travelerId}
                </span>
              )}
              <button className="switch-user-btn" onClick={handleSwitchUser} title="Switch traveler identity">
                <LogOut size={13} />
                <span>Switch</span>
              </button>
            </div>
          )}
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

      {/* Filter Tabs & Search */}
      <div className="filter-and-search-bar">
        <div className="filter-tabs">
          <button
            className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            My Requests ({requests.length})
          </button>
          <button
            className={`tab-btn ${filter === 'open' ? 'active' : ''}`}
            onClick={() => setFilter('open')}
          >
            Open Requests
          </button>
        </div>

        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search request ID, traveler ID, hotel, flight (case-insensitive)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
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
          <p>
            No requests found for identity <strong>{travelerName || travelerId}</strong>. Use 'Create New Ride' to post a transfer.
          </p>
          <Link to="/traveler/create" className="btn-primary" style={{ marginTop: '1rem' }}>
            <PlusCircle size={18} />
            <span>Post Your First Ride</span>
          </Link>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="empty-state">
          <Search size={36} className="empty-icon" />
          <h3>No Matching Requests</h3>
          <p>No ride requests match "{searchTerm}". (Search is case-insensitive)</p>
          <button className="btn-secondary" onClick={() => setSearchTerm('')} style={{ marginTop: '0.75rem' }}>
            Clear Search
          </button>
        </div>
      ) : (
        /* Requests Grid */
        <div className="requests-grid">
          {filteredRequests.map((req) => {
            const childCount = Array.isArray(req.childAges) ? req.childAges.length : 0;
            const totalPassengers = (req.adults || 0) + childCount;

            return (
              <div key={req.id} className="request-card">
                <div className="request-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="request-id-badge">{req.id}</span>
                    {req.travelerId && <span className="traveler-id-tag">ID: {req.travelerId}</span>}
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

                <div className="card-action-bar">
                  <Link
                    to={`/traveler/offers/${req.id}`}
                    className="btn-primary w-full"
                  >
                    <span>View Supplier Offers</span>
                    <Car size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
