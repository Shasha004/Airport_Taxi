import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Car,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Star,
  FileText,
  Bell,
  MapPin,
  XCircle,
  Plane,
} from 'lucide-react';
import { catalogApi, supplierApi, changeRequestApi } from '../../api/api';

export default function SupplierDashboard() {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('TX-JP-01'); // Default to Sakura Cabs
  const [supplierData, setSupplierData] = useState(null);
  const [changeRequests, setChangeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadSuppliersList() {
      try {
        const res = await catalogApi.getSuppliers();
        setSuppliers(res.data || []);
      } catch (err) {
        setError('Failed to load supplier catalog');
      }
    }
    loadSuppliersList();
  }, []);

  const loadDashboardData = async () => {
    if (!selectedSupplierId) return;
    setLoading(true);
    setError(null);
    try {
      const [supRes, chgRes] = await Promise.all([
        supplierApi.getSupplierRequests(selectedSupplierId),
        changeRequestApi.getSupplierChangeRequests(selectedSupplierId),
      ]);
      setSupplierData(supRes);
      setChangeRequests(chgRes.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load supplier dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedSupplierId]);

  const handleReviewChange = async (changeRequestId, action) => {
    const isAccept = action === 'accept';
    const confirmPrompt = isAccept
      ? 'Would you like to ACCEPT this flight delay update? The previous schedule will be deleted and the current delayed schedule will be accepted.'
      : 'Would you like to REJECT this flight delay update? Because the delayed schedule cannot be accommodated, the booking will be CANCELLED and will no longer show as booked.';

    if (!window.confirm(confirmPrompt)) return;

    setActionLoading(`${action}-${changeRequestId}`);
    setActionSuccess(null);
    try {
      await changeRequestApi.reviewChangeRequest(changeRequestId, {
        action,
        reason: isAccept
          ? 'Accepted delayed schedule (Previous schedule replaced with current)'
          : 'Rejected by supplier due to schedule conflict (Booking cancelled)',
      });
      setActionSuccess(
        isAccept
          ? 'Previous schedule deleted. Current delayed schedule successfully accepted!'
          : 'Flight delay schedule rejected. Booking has been cancelled.'
      );
      await loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || 'Review action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingChanges = changeRequests.filter((cr) => cr.status === 'pending');

  return (
    <div className="supplier-dashboard-container">
      {/* Top Header & Supplier Selector */}
      <div className="supplier-top-bar">
        <div>
          <span className="supplier-role-badge">Taxi Supplier Portal • Part 2</span>
          <h1 className="supplier-page-title">Supplier Operations Dashboard</h1>
          <p className="supplier-page-sub">
            Monitor real-time demand, assign vehicles from your fleet, and manage booking changes.
          </p>
        </div>

        <div className="supplier-picker-wrap">
          <label htmlFor="supplierSelect">Act as Supplier:</label>
          <select
            id="supplierSelect"
            className="input-field supplier-select"
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
          >
            {suppliers.map((s) => (
              <option key={s.company_id} value={s.company_id}>
                {s.name} ({s.company_id}) — {s.airports.join(', ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading && !supplierData ? (
        <div className="loading-state">
          <RefreshCw size={36} className="spin text-primary" />
          <p>Loading supplier metrics...</p>
        </div>
      ) : supplierData ? (
        <>
          {/* Supplier Info Banner */}
          <div className="supplier-profile-card">
            <div className="profile-main">
              <div className="profile-icon-box">
                <Building2 size={32} />
              </div>
              <div>
                <h2 className="profile-name">{supplierData.supplier.name}</h2>
                <div className="profile-meta-row">
                  <span className="profile-rating">
                    <Star size={14} className="star-icon" />
                    <span>{supplierData.supplier.rating} Rating</span>
                  </span>
                  <span className="meta-dot">•</span>
                  <span>Operating Airports: <strong>{supplierData.supplier.airports.join(', ')}</strong></span>
                  <span className="meta-dot">•</span>
                  <span>Hours: <strong>{supplierData.supplier.service_from} – {supplierData.supplier.service_until}</strong></span>
                  <span className="meta-dot">•</span>
                  <span>Fleet Size: <strong>{supplierData.supplier.vehicles?.length || 0} Cars</strong></span>
                </div>
              </div>
            </div>

            <button className="btn-secondary" onClick={loadDashboardData} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {actionSuccess && (
            <div className="alert-banner alert-success" style={{ marginBottom: '1.5rem' }}>
              <CheckCircle size={20} />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Urgent Section: Flight Delay Updates Awaiting Supplier Decision */}
          {pendingChanges.length > 0 && (
            <div className="urgent-change-section">
              <div className="urgent-change-header">
                <div className="urgent-title-group">
                  <span className="pulse-alert-dot"></span>
                  <h2 className="urgent-title">⚡ Flight Delay Updates Awaiting Your Decision ({pendingChanges.length})</h2>
                </div>
                <p className="urgent-sub">
                  Travelers on your confirmed bookings have reported delayed flight schedules. Review the updated pickup time below:
                  <br />
                  <strong>If accepted:</strong> The previous booking schedule will be deleted and the current delayed schedule will be accepted.
                </p>
              </div>

              <div className="pending-changes-grid">
                {pendingChanges.map((cr) => (
                  <div key={cr.id} className="urgent-cr-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className="request-id-badge">{cr.id}</span>
                        <strong style={{ marginLeft: '0.5rem', fontSize: '0.95rem' }}>
                          Booking #{cr.bookingNumber} • Traveler: {cr.travelerName}
                        </strong>
                      </div>
                      <span className="status-pill status-pending">FLIGHT DELAY PENDING</span>
                    </div>

                    <div className="cr-compare-box">
                      <div className="cr-compare-col">
                        <span className="tag">Previous Schedule</span>
                        <strong>{cr.currentFlight?.flight_number || cr.currentFlightId}</strong>
                        <span>Lands: {cr.currentFlight?.arrival_local}</span>
                        <span style={{ fontWeight: 600 }}>Pickup: {cr.currentPickupAt}</span>
                      </div>

                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gray-400)' }}>➔</div>

                      <div className="cr-compare-col">
                        <span className="tag highlight">Current (Delayed) Schedule</span>
                        <strong style={{ color: '#000000' }}>
                          {cr.newFlight?.flight_number || cr.currentFlight?.flight_number || cr.currentFlightId}
                        </strong>
                        <span>Lands: {cr.newFlight?.arrival_local || cr.currentFlight?.arrival_local}</span>
                        <strong style={{ color: '#000000', fontSize: '1.05rem' }}>
                          New Pickup: {cr.newPickupAt}
                          {cr.delayMinutes ? ` (+${cr.delayMinutes}m delay)` : ''}
                        </strong>
                      </div>
                    </div>

                    {cr.supplierResponse && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', fontStyle: 'italic' }}>
                        Note: "{cr.supplierResponse}"
                      </div>
                    )}

                    <div className="cr-question-box">
                      <strong>Would you like to accept or reject?</strong>
                      <span>If you accept: Previous schedule will be deleted and current delayed schedule will be accepted. If you reject: Because the delayed flight cannot be accommodated, the booking will be cancelled and will no longer show as booked.</span>
                    </div>

                    <div className="cr-decision-buttons">
                      <button
                        type="button"
                        className="btn-danger-outline"
                        onClick={() => handleReviewChange(cr.id, 'reject')}
                        disabled={actionLoading !== null}
                      >
                        <XCircle size={16} />
                        <span>Reject Delayed Schedule</span>
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleReviewChange(cr.id, 'accept')}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === `accept-${cr.id}` ? (
                          <RefreshCw size={16} className="spin" />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        <span>Accept (Delete Previous & Accept Current)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metric Stats Cards */}
          <div className="metric-cards-grid">
            <div className="metric-card highlight-green">
              <div className="metric-top">
                <span className="metric-lbl">Eligible Ride Requests (R4–R6)</span>
                <Car size={24} className="metric-icon" />
              </div>
              <strong className="metric-val">{supplierData.stats.eligibleRequestsCount}</strong>
              <p className="metric-sub">Open traveler requests ready for car assignment</p>
              <Link
                to={`/supplier/requests?supplierId=${selectedSupplierId}`}
                className="metric-link"
              >
                <span>View Eligible Requests</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-lbl">Submitted Offers</span>
                <FileText size={24} className="metric-icon" />
              </div>
              <strong className="metric-val">{supplierData.stats.submittedOffersCount}</strong>
              <p className="metric-sub">Total active and historical taxi offers submitted</p>
              <Link
                to={`/supplier/requests?supplierId=${selectedSupplierId}`}
                className="metric-link"
              >
                <span>Manage Offers</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="metric-card highlight-orange">
              <div className="metric-top">
                <span className="metric-lbl">Pending Changes (R9)</span>
                <Bell size={24} className="metric-icon" />
              </div>
              <strong className="metric-val">{supplierData.stats.pendingChangeRequestsCount}</strong>
              <p className="metric-sub">Booking flight or pickup adjustments awaiting your review</p>
              <Link
                to={`/supplier/changes?supplierId=${selectedSupplierId}`}
                className="metric-link"
              >
                <span>Review Change Requests</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Fleet Overview */}
          <div className="fleet-overview-section">
            <h3 className="section-title">
              <Car size={20} />
              <span>Your Registered Fleet Vehicles ({supplierData.supplier.vehicles?.length})</span>
            </h3>
            <div className="fleet-grid">
              {supplierData.supplier.vehicles?.map((car) => (
                <div key={car.vehicle_id} className="fleet-car-card">
                  <div className="car-card-top">
                    <span className="car-id-tag">{car.vehicle_id}</span>
                    <span className="car-type-pill">{car.type}</span>
                  </div>
                  <div className="car-specs-list">
                    <div>
                      <span className="spec-lbl">Passenger Seats:</span>
                      <strong>{car.seats} seats</strong>
                    </div>
                    <div>
                      <span className="spec-lbl">Large Bags:</span>
                      <strong>{car.large_bags} max</strong>
                    </div>
                    <div>
                      <span className="spec-lbl">Small Bags:</span>
                      <strong>{car.small_bags} max</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

