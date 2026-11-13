import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plane,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Send,
  Info,
} from 'lucide-react';
import { bookingApi, changeRequestApi, catalogApi } from '../../api/api';

export default function ChangeBookingPage() {
  const { bookingNumber } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [flights, setFlights] = useState([]);
  const [newFlightId, setNewFlightId] = useState('');
  const [newPickupAt, setNewPickupAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [existingChanges, setExistingChanges] = useState([]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingRes, flightsRes] = await Promise.all([
        bookingApi.getBooking(bookingNumber),
        catalogApi.getFlights(),
      ]);
      setBooking(bookingRes.data);
      setFlights(flightsRes.data || []);
      setNewFlightId(bookingRes.data.flightId || '');
      setNewPickupAt(bookingRes.data.pickupAt || '');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [bookingNumber]);

  const selectedNewFlight = flights.find(f => f.flight_id === newFlightId);

  // Compute minimum pickup time based on selected flight landing
  const computeEarliestPickup = () => {
    if (!selectedNewFlight?.arrival_local) return null;
    const landing = new Date(selectedNewFlight.arrival_local.endsWith('Z')
      ? selectedNewFlight.arrival_local
      : selectedNewFlight.arrival_local + 'Z');
    const earliest = new Date(landing.getTime() + 60 * 60 * 1000);
    return earliest.toISOString().slice(0, 16);
  };

  const earliestPickup = computeEarliestPickup();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // At least one change
    if (newFlightId === booking.flightId && newPickupAt === booking.pickupAt) {
      setError('Please select a different flight or a new pickup time.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        newFlightId: newFlightId !== booking.flightId ? newFlightId : undefined,
        newPickupAt: newPickupAt ? (newPickupAt.includes(':00', 14) ? newPickupAt : `${newPickupAt}:00`) : undefined,
      };

      const res = await changeRequestApi.createChangeRequest(bookingNumber, payload);
      setSuccessMsg('Change request submitted successfully! Your supplier will review and accept/reject it.');
      setTimeout(() => {
        navigate(`/traveler/booking/${bookingNumber}`);
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit change request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !booking) {
    return (
      <div className="loading-state">
        <RefreshCw size={36} className="spin text-primary" />
        <p>Loading booking details...</p>
      </div>
    );
  }

  return (
    <div className="change-booking-container">
      <div className="page-header">
        <Link to={`/traveler/booking/${bookingNumber}`} className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Booking #{bookingNumber}</span>
        </Link>
        <h1 className="page-title">Request Booking Change (R9)</h1>
        <p className="page-subtitle">
          Need to switch to a different arrival flight or adjust your pickup schedule? Submit your request below.
        </p>
      </div>

      {error && (
        <div className="alert-banner alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert-banner alert-success">
          <CheckCircle size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {booking && (
        <div className="current-booking-summary">
          <h3>Current Confirmed Booking Details</h3>
          <div className="summary-grid-3">
            <div>
              <span className="lbl">Current Flight:</span>
              <strong>{booking.flight?.flight_number} ({booking.flight?.airline})</strong>
              <span className="sub">Lands: {booking.flight?.arrival_local}</span>
            </div>
            <div>
              <span className="lbl">Current Pickup:</span>
              <strong>{booking.pickupAt}</strong>
            </div>
            <div>
              <span className="lbl">Assigned Vehicle:</span>
              <strong>{booking.carId} ({booking.supplier?.name})</strong>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="change-form">
        <div className="form-section">
          <h2 className="section-title">
            <Plane size={20} />
            <span>Select New Flight (Optional)</span>
          </h2>
          <p className="section-desc">
            Choose an arrival flight landing at the same destination city ({booking?.hotel?.city}).
          </p>

          <div className="form-group">
            <label htmlFor="newFlightSelect">New Arrival Flight</label>
            <select
              id="newFlightSelect"
              className="input-field"
              value={newFlightId}
              onChange={(e) => setNewFlightId(e.target.value)}
            >
              {flights.map((f) => (
                <option key={f.flight_id} value={f.flight_id}>
                  {f.flight_number} ({f.airline}) — {f.from} ➔ {f.to} | Lands: {f.arrival_local}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">
            <Clock size={20} />
            <span>Select New Pickup Time (R2)</span>
          </h2>
          <p className="section-desc">
            Must be at least 60 minutes after the landing time of your flight.
          </p>

          <div className="form-group">
            <label htmlFor="newPickupInput">New Pickup Time (Local)</label>
            <input
              id="newPickupInput"
              type="datetime-local"
              className="input-field"
              value={newPickupAt ? newPickupAt.slice(0, 16) : ''}
              min={earliestPickup || undefined}
              onChange={(e) => setNewPickupAt(e.target.value)}
              required
            />
            {selectedNewFlight && (
              <div className="pickup-info-box">
                <Info size={16} />
                <span>
                  Flight lands at <strong>{selectedNewFlight.arrival_local}</strong>. Earliest valid pickup is{' '}
                  <strong>{earliestPickup}</strong>.
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(`/traveler/booking/${bookingNumber}`)}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Submitting Change Request...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Send Change Request to Supplier</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

