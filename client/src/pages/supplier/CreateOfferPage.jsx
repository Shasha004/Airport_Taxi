import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Car,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Send,
  IndianRupee,
  Clock,
} from 'lucide-react';
import { rideRequestApi, catalogApi, offerApi } from '../../api/api';

export default function CreateOfferPage() {
  const { requestId } = useParams();
  const [searchParams] = useSearchParams();
  const initialSupplierId = searchParams.get('supplierId') || 'TX-JP-01';
  const navigate = useNavigate();
  const submitLockRef = useRef(false);

  const [request, setRequest] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [carId, setCarId] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [expiryMinutes, setExpiryMinutes] = useState(15);

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

  // Compute R5 requirements for the current request
  const totalPassengers = request ? (Number(request.adults || 0) + (Array.isArray(request.childAges) ? request.childAges.length : 0)) : 0;
  const reqLargeBags = request ? Number(request.largeBags || 0) : 0;
  const reqSmallBags = request ? Number(request.smallBags || 0) : 0;
  const reqCarType = request?.carType ? request.carType.toUpperCase() : null;

  // Helper function to check vehicle capacity compliance with R5
  const checkVehicleCapacity = useCallback((car) => {
    if (!car || !request) return { eligible: true, seatOk: true, largeOk: true, smallOk: true, typeOk: true, reasons: [] };
    const seatOk = Number(car.seats || 0) >= totalPassengers;
    const largeOk = Number(car.large_bags || 0) >= reqLargeBags;
    const smallOk = Number(car.small_bags || 0) >= reqSmallBags;
    const typeTier = { HATCHBACK: 1, SEDAN: 2, SUV: 3, BUS: 4 };
    const carType = car.type?.toUpperCase();
    const typeOk = !reqCarType || reqCarType === 'ANY' ||
      (carType && (carType === reqCarType || (typeTier[carType] || 0) >= (typeTier[reqCarType] || 0)));

    const reasons = [];
    if (!seatOk) reasons.push(`Seats: ${car.seats} < ${totalPassengers} needed`);
    if (!largeOk) reasons.push(`Large luggage: ${car.large_bags} < ${reqLargeBags} needed`);
    if (!smallOk) reasons.push(`Small luggage: ${car.small_bags} < ${reqSmallBags} needed`);
    if (!typeOk) reasons.push(`Type: ${car.type} does not match preferred ${reqCarType}`);

    return {
      eligible: seatOk && largeOk && smallOk && typeOk,
      seatOk,
      largeOk,
      smallOk,
      typeOk,
      reasons
    };
  }, [request, reqCarType, reqLargeBags, reqSmallBags, totalPassengers]);

  // Automatically select the first eligible vehicle whenever supplier or request changes
  useEffect(() => {
    if (activeSupplier && activeSupplier.vehicles?.length > 0 && request) {
      const eligibleCar = activeSupplier.vehicles.find(car => checkVehicleCapacity(car).eligible);
      if (eligibleCar) {
        setCarId(eligibleCar.vehicle_id);
      } else {
        setCarId(activeSupplier.vehicles[0].vehicle_id);
      }
    }
  }, [supplierId, activeSupplier, request, checkVehicleCapacity]);

  const selectedCar = activeSupplier?.vehicles?.find(c => c.vehicle_id === carId);
  const selectedCarCap = checkVehicleCapacity(selectedCar);
  const eligibleCars = activeSupplier?.vehicles?.filter(c => checkVehicleCapacity(c).eligible) || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitLockRef.current) return;
    setError(null);
    setSuccessData(null);

    if (!carId) {
      setError('Please select a car from your fleet.');
      return;
    }

    if (!selectedCarCap.eligible) {
      setError(`R5 Capacity Violation: ${selectedCarCap.reasons.join('; ')}. Please select a vehicle with adequate capacity.`);
      return;
    }

    if (!offerPrice || isNaN(Number(offerPrice))) {
      setError('Please enter a valid offer price (R7).');
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    try {
      const payload = {
        supplierId,
        carId,
        price: Number(offerPrice),
        expiryMinutes,
      };

      await offerApi.createOffer(requestId, payload);
      navigate(`/traveler/offers/${requestId}`);
    } catch (err) {
      submitLockRef.current = false;
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
            <label htmlFor="carSelect">Vehicle Assignment (Rule R5) *</label>
            <select
              id="carSelect"
              className="input-field"
              value={carId}
              onChange={(e) => setCarId(e.target.value)}
              required
            >
              {activeSupplier?.vehicles?.map((car) => {
                const cap = checkVehicleCapacity(car);
                return (
                  <option
                    key={car.vehicle_id}
                    value={car.vehicle_id}
                    disabled={!cap.eligible}
                    style={{ color: cap.eligible ? '#15803d' : '#94a3b8' }}
                  >
                    {cap.eligible ? '✓ ' : '⚠️ '}
                    {car.vehicle_id} — {car.type} ({car.seats} seats | {car.large_bags} large, {car.small_bags} small bags)
                    {cap.eligible ? ' — MEETS CAPACITY (R5)' : ` — INSUFFICIENT (${cap.reasons.join(', ')})`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Real-time R5 Vehicle Capacity Breakdown */}
          {selectedCar && (
            <div className={`vehicle-capacity-card ${selectedCarCap.eligible ? 'cap-pass' : 'cap-fail'}`}>
              <div className="cap-card-header">
                <div>
                  <strong>{selectedCar.vehicle_id} ({selectedCar.type}) Capacity Check</strong>
                  <span className="cap-sub">Verifying passenger seats & luggage against request requirements</span>
                </div>
                <span className={`cap-status-pill ${selectedCarCap.eligible ? 'pill-pass' : 'pill-fail'}`}>
                  {selectedCarCap.eligible ? 'R5 COMPLIANT' : 'CAPACITY SHORTFALL'}
                </span>
              </div>

              <div className="cap-metrics-grid">
                <div className={`cap-metric-item ${selectedCarCap.seatOk ? 'metric-ok' : 'metric-bad'}`}>
                  <span className="metric-lbl">Passenger Seats</span>
                  <div className="metric-vals">
                    <strong>{selectedCar.seats} seats</strong>
                    <span>Needs {totalPassengers}</span>
                  </div>
                  <span className="metric-tag">{selectedCarCap.seatOk ? '✓ Adequate' : '✗ Insufficient'}</span>
                </div>

                <div className={`cap-metric-item ${selectedCarCap.largeOk ? 'metric-ok' : 'metric-bad'}`}>
                  <span className="metric-lbl">Large Luggage</span>
                  <div className="metric-vals">
                    <strong>{selectedCar.large_bags} large</strong>
                    <span>Needs {reqLargeBags}</span>
                  </div>
                  <span className="metric-tag">{selectedCarCap.largeOk ? '✓ Fits large bags' : `✗ Short by ${reqLargeBags - selectedCar.large_bags}`}</span>
                </div>

                <div className={`cap-metric-item ${selectedCarCap.smallOk ? 'metric-ok' : 'metric-bad'}`}>
                  <span className="metric-lbl">Small Luggage</span>
                  <div className="metric-vals">
                    <strong>{selectedCar.small_bags} small</strong>
                    <span>Needs {reqSmallBags}</span>
                  </div>
                  <span className="metric-tag">{selectedCarCap.smallOk ? '✓ Fits small bags' : `✗ Short by ${reqSmallBags - selectedCar.small_bags}`}</span>
                </div>

                {reqCarType && (
                  <div className={`cap-metric-item ${selectedCarCap.typeOk ? 'metric-ok' : 'metric-bad'}`}>
                    <span className="metric-lbl">Car Category</span>
                    <div className="metric-vals">
                      <strong>{selectedCar.type}</strong>
                      <span>Prefers {reqCarType}</span>
                    </div>
                    <span className="metric-tag">{selectedCarCap.typeOk ? '✓ Match' : '✗ Mismatch'}</span>
                  </div>
                )}
              </div>

              {!selectedCarCap.eligible && (
                <div className="cap-warning-box">
                  <AlertCircle size={16} />
                  <span>
                    Cannot submit with {selectedCar.vehicle_id} due to Rule R5.
                    {eligibleCars.length > 0 ? (
                      <> Recommended alternative: <strong>{eligibleCars.map(c => `${c.vehicle_id} (${c.type})`).join(', ')}</strong></>
                    ) : (
                      <> None of this supplier's fleet meets capacity. Switch to another supplier company above.</>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-section">
          <h2 className="section-title">
            <Clock size={20} />
            <span>Offer Validity</span>
          </h2>
          <p className="section-desc">
            The traveler must book before the offer expires. The backend enforces this deadline.
          </p>
          <div className="form-group">
            <label htmlFor="expiryMinutes">Offer remains valid for</label>
            <select
              id="expiryMinutes"
              className="input-field"
              value={expiryMinutes}
              onChange={(e) => setExpiryMinutes(Number(e.target.value))}
            >
              {[5, 10, 15, 30, 60].map((minutes) => (
                <option key={minutes} value={minutes}>{minutes} minutes</option>
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
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || !selectedCarCap.eligible}
            style={submitting ? { opacity: 0.6, pointerEvents: 'none', cursor: 'not-allowed' } : {}}
            title={!selectedCarCap.eligible ? 'Selected vehicle does not meet capacity requirements (R5)' : 'Submit Offer'}
          >
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

