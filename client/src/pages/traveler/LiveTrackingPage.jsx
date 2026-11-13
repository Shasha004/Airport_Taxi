import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  PhoneCall,
  Share2,
  CheckCircle,
} from 'lucide-react';
import { bookingApi } from '../../api/api';
import LiveRideTracker from '../../components/LiveRideTracker';

export default function LiveTrackingPage() {
  const { bookingNumber } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchBooking = async () => {
    if (!bookingNumber) return;
    setLoading(true);
    setError(null);
    try {
      const res = await bookingApi.getBooking(bookingNumber);
      setBooking(res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to load live booking tracking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingNumber]);

  const handleShareTracking = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="live-tracking-page-container">
      {/* Header bar */}
      <div className="page-header">
        <Link to={`/traveler/booking/${bookingNumber}`} className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Booking #{bookingNumber}</span>
        </Link>
        <div className="header-row">
          <div>
            <h1 className="page-title">Live Ride Tracking & Navigation</h1>
            <p className="page-subtitle">
              Real-time GPS telemetry from airport pickup to destination hotel.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleShareTracking}
              title="Share live ride link"
            >
              <Share2 size={16} />
              <span>{copied ? 'Link Copied!' : 'Share Live Trip'}</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={fetchBooking}
              disabled={loading}
            >
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

      {loading && !booking ? (
        <div className="loading-state">
          <RefreshCw size={36} className="spin text-primary" />
          <p>Connecting to vehicle GPS satellite feed #{bookingNumber}...</p>
        </div>
      ) : booking ? (
        <>
          {/* Main Interactive Live Ride Tracker with Leaflet Map */}
          <LiveRideTracker booking={booking} />

          {/* Safety & Assistance Card */}
          <div className="safety-assist-grid" style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div className="safety-card" style={{ border: '1.5px solid var(--border-color)', borderRadius: '10px', padding: '1rem', background: '#fff', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <ShieldCheck size={28} className="text-success" />
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>Verified Airport Transfer</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--gray-600)' }}>
                  Licensed vehicle {booking.carId} • All drivers identity-verified under Rule R4.
                </span>
              </div>
            </div>

            <div className="safety-card" style={{ border: '1.5px solid var(--border-color)', borderRadius: '10px', padding: '1rem', background: '#fff', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <PhoneCall size={28} className="text-primary" />
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>24/7 Fleet Dispatch Support</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--gray-600)' }}>
                  Direct line to {booking.supplier?.name || 'fleet operations'}: +81 (0)3 5555 0199
                </span>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
