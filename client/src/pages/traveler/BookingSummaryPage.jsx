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
} from 'lucide-react';
import { bookingApi } from '../../api/api';

export default function BookingSummaryPage() {
  const { bookingNumber: routeBookingNumber } = useParams();
  const navigate = useNavigate();

  const [searchNumber, setSearchNumber] = useState(routeBookingNumber || '');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(Boolean(routeBookingNumber));
  const [error, setError] = useState(null);

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

      {/* Confirmed Booking Summary Display */}
      {booking && !loading && (
        <div className="booking-card">
          <div className="booking-card-top">
            <div className="booking-badge-group">
              <span className="booking-confirmed-pill">
                <CheckCircle size={16} />
                <span>CONFIRMED BOOKING</span>
              </span>
              <span className="booking-ref">#{booking.bookingNumber}</span>
            </div>
            <Link
              to={`/traveler/booking/${booking.bookingNumber}/change`}
              className="btn-secondary"
            >
              <Edit3 size={16} />
              <span>Request Flight / Pickup Change (R9)</span>
            </Link>
          </div>

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
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

