import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Car,
  Plane,
  Building,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Send,
  IndianRupee,
  Clock,
  Briefcase,
  Users,
} from 'lucide-react';
import { rideRequestApi, catalogApi, offerApi } from '../../api/api';

export default function CreateOfferPage() {
  const { requestId } = useParams();
  const [searchParams] = useSearchParams();
  const initialSupplierId = searchParams.get('supplierId') || 'TX-JP-01';
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [carId, setCarId] = useState('');
  const [offerPrice, setOfferPrice] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [reqRes, supRes] = await Promise.all([
          rideRequestApi.getRideRequestById(requestId),
          catalogApi.getSuppliers(),
        ]);
        setRequest(reqRes.data);
        setSuppliers(supRes.data || []);

        // Pre-fill price with traveler price or route min
        if (reqRes.data) {
          setOfferPrice(String(reqRes.data.travelerPrice || reqRes.data.route?.price_min_inr || ''));
        }
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Failed to load request');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [requestId]);

  const activeSupplier = suppliers.find(s => s.company_id === supplierId);

  // Set default car when supplier loads or changes
  useEffect(() => {
    if (activeSupplier && activeSupplier.vehicles?.length > 0) {
      setCarId(activeSupplier.vehicles[0].vehicle_id);
    }
  }, [supplierId, activeSupplier]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessData(null);

    if (!carId) {
      setError('Please select a car from your fleet.');
      return;
    }

    if (!offerPrice || isNaN(Number(offerPrice))) {
      setError('Please enter a valid offer price (R7).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        supplierId,
        carId,
        price: Number(offerPrice),
      };

      const res = await offerApi.createOffer(requestId, payload);
      setSuccessData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit offer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <RefreshCw size={36} className="spin text-primary" />
        <p>Loading request details for offer creation...</p>
      </div>
    );
  }

  return (
    <div className="create-offer-container">
      <div className="page-header">
        <Link to={`/supplier/requests?supplierId=${supplierId}`} className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Eligible Requests</span>
        </Link>
        <h1 className="page-title">Assign Car & Submit Offer (R7)</h1>
        <p className="page-subtitle">
          Select an available vehicle from your fleet and submit a competitive price within route limits.
        </p>
      </div>

      {error && (
        <div className="alert-banner alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {successData && (
        <div className="success-card">
          <div className="success-header">
            <CheckCircle size={28} className="text-success" />
            <div>
              <h3>Offer Submitted Successfully!</h3>
              <p>Offer #{successData.id} is now visible to the traveler for booking or rejection.</p>
            </div>
          </div>
          <div className="success-details">
            <div>
              <span className="lbl">Offer ID:</span>
              <strong>{successData.id}</strong>
            </div>
            <div>
              <span className="lbl">Assigned Vehicle:</span>
              <strong>{successData.carId} ({successData.car?.type})</strong>
            </div>
            <div>
              <span className="lbl">Offered Price:</span>
              <strong>₹{Number(successData.offerPrice).toLocaleString()}</strong>
            </div>
            <div>
              <span className="lbl">Status:</span>
              <strong>{successData.status?.toUpperCase()}</strong>
            </div>
          </div>
          <div className="success-actions">
            <button
              className="btn-primary"
              onClick={() => navigate(`/supplier/requests?supplierId=${supplierId}`)}
            >
              Back to Eligible Requests
            </button>
            <Link to={`/traveler/offers/${requestId}`} className="btn-secondary">
              View Traveler Offers Page
            </Link>
          </div>
        </div>
      )}

      {request && (
        <div className="request-specs-card">
          <h3>Target Ride Request Details (#{request.id})</h3>
          <div className="specs-grid">
            <div>
              <span className="lbl">Traveler / Group:</span>
              <strong>{request.travelerName || 'Traveler'}</strong>
            </div>
            <div>
              <span className="lbl">Flight:</span>
              <strong>{request.flight?.flight_number} ({request.flight?.from} ➔ {request.flight?.to})</strong>
            </div>
            <div>
              <span className="lbl">Destination Hotel:</span>
              <strong>{request.hotel?.name} ({request.hotel?.city}, {request.hotel?.area})</strong>
            </div>
            <div>
              <span className="lbl">Pickup Time:</span>
              <strong>{request.pickupTime || request.pickupAt}</strong>
            </div>
            <div>
              <span className="lbl">Required Capacity:</span>
              <strong>{request.adults} Adults + {request.childAges?.length || 0} Children</strong>
            </div>
            <div>
              <span className="lbl">Required Luggage:</span>
              <strong>{request.largeBags} Large, {request.smallBags} Small</strong>
            </div>
            <div>
              <span className="lbl">Traveler Proposed Price:</span>
              <strong className="text-primary">₹{Number(request.travelerPrice).toLocaleString()}</strong>
            </div>
            <div>
              <span className="lbl">Route Range (R3/R7):</span>
              <strong className="text-secondary">
                ₹{request.route?.price_min_inr.toLocaleString()} – ₹{request.route?.price_max_inr.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="offer-form">
        <div className="form-section">
          <h2 className="section-title">
            <Car size={20} />
            <span>Select Vehicle from Fleet (R5, R6)</span>
          </h2>
          <p className="section-desc">
            Choose a vehicle meeting the seat, luggage, and availability window requirements.
          </p>

          <div className="form-group">
            <label htmlFor="supplierSelect">Taxi Supplier Company</label>
            <select
              id="supplierSelect"
              className="input-field"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              {suppliers.map((s) => (
                <option key={s.company_id} value={s.company_id}>
                  {s.name} ({s.company_id})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label htmlFor="carSelect">Vehicle Assignment *</label>
            <select
              id="carSelect"
              className="input-field"
              value={carId}
              onChange={(e) => setCarId(e.target.value)}
              required
            >
              {activeSupplier?.vehicles?.map((car) => (
                <option key={car.vehicle_id} value={car.vehicle_id}>
                  {car.vehicle_id} — {car.type} ({car.seats} seats | {car.large_bags} large bags, {car.small_bags} small bags)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">
            <IndianRupee size={20} />
            <span>Offer Price (R7)</span>
          </h2>
          <p className="section-desc">
            Your price must fall within the route's allowed boundary (₹{request?.route?.price_min_inr.toLocaleString()} to ₹{request?.route?.price_max_inr.toLocaleString()}).
          </p>

          <div className="form-group">
            <label htmlFor="offerPrice">Offer Price in INR (₹) *</label>
            <input
              id="offerPrice"
              type="number"
              step="100"
              className="input-field"
              placeholder={`e.g. ${request?.travelerPrice || 12000}`}
              value={offerPrice}
              min={request?.route?.price_min_inr}
              max={request?.route?.price_max_inr}
              onChange={(e) => setOfferPrice(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate(`/supplier/requests?supplierId=${supplierId}`)}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Submitting Offer...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Submit Offer to Traveler</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

