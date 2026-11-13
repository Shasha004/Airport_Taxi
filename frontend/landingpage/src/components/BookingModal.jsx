import React, { useState, useEffect } from 'react';
import '../css/BookingModal.css';

/**
 * BookingModal Component implementing the full Problem 2 Hackathon Rules (R1 - R9).
 * Supports dual views:
 * 1. "traveller": Menon Family booking & ride offer creation
 * 2. "cabowner": Sakura Cabs supplier dashboard & ride assignment
 */
function BookingModal({ isOpen, onClose, activeRole = 'traveller', onRoleChange }) {
  // Current tab inside the modal
  const [currentRole, setCurrentRole] = useState(activeRole);

  useEffect(() => {
    setCurrentRole(activeRole);
  }, [activeRole]);

  // --------------------------------------------------------------------------
  // TRAVELLER FLOW STATE (Menon Family Scenario - Problem 2)
  // --------------------------------------------------------------------------
  const [flightNumber, setFlightNumber] = useState('FL-401');
  const [hotelCode, setHotelCode] = useState('HTL-TYO-004'); // Ueno Garden Inn
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(1);
  const [largeBags, setLargeBags] = useState(3);
  const [smallBags, setSmallBags] = useState(2);
  const [pickupTime, setPickupTime] = useState('11:30');
  const [travelerPrice, setTravelerPrice] = useState(12000);
  const [selectedSupplier, setSelectedSupplier] = useState('Sakura Cabs');
  const [carType, setCarType] = useState('SEDAN');

  // Suggested price range for Narita -> Ueno route (routes.json)
  const minPrice = 10200;
  const maxPrice = 16800;

  // --------------------------------------------------------------------------
  // CABOWNER FLOW STATE (Sakura Cabs Scenario - Problem 2)
  // --------------------------------------------------------------------------
  const [cabOwnerBidPrice, setCabOwnerBidPrice] = useState(12000);
  const [assignedVehicle, setAssignedVehicle] = useState('TOYOTA_CROWN_SEDAN');
  const [busyStartTime, setBusyStartTime] = useState('11:30');
  const [busyEndTime, setBusyEndTime] = useState('13:00'); // 90 min travel time to Ueno
  const [cabownerStatus, setCabownerStatus] = useState('');

  // Booking confirmation state
  const [bookingResult, setBookingResult] = useState(null);
  const [ruleError, setRuleError] = useState('');

  if (!isOpen) return null;

  const handleTabSwitch = (role) => {
    setCurrentRole(role);
    if (onRoleChange) onRoleChange(role);
    setRuleError('');
  };

  // Traveler: Validate offer and generate booking
  const handleConfirmTravelerBooking = (e) => {
    e.preventDefault();
    setRuleError('');

    // Rule R1: At least 1 adult
    if (adults < 1) {
      setRuleError('Rule R1 Error: At least 1 adult is required.');
      return;
    }

    // Rule R3: Price must be inside the route's suggested range
    const priceNum = Number(travelerPrice);
    if (priceNum < minPrice) {
      setRuleError(`Rule R3 Refused: Offered price ₹${priceNum.toLocaleString()} is below route minimum ₹${minPrice.toLocaleString()}.`);
      return;
    }
    if (priceNum > maxPrice) {
      setRuleError(`Rule R3 Refused: Offered price ₹${priceNum.toLocaleString()} is above route maximum ₹${maxPrice.toLocaleString()}.`);
      return;
    }

    // Generate unique 10-digit booking number (Rule R8)
    const random10Digit = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    setBookingResult({
      bookingId: random10Digit,
      role: 'traveller',
      flight: flightNumber,
      hotel: 'Hotel Ueno Garden Inn (HTL-TYO-004)',
      pickup: `10 April 2027 at ${pickupTime}`,
      supplier: selectedSupplier,
      car: `${carType} (Fits ${adults + children} passengers, ${largeBags}L + ${smallBags}S bags)`,
      price: priceNum,
      status: 'Confirmed'
    });
  };

  // Cabowner: Accept Menon family request & assign fleet
  const handleCabOwnerAccept = (e) => {
    e.preventDefault();
    setRuleError('');

    const priceNum = Number(cabOwnerBidPrice);
    if (priceNum < minPrice || priceNum > maxPrice) {
      setRuleError(`Rule R3 Error: Price must be between ₹${minPrice.toLocaleString()} and ₹${maxPrice.toLocaleString()}.`);
      return;
    }

    const random10Digit = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    setBookingResult({
      bookingId: random10Digit,
      role: 'cabowner',
      flight: 'FL-401 (Narita 10:30 arrival)',
      hotel: 'Hotel Ueno Garden Inn (HTL-TYO-004)',
      pickup: `10 April 2027 at ${busyStartTime}`,
      supplier: 'Sakura Cabs (Verified Tokyo Partner)',
      car: 'Toyota Crown Sedan (License: 88-21)',
      price: priceNum,
      busyWindow: `${busyStartTime} - ${busyEndTime} (R6: No overlapping bookings)`,
      status: 'Dispatched & Confirmed'
    });
  };

  const handleReset = () => {
    setBookingResult(null);
    setRuleError('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <span className="modal-badge">Hackathon Problem 2 · Tokyo Airport Taxi</span>
            <h2 className="modal-title">
              {currentRole === 'cabowner' ? 'Cabowner Dispatch & Fleet System' : 'Airport Taxi · Ride Offer Engine'}
            </h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Role Switcher Tabs */}
        <div className="modal-role-tabs">
          <button
            type="button"
            className={`modal-role-tab ${currentRole === 'traveller' ? 'modal-role-tab--active' : ''}`}
            onClick={() => handleTabSwitch('traveller')}
          >
            Traveller View (Menon Family)
          </button>
          <button
            type="button"
            className={`modal-role-tab ${currentRole === 'cabowner' ? 'modal-role-tab--active' : ''}`}
            onClick={() => handleTabSwitch('cabowner')}
          >
            Cabowner View (Sakura Cabs)
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {!bookingResult ? (
            currentRole === 'traveller' ? (
              /* ====================================================================
                 TRAVELLER FORM (Menon Family)
                 ==================================================================== */
              <form onSubmit={handleConfirmTravelerBooking} className="booking-form">
                <div className="form-section">
                  <h3 className="section-title">1. Traveler Flight & Route Details</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Arrival Flight</label>
                      <input 
                        type="text" 
                        value={flightNumber} 
                        onChange={(e) => setFlightNumber(e.target.value)}
                        required 
                      />
                      <small>Landing Narita (NRT) at 10:30</small>
                    </div>
                    <div className="form-group">
                      <label>Destination Hotel</label>
                      <input 
                        type="text" 
                        value={hotelCode} 
                        onChange={(e) => setHotelCode(e.target.value)}
                        required 
                      />
                      <small>Hotel Ueno Garden Inn (Ueno Area)</small>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Adults & Children (Rule R1)</label>
                      <div className="counter-row">
                        <span>Adults: <b>{adults}</b></span>
                        <span>Children (age 6): <b>{children}</b></span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Luggage Count (Rule R5)</label>
                      <div className="counter-row">
                        <span>Large: <b>{largeBags}</b></span>
                        <span>Small: <b>{smallBags}</b></span>
                      </div>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Pickup Time (Min 60m buffer - Rule R2)</label>
                      <input 
                        type="time" 
                        value={pickupTime} 
                        onChange={(e) => setPickupTime(e.target.value)}
                        required 
                      />
                      <small>Flight lands 10:30 &rarr; Earliest pickup 11:30</small>
                    </div>
                    <div className="form-group">
                      <label>Route Price Range (Rule R3)</label>
                      <div className="price-tag-box">
                        <span className="price-range">₹{minPrice.toLocaleString()} – ₹{maxPrice.toLocaleString()}</span>
                        <span className="route-info">Narita (NRT) &rarr; Ueno</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">2. Price Offer & Supplier Selection</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Your Proposed Price (₹)</label>
                      <input 
                        type="number" 
                        value={travelerPrice} 
                        onChange={(e) => setTravelerPrice(e.target.value)}
                        className={
                          travelerPrice < minPrice || travelerPrice > maxPrice 
                            ? 'input-error' 
                            : 'input-valid'
                        }
                        required 
                      />
                      <small>
                        {travelerPrice < minPrice && <span className="text-danger">Below minimum ₹{minPrice.toLocaleString()}!</span>}
                        {travelerPrice > maxPrice && <span className="text-danger">Above maximum ₹{maxPrice.toLocaleString()}!</span>}
                        {travelerPrice >= minPrice && travelerPrice <= maxPrice && (
                          <span className="text-success">Valid price within allowed band!</span>
                        )}
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Select Verified Supplier (Rule R4)</label>
                      <select 
                        value={selectedSupplier} 
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                      >
                        <option value="Sakura Cabs">Sakura Cabs (Narita & Haneda Licensed)</option>
                        <option value="Tokyo Airport Express">Tokyo Airport Express</option>
                        <option value="Ueno Shuttles">Ueno Shuttles</option>
                      </select>
                      <small>Only suppliers serving Narita and Ueno appear</small>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Assigned Vehicle Type (Rule R5)</label>
                    <div className="car-type-pills">
                      {['HATCHBACK', 'SEDAN', 'SUV', 'BUS'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          className={`type-pill ${carType === type ? 'type-pill--active' : ''}`}
                          onClick={() => setCarType(type)}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {ruleError && (
                  <div className="modal-error-banner">
                    <span>⚠</span> {ruleError}
                  </div>
                )}

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Submit Offer & Generate 10-Digit Booking (R8)
                  </button>
                </div>
              </form>
            ) : (
              /* ====================================================================
                 CABOWNER FORM (Sakura Cabs Supplier Dashboard)
                 ==================================================================== */
              <form onSubmit={handleCabOwnerAccept} className="booking-form">
                <div className="form-section">
                  <h3 className="section-title">1. Supplier Credentials (Rule R4)</h3>
                  <div className="supplier-card-noir">
                    <div className="supplier-header-row">
                      <span className="supplier-name">Sakura Cabs Tokyo</span>
                      <span className="supplier-status-badge">● Active & Licensed</span>
                    </div>
                    <div className="supplier-specs-grid">
                      <div><strong>Licensed Airports:</strong> Narita (NRT), Haneda (HND)</div>
                      <div><strong>Operating Hours:</strong> 06:00 – 23:00 Daily</div>
                      <div><strong>Active Fleet:</strong> 8 Sedans, 4 SUVs, 2 Vans</div>
                      <div><strong>Rating:</strong> 4.9 ★ (1,420 trips)</div>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">2. Incoming Ride Offer Queue</h3>
                  <div className="request-card-noir">
                    <div className="request-badge-row">
                      <span className="request-code">REQUEST #REQ-NRT-401</span>
                      <span className="request-tag">Menon Family · 3 Passengers</span>
                    </div>
                    <p className="request-desc">
                      Flight FL-401 at Narita (10:30 arrival) &rarr; Hotel Ueno Garden Inn.<br />
                      Luggage: 3 Large + 2 Small bags. Pickup: 11:30 AM.
                    </p>
                    <div className="request-pricing-row">
                      <span>Traveler Offered Price:</span>
                      <strong className="request-price">₹12,000</strong>
                      <span className="request-route-band">(Allowed Band: ₹10,200 – ₹16,800)</span>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">3. Vehicle & Schedule Assignment (Rules R5 & R6)</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Assign Vehicle From Fleet</label>
                      <select 
                        value={assignedVehicle} 
                        onChange={(e) => setAssignedVehicle(e.target.value)}
                      >
                        <option value="TOYOTA_CROWN_SEDAN">Toyota Crown (Sedan) · Fits 4 pax, 3L + 2S</option>
                        <option value="LEXUS_LX_SUV">Lexus LX (SUV) · Fits 6 pax, 5L + 4S</option>
                      </select>
                      <small>Vehicle fits Menon family capacity requirement (Rule R5)</small>
                    </div>

                    <div className="form-group">
                      <label>Cabowner Acceptance Price (₹)</label>
                      <input 
                        type="number" 
                        value={cabOwnerBidPrice} 
                        onChange={(e) => setCabOwnerBidPrice(e.target.value)}
                        required 
                      />
                      <small>Route band: ₹10,200 – ₹16,800 (Rule R3)</small>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Calculated Busy Window (Rule R6)</label>
                      <div className="busy-window-preview">
                        <span>{busyStartTime} to {busyEndTime} (90 min transfer)</span>
                      </div>
                      <small>Ensures non-overlapping vehicle assignment (Rule R6)</small>
                    </div>

                    <div className="form-group">
                      <label>Flight Delay Monitoring (Rule R7)</label>
                      <div className="policy-note">
                        <span>Automatic 60m buffer active for flight FL-401</span>
                      </div>
                    </div>
                  </div>
                </div>

                {ruleError && (
                  <div className="modal-error-banner">
                    <span>⚠</span> {ruleError}
                  </div>
                )}

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={onClose}>
                    Close
                  </button>
                  <button type="submit" className="btn-primary">
                    Accept Offer & Dispatch Toyota Crown
                  </button>
                </div>
              </form>
            )
          ) : (
            /* ====================================================================
               CONFIRMATION RESULT VIEW (10-Digit Booking - Rule R8)
               ==================================================================== */
            <div className="booking-success-view">
              <div className="success-badge">
                <span className="success-icon">&#10003;</span>
                <h3>{bookingResult.role === 'cabowner' ? 'Ride Dispatched & Confirmed!' : 'Booking Confirmed!'}</h3>
              </div>

              <div className="booking-code-card">
                <span className="code-label">10-DIGIT BOOKING REFERENCE (RULE R8)</span>
                <span className="code-number">{bookingResult.bookingId}</span>
                <small>Retain this booking code to inspect status or request itinerary changes (Rule R9).</small>
              </div>

              <div className="summary-list">
                <div className="summary-row">
                  <span>Booking Flow:</span>
                  <strong>{bookingResult.role === 'cabowner' ? 'Cabowner (Sakura Cabs)' : 'Traveller (Menon Family)'}</strong>
                </div>
                <div className="summary-row">
                  <span>Flight & Route:</span>
                  <strong>{bookingResult.flight} &rarr; {bookingResult.hotel}</strong>
                </div>
                <div className="summary-row">
                  <span>Pickup Time:</span>
                  <strong>{bookingResult.pickup}</strong>
                </div>
                <div className="summary-row">
                  <span>Vehicle & Driver:</span>
                  <strong>{bookingResult.car}</strong>
                </div>
                {bookingResult.busyWindow && (
                  <div className="summary-row">
                    <span>Locked Busy Window:</span>
                    <strong>{bookingResult.busyWindow}</strong>
                  </div>
                )}
                <div className="summary-row">
                  <span>Agreed Price:</span>
                  <strong className="text-highlight">₹{bookingResult.price.toLocaleString()}</strong>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleReset}>
                  Test Another Flow
                </button>
                <button type="button" className="btn-primary" onClick={onClose}>
                  Done & Return to Showcase
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookingModal;
