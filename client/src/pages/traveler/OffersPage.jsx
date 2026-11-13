import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Car,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Star,
  ShieldCheck,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import { offerApi, rideRequestApi, bookingApi } from '../../api/api';
import OfferCountdown from '../../components/OfferCountdown';

export default function OffersPage() {
  const { requestId } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [offers, setOffers] = useState([]);
  const [expiredOfferIds, setExpiredOfferIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Filter and Sorting state (active when multiple offers exist)
  const [selectedCarType, setSelectedCarType] = useState('ALL');
  const [maxPrice, setMaxPrice] = useState(null);
  const [sortBy, setSortBy] = useState('price-asc'); // 'price-asc', 'price-desc', 'rating-desc', 'default'
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [reqRes, offersRes] = await Promise.all([
        rideRequestApi.getRideRequestById(requestId),
        offerApi.getOffers(requestId),
      ]);
      setRequest(reqRes.data);
      const rawOffers = offersRes.data || [];
      const uniqueOffers = [];
      const seenOfferKeys = new Set();
      for (const off of rawOffers) {
        const key = `${off.supplierId || off.supplier_id}_${off.carId || off.car_id}_${off.status}`;
        if (!seenOfferKeys.has(key)) {
          seenOfferKeys.add(key);
          uniqueOffers.push(off);
        }
      }
      setOffers(uniqueOffers);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load offers');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const refreshVisibleOffers = () => {
      if (document.visibilityState === 'visible') {
        loadData(true);
      }
    };
    const intervalId = window.setInterval(refreshVisibleOffers, 5000);
    window.addEventListener('focus', refreshVisibleOffers);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshVisibleOffers);
    };
  }, [loadData]);

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

  // Dynamic price bounds based on loaded offers
  const priceBounds = useMemo(() => {
    if (!offers || offers.length === 0) return { min: 0, max: 50000 };
    const prices = offers.map((o) => Number(o.offerPrice) || 0);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [offers]);

  // Set default maxPrice to the actual max when offers are loaded
  useEffect(() => {
    if (offers.length > 0 && maxPrice === null) {
      setMaxPrice(priceBounds.max);
    }
  }, [offers, priceBounds.max, maxPrice]);

  // Available car types and their offer counts
  const carTypeCounts = useMemo(() => {
    const counts = {};
    offers.forEach((o) => {
      const type = (o.car?.type || 'SEDAN').toUpperCase();
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [offers]);

  const uniqueCarTypes = useMemo(() => {
    return Object.keys(carTypeCounts).sort();
  }, [carTypeCounts]);

  // Filtered & sorted offers
  const filteredOffers = useMemo(() => {
    let result = [...offers];

    // Filter by car type
    if (selectedCarType !== 'ALL') {
      result = result.filter(
        (o) => (o.car?.type || 'SEDAN').toUpperCase() === selectedCarType
      );
    }

    // Filter by max price budget
    if (maxPrice !== null && maxPrice !== undefined) {
      result = result.filter((o) => Number(o.offerPrice) <= maxPrice);
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      result = result.filter((o) => o.status === statusFilter);
    }

    // Sort offers
    if (sortBy === 'price-asc') {
      result.sort((a, b) => Number(a.offerPrice) - Number(b.offerPrice));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => Number(b.offerPrice) - Number(a.offerPrice));
    } else if (sortBy === 'rating-desc') {
      result.sort((a, b) => (Number(b.supplier?.rating) || 0) - (Number(a.supplier?.rating) || 0));
    }

    return result;
  }, [offers, selectedCarType, maxPrice, statusFilter, sortBy]);

  const hasActiveFilters =
    selectedCarType !== 'ALL' ||
    (maxPrice !== null && maxPrice < priceBounds.max) ||
    statusFilter !== 'ALL' ||
    sortBy !== 'price-asc';

  const handleResetFilters = () => {
    setSelectedCarType('ALL');
    setMaxPrice(priceBounds.max);
    setSortBy('price-asc');
    setStatusFilter('ALL');
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
          <button className="btn-secondary" onClick={() => loadData()} disabled={loading}>
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

        {/* Filter and Sort Toolbar (Available when multiple offers exist) */}
        {offers.length > 1 && (
          <div className="offers-filter-card">
            <div className="filter-card-header">
              <div className="filter-title-wrap">
                <SlidersHorizontal size={18} className="text-primary" />
                <span className="filter-title">Filter & Compare Offers</span>
                {hasActiveFilters && (
                  <span className="active-filter-badge">Filters Active</span>
                )}
              </div>
              <div className="filter-header-actions">
                <span className="results-count-text">
                  Showing <strong>{filteredOffers.length}</strong> of <strong>{offers.length}</strong> offers
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="btn-reset-filters"
                    onClick={handleResetFilters}
                    title="Reset all filters"
                  >
                    <RotateCcw size={13} />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            <div className="filter-controls-grid">
              {/* Car Type Filter Pills */}
              <div className="filter-group car-type-group">
                <label className="filter-label">
                  <Car size={15} />
                  <span>Car Type</span>
                </label>
                <div className="car-type-pills">
                  <button
                    type="button"
                    className={`filter-pill ${selectedCarType === 'ALL' ? 'active' : ''}`}
                    onClick={() => setSelectedCarType('ALL')}
                  >
                    <span>All Types</span>
                    <span className="pill-count">{offers.length}</span>
                  </button>
                  {uniqueCarTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`filter-pill ${selectedCarType === type ? 'active' : ''}`}
                      onClick={() => setSelectedCarType(type)}
                    >
                      <span>{type}</span>
                      <span className="pill-count">{carTypeCounts[type]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter (Slider & Range) */}
              <div className="filter-group price-filter-group">
                <div className="filter-label-row">
                  <label className="filter-label">
                    <IndianRupee size={15} />
                    <span>Max Price Budget</span>
                  </label>
                  <span className="price-slider-value">
                    ≤ ₹{(maxPrice ?? priceBounds.max).toLocaleString()}
                  </span>
                </div>
                <div className="price-slider-wrap">
                  <input
                    type="range"
                    min={priceBounds.min}
                    max={priceBounds.max}
                    step={100}
                    value={maxPrice ?? priceBounds.max}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="price-range-slider"
                  />
                  <div className="price-range-labels">
                    <span>Min: ₹{priceBounds.min.toLocaleString()}</span>
                    <span>Max: ₹{priceBounds.max.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Sort By Dropdown */}
              <div className="filter-group sort-group">
                <label className="filter-label">
                  <ArrowUpDown size={15} />
                  <span>Sort By</span>
                </label>
                <select
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="price-asc">Price: Low to High (Cheapest first)</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating-desc">Supplier Rating: High to Low</option>
                  <option value="default">Default Order</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="filter-group status-group">
                <label className="filter-label">
                  <ShieldCheck size={15} />
                  <span>Offer Status</span>
                </label>
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses ({offers.length})</option>
                  <option value="assigned">Available to Book</option>
                  <option value="expired">Expired</option>
                  <option value="booked">Booked</option>
                  <option value="rejected">Rejected</option>
                  <option value="not_chosen">Not Chosen</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {offers.length === 0 ? (
          <div className="empty-state">
            <Car size={48} className="empty-icon" />
            <h3>No Offers Submitted Yet</h3>
            <p>Suppliers are reviewing this request. Check back shortly or assign an offer in the Supplier Portal.</p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" onClick={() => loadData()}>
                <RefreshCw size={16} />
                <span>Check Again</span>
              </button>
              <Link to="/supplier" className="btn-primary">
                <span>Switch to Supplier Portal</span>
              </Link>
            </div>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="empty-state filter-empty-state">
            <SlidersHorizontal size={44} className="empty-icon" />
            <h3>No Offers Match Selected Filters</h3>
            <p>
              No offers were found matching Car Type: <strong>{selectedCarType}</strong> and Max Price: <strong>≤ ₹{(maxPrice ?? priceBounds.max).toLocaleString()}</strong>.
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: '0.75rem' }}
              onClick={handleResetFilters}
            >
              <RotateCcw size={16} />
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : (
          <div className="offers-grid">
            {filteredOffers.map((offer) => {
              const isExpired = offer.status === 'expired' ||
                (offer.status === 'assigned' && expiredOfferIds.has(offer.id));
              const isAssigned = offer.status === 'assigned' && !isExpired;
              const isBooked = offer.status === 'booked';
              const isRejected = offer.status === 'rejected';
              const isNotChosen = offer.status === 'not_chosen';
              const displayStatus = isExpired ? 'expired' : offer.status;

              return (
                <div key={offer.id} className={`offer-card status-border-${displayStatus}`}>
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
                    <span className={`status-pill status-${displayStatus}`}>
                      {displayStatus.toUpperCase()}
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

                  {offer.expiresAt && (isAssigned || isExpired) && (
                    <div className="vehicle-details-card">
                      <div className="v-row">
                        <span className="v-lbl">Offer validity:</span>
                        <strong>
                          <OfferCountdown
                            expiresAt={offer.expiresAt}
                            onExpire={() => {
                              setExpiredOfferIds(current => {
                                if (current.has(offer.id)) return current;
                                const next = new Set(current);
                                next.add(offer.id);
                                return next;
                              });
                              loadData(true);
                            }}
                          />
                        </strong>
                      </div>
                    </div>
                  )}

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

                    {isExpired && (
                      <div className="offer-status-note rejected">
                        <Clock size={18} />
                        <span>This offer expired and can no longer be booked.</span>
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

