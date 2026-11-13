const catalogService = require('../services/catalog.service');
const routePricingService = require('../services/routePricing.service');
const supplierEligibilityService = require('../services/supplierEligibility.service');
const vehicleCapacityService = require('../services/vehicleCapacity.service');
const availabilityService = require('../services/availability.service');

function validateOfferPrice(price, minPrice, maxPrice) {
  const numPrice = Number(price);
  if (isNaN(numPrice) || price === '' || price === null || price === undefined) {
    return {
      valid: false,
      rule: 'R7',
      message: 'Offer price is required and must be a number.',
    };
  }

  if (numPrice < minPrice || numPrice > maxPrice) {
    return {
      valid: false,
      rule: 'R7',
      message: `Offer price ₹${numPrice.toLocaleString()} is outside the allowed route range of ₹${minPrice.toLocaleString()} – ₹${maxPrice.toLocaleString()}.`,
    };
  }

  return {
    valid: true,
    price: numPrice,
  };
}

function validateOffer(request, supplierId, carId, price) {
  if (!request) {
    throw new Error('Ride request not found');
  }

  if (request.status !== 'open') {
    throw new Error(`Cannot submit an offer for request with status "${request.status}". Only open requests accept offers.`);
  }

  // 1. Validate Supplier
  const supplier = catalogService.getSupplierById(supplierId);
  if (!supplier) {
    throw new Error(`Supplier with ID "${supplierId}" not found in catalog.`);
  }

  const flight = catalogService.getFlightById(request.flightId || request.flight_id);
  const hotel = catalogService.getHotelById(request.hotelId || request.hotel_id);
  if (!flight || !hotel) {
    throw new Error('Flight or hotel metadata for this request is missing from catalog.');
  }

  // 2. Validate Route & Drive Minutes
  const route = routePricingService.getRoute(flight.flight_id, hotel.hotel_id);

  // 3. Verify Supplier Eligibility (R4)
  const pickupTime = request.pickupTime || request.pickupAt || request.pickup_at;
  if (!supplier.airports || !supplier.airports.includes(flight.to)) {
    throw new Error(`R4 Violation: Supplier "${supplier.name}" does not operate at arrival airport ${flight.to}.`);
  }

  const targetCity = (hotel.city || '').toLowerCase().trim();
  const targetArea = (hotel.area || '').toLowerCase().trim();
  const servesArea = (supplier.areas || []).some(a => {
    const aCity = (a.city || '').toLowerCase().trim();
    const aArea = (a.area || '').toLowerCase().trim();
    return (aCity === targetCity && aArea === targetArea) || (aCity === targetCity);
  }) || (() => {
    if (flight && flight.to && supplier.airports && supplier.airports.includes(flight.to)) {
      const airport = catalogService.getAirportByCode(flight.to);
      if (airport) {
        const apCity = (airport.city || '').toLowerCase().trim();
        const sc = (airport.serves_cities || []).map(c => c.toLowerCase().trim());
        return apCity === targetCity || sc.includes(targetCity);
      }
    }
    return false;
  })();

  if (!servesArea) {
    throw new Error(`R4 Violation: Supplier "${supplier.name}" does not serve ${hotel.city} (${hotel.area}).`);
  }

  if (!supplierEligibilityService.isSupplierOpen(supplier, pickupTime)) {
    throw new Error(`R4 Violation: Supplier "${supplier.name}" is closed at pickup time (${pickupTime}). Operating hours: ${supplier.service_from} – ${supplier.service_until}.`);
  }

  // 4. Validate Car belongs to supplier
  const car = (supplier.vehicles || []).find(v => v.vehicle_id === carId);
  if (!car) {
    throw new Error(`R5/R7 Violation: Vehicle "${carId}" does not belong to supplier "${supplier.name}".`);
  }

  // 5. Validate Passenger & Luggage Capacity (R5)
  const capacityCheck = vehicleCapacityService.validateCarCapacity(car, request);
  if (!capacityCheck.valid) {
    throw new Error(`${capacityCheck.rule} Violation: ${capacityCheck.message}`);
  }

  // 6. Validate Car Availability (R6)
  const availabilityCheck = availabilityService.isCarAvailable(car.vehicle_id, pickupTime, route.drive_minutes);
  if (!availabilityCheck.available) {
    const conflictMsgs = availabilityCheck.conflicts.map(c => c.message).join(' ');
    throw new Error(`R6 Violation: Vehicle "${car.vehicle_id}" is not available: ${conflictMsgs}`);
  }

  // 7. Validate Offer Price (R7)
  const priceCheck = validateOfferPrice(price, route.price_min_inr, route.price_max_inr);
  if (!priceCheck.valid) {
    throw new Error(`${priceCheck.rule} Violation: ${priceCheck.message}`);
  }

  return {
    valid: true,
    supplier,
    car,
    route,
    price: priceCheck.price,
  };
}

module.exports = {
  validateOfferPrice,
  validateOffer,
};

