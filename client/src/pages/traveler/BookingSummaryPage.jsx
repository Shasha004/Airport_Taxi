import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle,
  Plane,
  Building,
  Car,
  Clock,
  IndianRupee,
  Calendar,
  AlertCircle,
  RefreshCw,
  Search,
  ArrowRight,
  Edit3,
  XCircle,
  X,
} from 'lucide-react';
import { bookingApi } from '../../api/api';

export default function BookingSummaryPage() {
  const { bookingNumber: routeBookingNumber } = useParams();
  const navigate = useNavigate();

  const [searchNumber, setSearchNumber] = useState(routeBookingNumber || '');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(Boolean(routeBookingNumber));
  const [error, setError] = useState(null);

  // Cancel state
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const fetchBooking = async (numberToFetch) => {
    if (!numberToFetch) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bookingApi.getBooking(numberToFetch);
      setBooking(res.data);
    } catch (err) {
      setBooking(null);
      if (err.response?.data?.error?.code === 'BOOKING_NOT_FOUND') {
        setError('Booking not found. Please verify your 10-digit booking reference number.');
      } else {
        setError(err.response?.data?.error?.message || err.message || 'Failed to retrieve booking.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routeBookingNumber) {
      setSearchNumber(routeBookingNumber);
      fetchBooking(routeBookingNumber);
    }
  }, [routeBookingNumber]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchNumber.trim()) return;
    navigate(`/traveler/booking/${searchNumber.trim()}`);
  };

  const handleCancelBooking = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await bookingApi.cancelBooking(booking.bookingNumber);
      setBooking(res.data);
      setConfirmCancel(false);
    } catch (err) {
      setCancelError(err.response?.data?.error || err.message || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  const isCancelled = booking?.status === 'cancelled';
  const isConfirmed = booking?.status === 'confirmed';

  return (
    <div className="booking-summary-container">
      {/* Lookup Bar */}
      <div className="booking-lookup-card">
        <h3>Retrieve Your Booking</h3>
        <p>Enter your unique 10-digit booking confirmation reference number.</p>
        <form onSubmit={handleSearch} className="lookup-form">
          <div className="search-input-wrap">
            <Search size={18} className="search-input-icon" />
            <input
              type="text"
              className="input-field"
              placeholder="e.g. 9313700530"
              maxLength="10"
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading || searchNumber.length !== 10}>
            <span>Lookup Booking</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>

      {loading && (
        <div className="loading-state">
          <RefreshCw size={36} className="spin text-primary" />
          <p>Retrieving booking #{routeBookingNumber}...</p>
        </div>
      )}

      {error && (
        <div className="alert-banner alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Booking Summary Display */}
      {booking && !loading && (
        <div className="booking-card">
          <div className="booking-card-top">
            <div className="booking-badge-group">
              {isCancelled ? (
                <span className="booking-cancelled-pill">
                  <XCircle size={16} />
                  <span>CANCELLED</span>
                </span>
              ) : (
                <span className="booking-confirmed-pill">
                  <CheckCircle size={16} />
                  <span>CONFIRMED BOOKING</span>
                </span>
              )}
              <span className="booking-ref">#{booking.bookingNumber}</span>
            </div>

            {/* Action buttons – only shown for confirmed bookings */}
            {isConfirmed && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <Link
                  to={`/traveler/booking/${booking.bookingNumber}/change`}
                  className="btn-secondary"
                >
                  <Edit3 size={16} />
                  <span>Request Flight / Pickup Change (R9)</span>
                </Link>
                <button
                  className="btn-danger"
                  onClick={() => { setConfirmCancel(true); setCancelError(null); }}
                >
                  <XCircle size={16} />
                  <span>Cancel Booking</span>
                </button>
              </div>
            )}
          </div>

          {/* Cancel confirmation inline */}
          {confirmCancel && isConfirmed && (
            <div className="cancel-confirm-box">
              <AlertCircle size={20} className="text-danger" />
              <div style={{ flex: 1 }}>
                <strong>Are you sure you want to cancel this booking?</strong>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  This will reopen the ride request so other suppliers can re-offer. This action cannot be undone.
                </p>
                {cancelError && (
                  <p style={{ color: 'var(--color-danger)', marginTop: '0.4rem', fontSize: '0.875rem' }}>{cancelError}</p>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button
                    className="btn-danger"
                    onClick={handleCancelBooking}
                    disabled={cancelling}
                  >
                    {cancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => { setConfirmCancel(false); setCancelError(null); }}
                    disabled={cancelling}
                  >
                    <X size={14} />
                    Keep Booking
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="booking-hero-route">
            <div className="b-segment">
              <Plane size={24} className="text-primary" />
              <div>
                <span className="b-lbl">Arrival Flight</span>
                <strong className="b-val">{booking.flight?.flight_number || booking.flightId}</strong>
                <span className="b-sub">{booking.flight ? `${booking.flight.airline} (${booking.flight.from} ➔ ${booking.flight.to})` : booking.flightId}</span>
              </div>
            </div>

            <div className="b-arrow">➔</div>

            <div className="b-segment">
              <Building size={24} className="text-primary" />
              <div>
                <span className="b-lbl">Destination Hotel</span>
                <strong className="b-val">{booking.hotel?.name || booking.hotelId}</strong>
                <span className="b-sub">{booking.hotel ? `${booking.hotel.city}, ${booking.hotel.area}` : booking.hotelId}</span>
              </div>
            </div>
          </div>

          <div className="booking-grid">
            <div className="b-info-item">
              <Clock size={18} className="text-muted" />
              <div>
                <span className="b-lbl">Pickup Time (Local)</span>
                <strong>{booking.pickupAt}</strong>
              </div>
            </div>

            <div className="b-info-item">
              <Car size={18} className="text-muted" />
              <div>
                <span className="b-lbl">Assigned Taxi & Fleet</span>
                <strong>{booking.supplier?.name}</strong>
                <span className="b-sub">Vehicle: {booking.carId} ({booking.car?.type}, {booking.car?.seats} seats)</span>
              </div>
            </div>

            <div className="b-info-item">
              <Calendar size={18} className="text-muted" />
              <div>
                <span className="b-lbl">Vehicle Busy Window (R6)</span>
                <strong>{booking.busyInterval?.start} to {booking.busyInterval?.end}</strong>
                <span className="b-sub">Drive: ~{booking.driveMinutes} mins each way</span>
              </div>
            </div>

            <div className="b-info-item highlight-price">
              <IndianRupee size={20} className="text-success" />
              <div>
                <span className="b-lbl">Confirmed Total Price</span>
                <strong className="price-big">₹{Number(booking.price).toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <div className="booking-footer-note">
            <p>
              Your booking reference <strong>#{booking.bookingNumber}</strong> is stored securely in SQLite and persists after application restarts.
              {isCancelled && <span style={{ color: 'var(--color-danger)', marginLeft: '0.5rem' }}>This booking has been cancelled.</span>}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
