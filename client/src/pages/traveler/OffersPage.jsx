import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Car,
  Plane,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Briefcase,
  IndianRupee,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Star,
  ShieldCheck,
} from 'lucide-react';
import { offerApi, rideRequestApi, bookingApi } from '../../api/api';

export default function OffersPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqRes, offersRes] = await Promise.all([
        rideRequestApi.getRideRequestById(requestId),
        offerApi.getOffers(requestId),
      ]);
      setRequest(reqRes.data);
      setOffers(offersRes.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [requestId]);

  const handleBook = async (offerId) => {
    if (!window.confirm('Are you sure you want to book this taxi offer?')) return;
    setActionLoading(`book-${offerId}`);
    try {
      const res = await bookingApi.bookOffer(offerId);
      const bookingNumber = res.data.bookingNumber;
      navigate(`/traveler/booking/${bookingNumber}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to book offer');
      loadData();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (offerId) => {
    if (!window.confirm('Are you sure you want to reject this offer?')) return;
    setActionLoading(`reject-${offerId}`);
    try {
      await offerApi.rejectOffer(offerId);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject offer');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !request) {
    return (
      <div className="loading-state">
        <RefreshCw size={36} className="spin text-primary" />
        <p>Loading offers for request {requestId}...</p>
      </div>
    );
  }

  return (
    <div className="offers-page-container">
      <div className="page-header">
        <Link to="/traveler" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
        <div className="header-row">
          <div>
            <h1 className="page-title">Supplier Offers for Request #{requestId}</h1>
            <p className="page-subtitle">
              Review taxi offers submitted by eligible suppliers and book your preferred vehicle.
            </p>
          </div>
          <button className="btn-secondary" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh Offers</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Request Summary Card */}
      {request && (
        <div className="request-summary-banner">
          <div className="summary-col">
            <span className="summary-lbl">Traveler / Group</span>
            <strong>{request.travelerName || 'Traveler'}</strong>
            <span className="summary-sub">Status: <strong className={`status-${request.status}`}>{request.status.toUpperCase()}</strong></span>
          </div>

          <div className="summary-col">
            <span className="summary-lbl">Route</span>
            <strong>{request.flight?.to || request.flightId} ➔ {request.hotel?.city || request.hotelId}</strong>
            <span className="summary-sub">{request.hotel?.name} ({request.hotel?.area})</span>
          </div>

          <div className="summary-col">
            <span className="summary-lbl">Pickup Time</span>
            <strong>{request.pickupTime || request.pickupAt}</strong>
            <span className="summary-sub">Flight: {request.flight?.flight_number}</span>
          </div>

          <div className="summary-col">
            <span className="summary-lbl">Target Price</span>
            <strong className="text-primary">₹{Number(request.travelerPrice).toLocaleString()}</strong>
            <span className="summary-sub">Route: ₹{request.route?.price_min_inr.toLocaleString()} – ₹{request.route?.price_max_inr.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Offers Section */}
      <div className="offers-section">
        <div className="section-header-row">
          <h2 className="section-title">
            <Car size={20} />
            <span>Available Offers ({offers.length})</span>
          </h2>
          <span className="info-tag">R8: Choose 1 offer to confirm or reject individually</span>
        </div>

        {offers.length === 0 ? (
          <div className="empty-state">
            <Car size={48} className="empty-icon" />
            <h3>No Offers Submitted Yet</h3>
            <p>Suppliers are reviewing this request. Check back shortly or assign an offer in the Supplier Portal.</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" onClick={loadData}>
                <RefreshCw size={16} />
                <span>Check Again</span>
              </button>
              <Link to="/supplier" className="btn-primary">
                <span>Switch to Supplier Portal</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="offers-grid">
            {offers.map((offer) => {
              const isAssigned = offer.status === 'assigned';
              const isBooked = offer.status === 'booked';
              const isRejected = offer.status === 'rejected';
              const isNotChosen = offer.status === 'not_chosen';

              return (
                <div key={offer.id} className={`offer-card status-border-${offer.status}`}>
                  <div className="offer-header">
                    <div>
                      <h3 className="supplier-name">{offer.supplier?.name || offer.supplierId}</h3>
                      <div className="supplier-meta">
                        <span className="rating-pill">
                          <Star size={14} className="star-icon" />
                          <span>{offer.supplier?.rating || '4.5'}</span>
                        </span>
                        <span className="car-id-tag">{offer.carId}</span>
                      </div>
                    </div>
                    <span className={`status-pill status-${offer.status}`}>
                      {offer.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="vehicle-details-card">
                    <div className="v-row">
                      <span className="v-lbl">Vehicle Type:</span>
                      <strong>{offer.car?.type || 'SEDAN'}</strong>
                    </div>
                    <div className="v-row">
                      <span className="v-lbl">Seats:</span>
                      <span>{offer.car?.seats || 4} Passenger seats</span>
                    </div>
                    <div className="v-row">
                      <span className="v-lbl">Luggage Fit:</span>
                      <span>{offer.car?.large_bags || 2} Large, {offer.car?.small_bags || 2} Small</span>
                    </div>
                  </div>

                  <div className="offer-price-block">
                    <span className="offer-price-lbl">Offered Total Price:</span>
                    <strong className="offer-price-val">₹{Number(offer.offerPrice).toLocaleString()}</strong>
                  </div>

                  {/* Actions */}
                  <div className="offer-actions">
                    {isAssigned && (
                      <>
                        <button
                          className="btn-danger-outline"
                          onClick={() => handleReject(offer.id)}
                          disabled={actionLoading !== null}
                        >
                          <XCircle size={16} />
                          <span>Reject</span>
                        </button>
                        <button
                          className="btn-primary flex-1"
                          onClick={() => handleBook(offer.id)}
                          disabled={actionLoading !== null}
                        >
                          <CheckCircle size={16} />
                          <span>Book Taxi</span>
                        </button>
                      </>
                    )}

                    {isBooked && (
                      <div className="offer-status-note booked">
                        <CheckCircle size={18} />
                        <span>Booked by traveler</span>
                      </div>
                    )}

                    {isRejected && (
                      <div className="offer-status-note rejected">
                        <XCircle size={18} />
                        <span>Offer was rejected</span>
                      </div>
                    )}

                    {isNotChosen && (
                      <div className="offer-status-note not-chosen">
                        <span>Not chosen (Another offer booked)</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

