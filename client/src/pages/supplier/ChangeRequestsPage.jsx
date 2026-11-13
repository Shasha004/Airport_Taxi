import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Plane,
  Clock,
  Car,
} from 'lucide-react';
import { changeRequestApi, catalogApi } from '../../api/api';

export default function ChangeRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const supplierId = searchParams.get('supplierId') || 'TX-JP-01';

  const [suppliers, setSuppliers] = useState([]);
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const res = await catalogApi.getSuppliers();
        setSuppliers(res.data || []);
      } catch (err) {}
    }
    loadSuppliers();
  }, []);

  const loadChanges = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await changeRequestApi.getSupplierChangeRequests(supplierId);
      setChanges(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load change requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChanges();
  }, [supplierId]);

  const handleReview = async (changeRequestId, action) => {
    const promptMsg = action === 'accept'
      ? 'Are you sure you want to ACCEPT this booking change? The booking flight and pickup time will be updated.'
      : 'Are you sure you want to REJECT this booking change? The original booking will be preserved.';

    if (!window.confirm(promptMsg)) return;

    setActionLoading(`${action}-${changeRequestId}`);
    try {
      await changeRequestApi.reviewChangeRequest(changeRequestId, {
        action,
        reason: action === 'accept' ? 'Accepted by supplier' : 'Schedule conflict or unserviceable time',
      });
      await loadChanges();
    } catch (err) {
      alert(err.response?.data?.error || 'Review action failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="change-requests-page-container">
      <div className="page-header">
        <Link to={`/supplier?supplierId=${supplierId}`} className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Supplier Dashboard</span>
        </Link>
        <div className="header-row">
          <div>
            <h1 className="page-title">Booking Change Requests (R9)</h1>
            <p className="page-subtitle">
              Review flight and pickup adjustment requests submitted by travelers for your confirmed rides.
            </p>
          </div>

          <div className="supplier-filter-box">
            <span className="filter-lbl">Supplier:</span>
            <select
              className="input-field"
              value={supplierId}
              onChange={(e) => setSearchParams({ supplierId: e.target.value })}
            >
              {suppliers.map((s) => (
                <option key={s.company_id} value={s.company_id}>
                  {s.name} ({s.company_id})
                </option>
              ))}
            </select>
            <button className="btn-secondary" onClick={loadChanges} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <RefreshCw size={36} className="spin text-primary" />
          <p>Loading change requests...</p>
        </div>
      ) : changes.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} className="empty-icon" />
          <h3>No Change Requests Found</h3>
          <p>No travelers have requested modifications to confirmed bookings for this supplier.</p>
        </div>
      ) : (
        <div className="changes-list">
          {changes.map((cr) => {
            const isPending = cr.status === 'pending';

            return (
              <div key={cr.id} className={`change-request-card status-border-${cr.status}`}>
                <div className="cr-top">
                  <div>
                    <span className="request-id-badge">{cr.id}</span>
                    <span className="booking-ref-tag">Booking #{cr.bookingNumber}</span>
                  </div>
                  <span className={`status-pill status-${cr.status}`}>
                    {cr.status.toUpperCase()}
                  </span>
                </div>

                <div className="cr-comparison-grid">
                  <div className="cr-col current">
                    <span className="col-tag">Original Booking Details</span>
                    <div className="cr-field">
                      <Plane size={16} />
                      <span>Flight: <strong>{cr.currentFlight?.flight_number || cr.currentFlightId}</strong> ({cr.currentFlight?.arrival_local})</span>
                    </div>
                    <div className="cr-field">
                      <Clock size={16} />
                      <span>Pickup: <strong>{cr.currentPickupAt}</strong></span>
                    </div>
                    <div className="cr-field">
                      <Car size={16} />
                      <span>Vehicle: <strong>{cr.carId}</strong></span>
                    </div>
                  </div>

                  <div className="cr-divider">➔</div>

                  <div className="cr-col requested">
                    <span className="col-tag requested-tag">Requested Adjustments</span>
                    <div className="cr-field">
                      <Plane size={16} />
                      <span>
                        Flight:{' '}
                        {cr.newFlightId ? (
                          <strong className="text-highlight">
                            {cr.newFlight?.flight_number || cr.newFlightId} ({cr.newFlight?.arrival_local})
                          </strong>
                        ) : (
                          <span className="text-muted">Unchanged</span>
                        )}
                      </span>
                    </div>
                    <div className="cr-field">
                      <Clock size={16} />
                      <span>
                        Pickup:{' '}
                        {cr.newPickupAt ? (
                          <strong className="text-highlight">{cr.newPickupAt}</strong>
                        ) : (
                          <span className="text-muted">Unchanged</span>
                        )}
                      </span>
                    </div>
                    {cr.supplierResponse && (
                      <div className="cr-field response">
                        <span>Response note: <em>"{cr.supplierResponse}"</em></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {isPending && (
                  <div className="cr-actions">
                    <button
                      className="btn-danger-outline"
                      onClick={() => handleReview(cr.id, 'reject')}
                      disabled={actionLoading !== null}
                    >
                      <XCircle size={16} />
                      <span>Reject Change</span>
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => handleReview(cr.id, 'accept')}
                      disabled={actionLoading !== null}
                    >
                      <CheckCircle size={16} />
                      <span>Accept Change (R9)</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
