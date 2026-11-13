import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plane,
  Building,
  Users,
  Briefcase,
  Clock,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ArrowLeft,
  Sparkles,
  Info,
} from 'lucide-react';
import { catalogApi, routeApi, rideRequestApi } from '../../api/api';

export default function CreateRidePage() {
  const navigate = useNavigate();
  const submitLockRef = useRef(false);

  // Catalog state
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Form state - pre-fill traveler identity from localStorage
  const storedTravelerName = localStorage.getItem('airportTaxi_travelerName') || '';
  const storedTravelerId = localStorage.getItem('airportTaxi_travelerId') || '';
  const [travelerName, setTravelerName] = useState(storedTravelerName || '');
  const [travelerId, setTravelerId] = useState(storedTravelerId || '');
  const [flightId, setFlightId] = useState('');
  const [hotelId, setHotelId] = useState('');
  const [adults, setAdults] = useState(2);
  const [childAges, setChildAges] = useState([6]);
  const [largeBags, setLargeBags] = useState(3);
  const [smallBags, setSmallBags] = useState(2);
  const [pickupTime, setPickupTime] = useState('');
  const [travelerPrice, setTravelerPrice] = useState('12000');
  const [carType, setCarType] = useState('');

  // Route & price range state
  const [routeInfo, setRouteInfo] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState([]);
  const [successData, setSuccessData] = useState(null);

  // Load catalog on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoadingCatalog(true);
        const [flightsRes, hotelsRes] = await Promise.all([
          catalogApi.getFlights(),
          catalogApi.getHotels(),
        ]);
        setFlights(flightsRes.data || []);
        setHotels(hotelsRes.data || []);

        // Default to Menon scenario if available
        const menonFlight = (flightsRes.data || []).find((f) => f.flight_id === 'FL-401');
        const menonHotel = (hotelsRes.data || []).find((h) => h.hotel_id === 'HTL-TYO-004');
        if (menonFlight) setFlightId(menonFlight.flight_id);
        if (menonHotel) setHotelId(menonHotel.hotel_id);
      } catch (err) {
        console.error('Failed to load catalog data:', err);
        setFormErrors(['Failed to load catalog data from server. Please ensure the backend is running.']);
      } finally {
        setLoadingCatalog(false);
      }
    }
    loadCatalog();
  }, []);

  // Fetch route and price range when flight and hotel change
  useEffect(() => {
    if (!flightId || !hotelId) {
      setRouteInfo(null);
      setRouteError(null);
      return;
    }

    async function fetchRoute() {
      setLoadingRoute(true);
      setRouteError(null);
      try {
        const res = await routeApi.getPriceRange(flightId, hotelId);
        setRouteInfo(res.data);
      } catch (err) {
        setRouteInfo(null);
        setRouteError(err.response?.data?.error || err.message || 'Route calculation failed');
      } finally {
        setLoadingRoute(false);
      }
    }

    fetchRoute();
  }, [flightId, hotelId]);

  // Selected flight object
  const selectedFlight = flights.find((f) => f.flight_id === flightId);
  const selectedHotel = hotels.find((h) => h.hotel_id === hotelId);

  // Compute earliest pickup time (Landing + 60 minutes)
  const computeEarliestPickup = () => {
    if (!selectedFlight?.arrival_local) return null;
    const landing = new Date(selectedFlight.arrival_local.endsWith('Z') 
      ? selectedFlight.arrival_local 
      : selectedFlight.arrival_local + 'Z');
    const earliest = new Date(landing.getTime() + 60 * 60 * 1000);
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    return earliest.toISOString().slice(0, 16);
  };

  const earliestPickup = computeEarliestPickup();

  // Auto-set pickup time when flight changes if not set or earlier than allowed
  useEffect(() => {
    if (earliestPickup) {
      setPickupTime(earliestPickup);
    }
  }, [flightId]);

  // Manage child ages
  const handleAddChild = () => {
    setChildAges([...childAges, 5]);
  };

  const handleRemoveChild = (index) => {
    setChildAges(childAges.filter((_, idx) => idx !== index));
  };

  const handleChildAgeChange = (index, value) => {
    const updated = [...childAges];
    updated[index] = Number(value);
    setChildAges(updated);
  };

  // Demo presets
  const applyMenonDemo = () => {
    // Keep the logged-in traveler's name; only reset flight/hotel/etc.
    setFlightId('FL-401');
    setHotelId('HTL-TYO-004');
    setAdults(2);
    setChildAges([6]);
    setLargeBags(3);
    setSmallBags(2);
    setPickupTime('2027-04-10T11:30');
    setTravelerPrice('12000');
    setCarType('');
  };

  // Frontend Validation
  const validateForm = () => {
    const errors = [];

    // R1: Flight & Hotel
    if (!flightId) errors.push('Please select an arrival flight (R1)');
    if (!hotelId) errors.push('Please select a destination hotel (R1)');
    if (routeError) errors.push(`R1 Compatibility Error: ${routeError}`);

    // R1: Adults & Children
    if (adults < 1) errors.push('At least 1 adult passenger is required (R1)');
    childAges.forEach((age, idx) => {
      if (isNaN(age) || age < 0 || age > 17) {
        errors.push(`Child #${idx + 1} age must be between 0 and 17 (R1)`);
      }
    });

    // R2: Pickup Time
    if (selectedFlight && pickupTime) {
      const flightLanding = new Date(selectedFlight.arrival_local.endsWith('Z') 
        ? selectedFlight.arrival_local 
        : selectedFlight.arrival_local + 'Z').getTime();
      const chosenPickup = new Date(pickupTime.endsWith('Z') 
        ? pickupTime 
        : pickupTime + 'Z').getTime();

      const diffMinutes = (chosenPickup - flightLanding) / (60 * 1000);
      if (diffMinutes < 60) {
        errors.push(
          `R2 Violation: Pickup time must be at least 60 minutes after flight landing (${selectedFlight.arrival_local}). Earliest: ${earliestPickup}`
        );
      }
    }

    // R3: Proposed Price
    if (!travelerPrice || isNaN(Number(travelerPrice))) {
      errors.push('Please enter a valid proposed price (R3)');
    } else if (routeInfo) {
      const price = Number(travelerPrice);
      if (price < routeInfo.price_min_inr || price > routeInfo.price_max_inr) {
        errors.push(
          `R3 Violation: Proposed price ₹${price.toLocaleString()} is outside route range of ₹${routeInfo.price_min_inr.toLocaleString()} – ₹${routeInfo.price_max_inr.toLocaleString()}`
        );
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitLockRef.current) return;
    setFormErrors([]);
    setSuccessData(null);

    const clientValidationErrors = validateForm();
    if (clientValidationErrors.length > 0) {
      setFormErrors(clientValidationErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    try {
      const payload = {
        travelerId: travelerId.trim() || undefined,
        travelerName: travelerName.trim() || 'Traveler',
        flightId,
        hotelId,
        adults: Number(adults),
        childAges: childAges.map(Number),
        largeBags: Number(largeBags),
        smallBags: Number(smallBags),
        pickupTime: pickupTime ? `${pickupTime}:00` : undefined,
        travelerPrice: Number(travelerPrice),
        carType: carType || null,
      };

      await rideRequestApi.createRideRequest(payload);
      navigate('/traveler');
    } catch (err) {
      submitLockRef.current = false;
      const errorMsg = err.response?.data?.error || err.message || 'Failed to submit ride request';
      const backendErrors = err.response?.data?.errors || [errorMsg];
      setFormErrors(backendErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCatalog) {
    return (
      <div className="loading-state">
        <Sparkles size={32} className="spin text-primary" />
        <p>Loading flight and hotel catalog...</p>
      </div>
    );
  }

  return (
    <div className="create-ride-container">
      <div className="page-header">
        <Link to="/traveler" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
        <div className="header-row">
          <div>
            <h1 className="page-title">Request an Airport Taxi</h1>
            <p className="page-subtitle">
              Configure your transfer details and propose a fair price within the verified route range.
            </p>
          </div>
          <button type="button" className="demo-btn" onClick={applyMenonDemo}>
            <Sparkles size={16} />
            <span>Load Menon Family Demo (FL-401)</span>
          </button>
        </div>
      </div>

      {/* Success banner if created */}
      {successData && (
        <div className="success-card">
          <div className="success-header">
            <CheckCircle size={28} className="text-success" />
            <div>
              <h3>Ride Request Posted Successfully!</h3>
              <p>Your request has been verified and persisted in SQLite.</p>
            </div>
          </div>
          <div className="success-details">
            <div>
              <span className="lbl">Request ID:</span>
              <strong>{successData.id}</strong>
            </div>
            <div>
              <span className="lbl">Route:</span>
              <strong>
                {successData.flight?.to} ({successData.hotel?.city} - {successData.hotel?.area})
              </strong>
            </div>
            <div>
              <span className="lbl">Proposed Price:</span>
              <strong>₹{Number(successData.travelerPrice).toLocaleString()}</strong>
            </div>
            <div>
              <span className="lbl">Pickup Time:</span>
              <strong>{successData.pickupTime}</strong>
            </div>
          </div>
          <div className="success-actions">
            <button className="btn-primary" onClick={() => navigate('/traveler')}>
              Go to Traveler Dashboard
            </button>
            <button className="btn-secondary" onClick={() => setSuccessData(null)}>
              Post Another Ride
            </button>
          </div>
        </div>
      )}

      {/* Error Banners */}
      {formErrors.length > 0 && (
        <div className="alert-banner alert-error">
          <AlertCircle size={24} style={{ flexShrink: 0 }} />
          <div>
            <strong>Please resolve the following issues:</strong>
            <ul style={{ marginTop: '0.25rem', paddingLeft: '1.25rem' }}>
              {formErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ride-form">
        {/* Section 1: Flight & Hotel (R1) */}
        <div className="form-section">
          <h2 className="section-title">
            <Plane size={20} />
            <span>1. Flight & Hotel Selection (R1)</span>
          </h2>
          <p className="section-desc">
            Select your arrival flight and destination hotel. The airport must serve the hotel's city.
          </p>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="travelerId">Traveler ID</label>
              <input
                id="travelerId"
                type="text"
                className="input-field"
                placeholder="e.g. TRV-001"
                value={travelerId}
                onChange={(e) => setTravelerId(e.target.value)}
                readOnly={Boolean(storedTravelerId)}
                style={storedTravelerId ? { backgroundColor: 'var(--bg-secondary)', cursor: 'default' } : {}}
              />
              {storedTravelerId && (
                <span className="help-text">Pre-filled from your traveler ID.</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="travelerName">Traveler / Group Name</label>
              <input
                id="travelerName"
                type="text"
                className="input-field"
                placeholder="e.g. Menon family"
                value={travelerName}
                onChange={(e) => setTravelerName(e.target.value)}
                readOnly={Boolean(storedTravelerName)}
                style={storedTravelerName ? { backgroundColor: 'var(--bg-secondary)', cursor: 'default' } : {}}
              />
              {storedTravelerName && (
                <span className="help-text">Pre-filled from your traveler name. Go back to switch user.</span>
              )}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="flightSelect">
                Arrival Flight <span className="req">*</span>
              </label>
              <select
                id="flightSelect"
                className="input-field"
                value={flightId}
                onChange={(e) => setFlightId(e.target.value)}
                required
              >
                <option value="">-- Select Arrival Flight --</option>
                {flights.map((f) => (
                  <option key={f.flight_id} value={f.flight_id}>
                    {f.flight_number} ({f.airline}) — {f.from} ➔ {f.to} | Lands: {f.arrival_local}
                  </option>
                ))}
              </select>
              {selectedFlight && (
                <div className="flight-preview-pill">
                  <span>Airline: <strong>{selectedFlight.airline}</strong></span>
                  <span>Origin: <strong>{selectedFlight.from}</strong></span>
                  <span>Destination: <strong>{selectedFlight.to}</strong></span>
                  <span>Landing: <strong>{selectedFlight.arrival_local}</strong></span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="hotelSelect">
                Destination Hotel <span className="req">*</span>
              </label>
              <select
                id="hotelSelect"
                className="input-field"
                value={hotelId}
                onChange={(e) => setHotelId(e.target.value)}
                required
              >
                <option value="">-- Select Destination Hotel --</option>
                {hotels.map((h) => (
                  <option key={h.hotel_id} value={h.hotel_id}>
                    {h.name} — {h.city} ({h.area})
                  </option>
                ))}
              </select>
              {selectedHotel && (
                <div className="flight-preview-pill">
                  <span>City: <strong>{selectedHotel.city}</strong></span>
                  <span>Area: <strong>{selectedHotel.area}</strong></span>
                  <span>Rating: <strong>★ {selectedHotel.stars}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Route Compatibility Card */}
          {loadingRoute && (
            <div className="route-status-card loading">
              <Sparkles size={18} className="spin" />
              <span>Verifying route compatibility & calculating price range...</span>
            </div>
          )}

          {routeError && (
            <div className="route-status-card error">
              <AlertCircle size={20} />
              <div>
                <strong>Airport & Hotel Incompatible (R1 Violation)</strong>
                <p>{routeError}</p>
              </div>
            </div>
          )}

          {routeInfo && (
            <div className="route-status-card success">
              <div className="route-header">
                <CheckCircle size={20} className="text-success" />
                <strong>Direct Route Available (R1 Verified)</strong>
              </div>
              <div className="route-stats">
                <div className="stat-box">
                  <span className="stat-lbl">Airport</span>
                  <span className="stat-val">{routeInfo.route?.airport}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-lbl">Destination</span>
                  <span className="stat-val">{routeInfo.route?.city} ({routeInfo.route?.area})</span>
                </div>
                <div className="stat-box">
                  <span className="stat-lbl">Drive Distance</span>
                  <span className="stat-val">{routeInfo.route?.distance_km} km</span>
                </div>
                <div className="stat-box">
                  <span className="stat-lbl">Est. Duration</span>
                  <span className="stat-val">{routeInfo.route?.drive_minutes} mins</span>
                </div>
                <div className="stat-box highlight">
                  <span className="stat-lbl">Price Range (R3)</span>
                  <span className="stat-val">₹{routeInfo.price_min_inr.toLocaleString()} – ₹{routeInfo.price_max_inr.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Passengers & Baggage (R1) */}
        <div className="form-section">
          <h2 className="section-title">
            <Users size={20} />
            <span>2. Passengers & Baggage (R1)</span>
          </h2>
          <p className="section-desc">
            At least 1 adult is required. Children are aged 0–17 and require individual seats.
          </p>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="adultsInput">
                Adults (Aged 18+) <span className="req">*</span>
              </label>
              <input
                id="adultsInput"
                type="number"
                min="1"
                max="20"
                className="input-field"
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                required
              />
              <span className="help-text">Minimum 1 adult required.</span>
            </div>

            <div className="form-group">
              <div className="label-with-action">
                <label>Children (Aged 0–17)</label>
                <button
                  type="button"
                  className="link-btn"
                  onClick={handleAddChild}
                >
                  + Add Child
                </button>
              </div>

              {childAges.length === 0 ? (
                <div className="empty-child-note">No children in travel group.</div>
              ) : (
                <div className="child-list">
                  {childAges.map((age, idx) => (
                    <div key={idx} className="child-item">
                      <span className="child-label">Child #{idx + 1} Age:</span>
                      <input
                        type="number"
                        min="0"
                        max="17"
                        className="input-field child-input"
                        value={age}
                        onChange={(e) => handleChildAgeChange(idx, e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="delete-child-btn"
                        onClick={() => handleRemoveChild(idx)}
                        title="Remove child"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-grid-2" style={{ marginTop: '1rem' }}>
            <div className="form-group">
              <label htmlFor="largeBags">
                Large Bags (Check-in size)
              </label>
              <input
                id="largeBags"
                type="number"
                min="0"
                max="20"
                className="input-field"
                value={largeBags}
                onChange={(e) => setLargeBags(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="smallBags">
                Small Bags (Cabin / Handbags)
              </label>
              <input
                id="smallBags"
                type="number"
                min="0"
                max="20"
                className="input-field"
                value={smallBags}
                onChange={(e) => setSmallBags(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Pickup Time (R2) */}
        <div className="form-section">
          <h2 className="section-title">
            <Clock size={20} />
            <span>3. Pickup Time (R2)</span>
          </h2>
          <p className="section-desc">
            Must be at least 60 minutes after flight landing time to allow for deplaning, baggage claim, and immigration.
          </p>

          <div className="form-group">
            <label htmlFor="pickupTime">
              Pickup Time (Airport Local Time)
            </label>
            <input
              id="pickupTime"
              type="datetime-local"
              className="input-field"
              value={pickupTime}
              min={earliestPickup || undefined}
              onChange={(e) => setPickupTime(e.target.value)}
            />
            {selectedFlight && (
              <div className="pickup-info-box">
                <Info size={16} />
                <span>
                  Flight lands at <strong>{selectedFlight.arrival_local}</strong>. Earliest valid pickup is{' '}
                  <strong>{earliestPickup}</strong>.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Traveler Price & Preferences (R3) */}
        <div className="form-section">
          <h2 className="section-title">
            <IndianRupee size={20} />
            <span>4. Proposed Traveler Price (R3)</span>
          </h2>
          <p className="section-desc">
            Enter your proposed price in INR. It must fall within the route's inclusive price range.
          </p>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="travelerPrice">
                Proposed Price (INR ₹) <span className="req">*</span>
              </label>
              <div className="price-input-wrapper">
                <span className="currency-prefix">₹</span>
                <input
                  id="travelerPrice"
                  type="number"
                  step="100"
                  className="input-field price-input"
                  placeholder={routeInfo ? `${routeInfo.price_min_inr} - ${routeInfo.price_max_inr}` : 'e.g. 12000'}
                  value={travelerPrice}
                  onChange={(e) => setTravelerPrice(e.target.value)}
                  required
                />
              </div>

              {routeInfo && (
                <div className="price-range-hint">
                  Allowed Range: <strong>₹{routeInfo.price_min_inr.toLocaleString()}</strong> to{' '}
                  <strong>₹{routeInfo.price_max_inr.toLocaleString()}</strong>
                  {Number(travelerPrice) >= routeInfo.price_min_inr &&
                  Number(travelerPrice) <= routeInfo.price_max_inr ? (
                    <span className="price-status valid">✓ Within range</span>
                  ) : travelerPrice ? (
                    <span className="price-status invalid">✕ Out of range</span>
                  ) : null}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="carTypeSelect">
                Car Type Preference (Optional)
              </label>
              <select
                id="carTypeSelect"
                className="input-field"
                value={carType}
                onChange={(e) => setCarType(e.target.value)}
              >
                <option value="">Any Vehicle Type</option>
                <option value="HATCHBACK">Hatchback</option>
                <option value="SEDAN">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="BUS">Bus</option>
              </select>
              <span className="help-text">Leave blank if any vehicle meeting seat/bag requirements is acceptable.</span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/traveler')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary btn-lg"
            disabled={submitting || Boolean(routeError)}
            style={submitting ? { opacity: 0.6, pointerEvents: 'none', cursor: 'not-allowed' } : {}}
          >
            {submitting ? (
              <>
                <Sparkles size={18} className="spin" />
                <span>Posting Request...</span>
              </>
            ) : (
              <span>Submit Ride Request</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

