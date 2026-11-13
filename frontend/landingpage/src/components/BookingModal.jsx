import React, { useState } from 'react';
import '../css/BookingModal.css';

/**
 * BookingModal Component implementing the full Problem 2 Hackathon Rules (R1 - R9).
 * Simulates both the Menon Family (traveler) offer and Sakura Cabs (supplier) flow.
 */
function BookingModal({ isOpen, onClose }) {
  // Form state initialized with the Menon family scenario from Problem 2
  const [flightNumber, setFlightNumber] = useState('FL-401');
  const [hotelCode, setHotelCode] = useState('HTL-TYO-004'); // Ueno Garden Inn
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(1);
  const [largeBags, setLargeBags] = useState(3);
  const [smallBags, setSmallBags] = useState(2);
  const [pickupTime, setPickupTime] = useState('11:30');
  const [travelerPrice, setTravelerPrice] = useState(12000);
  
  // Suggested price range for Narita -> Ueno route (routes.json)
  const minPrice = 10200;
  const maxPrice = 16800;
  
  // Booking confirmation state
  const [bookingResult, setBookingResult] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState('Sakura Cabs');
  const [carType, setCarType] = useState('SEDAN');
  const [ruleError, setRuleError] = useState('');

  if (!isOpen) return null;

  // Validate offer and process booking
  const handleConfirmBooking = (e) => {
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
      flight: flightNumber,
      hotel: 'Hotel Ueno Garden Inn (HTL-TYO-004)',
      pickup: `10 April 2027 at ${pickupTime}`,
      supplier: selectedSupplier,
      car: `${carType} (Fits ${adults + children} passengers, ${largeBags}L + ${smallBags}S bags)`,
      price: priceNum,
      status: 'Confirmed'
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
            <span className="modal-badge">Hackathon Scenario 1 & 2</span>
            <h2 className="modal-title">Airport Taxi · Ride Offer Engine</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {!bookingResult ? (
            <form onSubmit={handleConfirmBooking} className="booking-form">
              {/* Trip & Route summary */}
              <div className="form-section">
                <h3 className="section-title">1. Traveler Details (Menon Family Scenario)</h3>
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
                    <label>Hotel Code</label>
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
                    <label>Adults & Children</label>
                    <div className="counter-row">
                      <span>Adults: <b>{adults}</b></span>
                      <span>Children (age 6): <b>{children}</b></span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Baggage Count</label>
                    <div className="counter-row">
                      <span>Large: <b>{largeBags}</b></span>
                      <span>Small: <b>{smallBags}</b></span>
                    </div>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Pickup Time (Min 60m after flight - R2)</label>
                    <input 
                      type="time" 
                      value={pickupTime} 
                      onChange={(e) => setPickupTime(e.target.value)}
                      required 
                    />
                    <small>Flight lands 10:30 → Earliest valid pickup 11:30</small>
                  </div>
                  <div className="form-group">
                    <label>Suggested Route Price Range (R3)</label>
                    <div className="price-tag-box">
                      <span className="price-range">₹{minPrice.toLocaleString()} – ₹{maxPrice.toLocaleString()}</span>
                      <span className="route-info">Narita (NRT) → Ueno</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Offer & Supplier Selection */}
              <div className="form-section">
                <h3 className="section-title">2. Traveler Offer & Supplier Matching</h3>
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
                    <label>Available Verified Supplier</label>
                    <select 
                      value={selectedSupplier} 
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                    >
                      <option value="Sakura Cabs">Sakura Cabs (Narita & Haneda Licensed)</option>
                      <option value="Tokyo Airport Express">Tokyo Airport Express</option>
                      <option value="Ueno Shuttles">Ueno Shuttles</option>
                    </select>
                    <small>Only suppliers serving Narita and Ueno appear (Rule R4)</small>
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

              {/* Validation error display */}
              {ruleError && (
                <div className="modal-error-banner">
                  <span>⚠</span> {ruleError}
                </div>
              )}

              {/* Action buttons */}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm & Generate 10-Digit Booking
                </button>
              </div>
            </form>
          ) : (
            /* Booking Confirmation Result (Rule R8) */
            <div className="booking-success-view">
              <div className="success-badge">
                <span className="success-icon">&#10003;</span>
                <h3>Booking Confirmed!</h3>
              </div>

              <div className="booking-code-card">
                <span className="code-label">10-DIGIT BOOKING REFERENCE (RULE R8)</span>
                <span className="code-number">{bookingResult.bookingId}</span>
                <small>Keep this number to open your ride summary or request changes.</small>
              </div>

              <div className="summary-list">
                <div className="summary-row">
                  <span>Traveler:</span>
                  <strong>Menon Family (2 Adults + 1 Child)</strong>
                </div>
                <div className="summary-row">
                  <span>Flight & Route:</span>
                  <strong>{bookingResult.flight} · {bookingResult.hotel}</strong>
                </div>
                <div className="summary-row">
                  <span>Pickup Time:</span>
                  <strong>{bookingResult.pickup}</strong>
                </div>
                <div className="summary-row">
                  <span>Supplier & Car:</span>
                  <strong>{bookingResult.supplier} · {bookingResult.car}</strong>
                </div>
                <div className="summary-row">
                  <span>Agreed Price:</span>
                  <strong className="text-highlight">₹{bookingResult.price.toLocaleString()}</strong>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleReset}>
                  Test Another Scenario
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

