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
  Search,
  Car,
  Edit3,
  X,
  Info,
  Calendar,
} from 'lucide-react';
import { rideRequestApi } from '../../api/api';

export default function TravelerDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' or 'open'
  const [searchTerm, setSearchTerm] = useState('');

  // Flight Delay Modal state
  const [delayModalReq, setDelayModalReq] = useState(null);
  const [delayMinutes, setDelayMinutes] = useState(45);
  const [customPickup, setCustomPickup] = useState('');
  const [delayReason, setDelayReason] = useState('Inbound flight delayed');
  const [submittingDelay, setSubmittingDelay] = useState(false);
  const [delayModalError, setDelayModalError] = useState(null);
  const [delayModalSuccess, setDelayModalSuccess] = useState(null);

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

  // Helper to compute ISO string offset by minutes from a base ISO
  const computeDelayedTime = (baseIso, minutes) => {
    if (!baseIso) return '';
    try {
      const ms = new Date(baseIso.endsWith('Z') ? baseIso : baseIso + 'Z').getTime();
      const newMs = ms + Number(minutes) * 60 * 1000;
      const d = new Date(newMs);
      return d.toISOString().slice(0, 16);
    } catch (e) {
      return baseIso.slice(0, 16);
    }
  };

  const openDelayModal = (req) => {
    setDelayModalReq(req);
    setDelayMinutes(45);
    setDelayReason('Flight delayed due to weather / air traffic');
    setDelayModalError(null);
    setDelayModalSuccess(null);

    const basePickup = req.pickupTime || req.pickupAt;
    const computed = computeDelayedTime(basePickup, 45);
    setCustomPickup(computed);
  };

  const closeDelayModal = () => {
    setDelayModalReq(null);
    setDelayModalError(null);
    setDelayModalSuccess(null);
  };

  const handlePresetDelay = (mins) => {
    setDelayMinutes(mins);
    if (delayModalReq) {
      const basePickup = delayModalReq.pickupTime || delayModalReq.pickupAt;
      setCustomPickup(computeDelayedTime(basePickup, mins));
    }
  };

  const handleSubmitDelay = async (e) => {
    e.preventDefault();
    if (!delayModalReq) return;

    setSubmittingDelay(true);
    setDelayModalError(null);
    setDelayModalSuccess(null);

    try {
      const pickupFormatted = customPickup.includes(':00', 14) ? customPickup : `${customPickup}:00`;
      const res = await rideRequestApi.reportFlightDelay(delayModalReq.id, {
        delayMinutes,
        newPickupAt: pickupFormatted,
        reason: delayReason,
      });

      setDelayModalSuccess(
        res.isBooked
          ? 'Flight delay submitted! Your assigned supplier has been notified with the option to accept or reject.'
          : 'Flight delay recorded! Pickup time has been updated successfully.'
      );

      setTimeout(() => {
        closeDelayModal();
        fetchRequests();
      }, 1800);
    } catch (err) {
      setDelayModalError(err.response?.data?.error || err.message || 'Failed to submit flight delay');
    } finally {
      setSubmittingDelay(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = (req.travelerName || '').toLowerCase().includes(term);
    const idMatch = (req.id || '').toLowerCase().includes(term);
    const flightMatch = (req.flightId || '').toLowerCase().includes(term) ||
      (req.flight?.flight_number || '').toLowerCase().includes(term);
    const hotelMatch = (req.hotelId || '').toLowerCase().includes(term) ||
      (req.hotel?.name || '').toLowerCase().includes(term);
    return nameMatch || idMatch || flightMatch || hotelMatch;
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
            All Requests ({requests.length})
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
            placeholder="Search traveler, request ID, hotel..."
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
          <p>You haven't posted any airport taxi requests yet.</p>
          <Link to="/traveler/create" className="btn-primary" style={{ marginTop: '1rem' }}>
            <PlusCircle size={18} />
            <span>Post Your First Ride</span>
          </Link>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="empty-state">
          <Search size={36} className="empty-icon" />
          <h3>No Matching Requests</h3>
          <p>No ride requests match "{searchTerm}".</p>
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

                {req.booking && (
                  req.status === 'cancelled' || req.booking?.status === 'cancelled' ? (
                    <div className="booking-cancelled-pill" style={{ margin: '0.5rem 0 0.75rem', width: 'fit-content' }}>
                      <XCircle size={14} />
                      <span>BOOKING #{req.booking.bookingNumber} (CANCELLED)</span>
                    </div>
                  ) : (
                    <div className="booking-confirmed-pill" style={{ margin: '0.5rem 0 0.75rem', width: 'fit-content' }}>
                      <CheckCircle size={14} />
                      <span>BOOKING #{req.booking.bookingNumber}</span>
                      {req.booking.supplier && (
                        <span style={{ marginLeft: '0.4rem', color: 'var(--gray-600)' }}>
                          • {req.booking.supplier.name} ({req.booking.carId})
                        </span>
                      )}
                    </div>
                  )
                )}

                {req.pendingChangeRequest && (
                  <div className="delay-alert-banner">
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <div>
                      <strong>Flight Delay Update Pending:</strong> Requested new pickup at{' '}
                      <strong>{formatDate(req.pendingChangeRequest.newPickupAt)}</strong>.
                      Waiting for supplier to accept or reject.
                    </div>
                  </div>
                )}

                {req.changeRequests?.length > 0 && !req.pendingChangeRequest && (
                  <>
                    {req.changeRequests[0].status === 'accepted' && (
                      <div className="delay-success-banner">
                        <CheckCircle size={16} style={{ flexShrink: 0 }} />
                        <span>Supplier accepted delayed schedule. Previous schedule replaced with current.</span>
                      </div>
                    )}
                    {req.changeRequests[0].status === 'rejected' && (
                      <div className="delay-rejected-banner">
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        <span>Supplier rejected delay: "{req.changeRequests[0].supplierResponse || 'Rejected'}". Booking has been cancelled.</span>
                      </div>
                    )}
                  </>
                )}

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

                <div className="card-action-bar" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {req.status === 'cancelled' || req.booking?.status === 'cancelled' ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#fef2f2',
                      border: '1.5px solid #dc2626',
                      borderRadius: '8px',
                      color: '#991b1b',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <XCircle size={16} color="#dc2626" />
                        <span>Booking Cancelled (Delayed flight schedule rejected by supplier)</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {req.booking?.bookingNumber && (
                          <Link
                            to={`/traveler/booking/${req.booking.bookingNumber}`}
                            className="btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                          >
                            Details
                          </Link>
                        )}
                        <Link
                          to="/traveler/create"
                          className="btn-primary"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                        >
                          New Ride
                        </Link>
                      </div>
                    </div>
                  ) : req.hasBooking ? (
                    <>
                      <Link
                        to={`/traveler/booking/${req.booking?.bookingNumber}`}
                        className="btn-secondary"
                        style={{ flex: 1, minWidth: '120px', justifyContent: 'center' }}
                      >
                        <CheckCircle size={16} />
                        <span>#{req.booking?.bookingNumber}</span>
                      </Link>
                      <Link
                        to={`/traveler/track/${req.booking?.bookingNumber}`}
                        className="btn-secondary"
                        style={{
                          flex: 1,
                          minWidth: '130px',
                          justifyContent: 'center',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#fff',
                          border: 'none',
                          fontWeight: 600,
                        }}
                        title="Live GPS route tracking from airport to hotel"
                      >
                        <Navigation size={16} />
                        <span>Track Cab 🗺️</span>
                      </Link>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ flex: 1, minWidth: '150px', justifyContent: 'center' }}
                        onClick={() => openDelayModal(req)}
                      >
                        <Clock size={16} />
                        <span>Flight Delayed? Edit</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to={`/traveler/offers/${req.id}`}
                        className="btn-primary"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <span>View Offers</span>
                        <Car size={16} />
                      </Link>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => openDelayModal(req)}
                      >
                        <Clock size={16} />
                        <span>Flight Delayed? Edit</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Flight Delay Edit Modal */}
      {delayModalReq && (
        <div className="modal-overlay" onClick={closeDelayModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <Clock size={22} className="text-primary" />
                <div>
                  <h3 className="modal-title">Flight Delayed? Update Schedule</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)' }}>
                    Request #{delayModalReq.id} • {delayModalReq.travelerName}
                  </span>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={closeDelayModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitDelay}>
              <div className="modal-body">
                {delayModalError && (
                  <div className="alert-banner alert-error">
                    <AlertCircle size={18} />
                    <span>{delayModalError}</span>
                  </div>
                )}

                {delayModalSuccess && (
                  <div className="alert-banner alert-success">
                    <CheckCircle size={18} />
                    <span>{delayModalSuccess}</span>
                  </div>
                )}

                <div className="delay-info-card">
                  <div className="delay-info-row">
                    <span className="lbl">Arrival Flight:</span>
                    <span className="val">
                      {delayModalReq.flight?.flight_number} ({delayModalReq.flight?.airline}) — Lands {delayModalReq.flight?.arrival_local}
                    </span>
                  </div>
                  <div className="delay-info-row">
                    <span className="lbl">Current Pickup Time:</span>
                    <span className="val">{delayModalReq.pickupTime || delayModalReq.pickupAt}</span>
                  </div>
                  {delayModalReq.hasBooking && (
                    <div className="delay-info-row">
                      <span className="lbl">Assigned Supplier:</span>
                      <span className="val">
                        {delayModalReq.booking?.supplier?.name || delayModalReq.booking?.supplierId} (Car {delayModalReq.booking?.carId})
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="quick-delay-label">
                    <Clock size={16} />
                    <span>Select Flight Delay Offset:</span>
                  </label>
                  <div className="delay-preset-buttons">
                    {[15, 30, 45, 60, 120].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        className={`delay-btn ${delayMinutes === mins ? 'active' : ''}`}
                        onClick={() => handlePresetDelay(mins)}
                      >
                        {mins >= 60 ? `+${mins / 60}h` : `+${mins}m`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="customPickupInput">New Scheduled Pickup Time (Local):</label>
                  <input
                    id="customPickupInput"
                    type="datetime-local"
                    className="input-field"
                    value={customPickup}
                    onChange={(e) => setCustomPickup(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--gray-600)', marginTop: '0.25rem', display: 'block' }}>
                    Rule R2: Pickup must be at least 60 minutes after flight landing ({delayModalReq.flight?.arrival_local}).
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="delayReasonInput">Delay Reason / Notes for Supplier:</label>
                  <input
                    id="delayReasonInput"
                    type="text"
                    className="input-field"
                    placeholder="e.g. Inbound flight delayed due to weather / ATC"
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                  />
                </div>

                <div className="delay-notice-box">
                  <Info size={20} style={{ flexShrink: 0 }} />
                  <div>
                    {delayModalReq.hasBooking ? (
                      <span>
                        <strong>Supplier Notification:</strong> Your assigned supplier{' '}
                        (<em>{delayModalReq.booking?.supplier?.name}</em>) will receive this update with the option:
                        <br />
                        <strong>"Would you like to accept or reject?"</strong>
                        <br />
                        If accepted: previous schedule will be deleted and current delayed schedule accepted.
                      </span>
                    ) : (
                      <span>
                        <strong>Immediate Request Update:</strong> Your ride request pickup schedule will be updated directly.
                        Suppliers reviewing your request will see the new delayed schedule.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeDelayModal} disabled={submittingDelay}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submittingDelay}>
                  {submittingDelay ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      <span>Updating Schedule...</span>
                    </>
                  ) : (
                    <>
                      <Clock size={16} />
                      <span>Submit Flight Delay Update</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
