const catalogService = require('./catalog.service');
const routePricingService = require('./routePricing.service');
const vehicleCapacityService = require('./vehicleCapacity.service');
const availabilityService = require('./availability.service');
const rideRequestRepo = require('../repositories/rideRequest.repository');

/**
 * Checks if a supplier is open at the given pickup time string.
 * Both ends of the operating hours are included. Handles midnight crossing (e.g. 05:00 to 01:00).
 */
function isSupplierOpen(supplier, pickupAt) {
  if (!supplier.service_from || !supplier.service_until) {
    return true; // If not specified, assume open 24/7
  }

  // Extract HH:MM from ISO string
  const timeMatch = pickupAt.match(/T(\d{2}:\d{2})/);
  if (!timeMatch) return false;
  const pickupClock = timeMatch[1];

  const from = supplier.service_from;
  const until = supplier.service_until;

  if (from <= until) {
    return pickupClock >= from && pickupClock <= until;
  } else {
    // Crosses midnight (e.g. 05:00 to 01:00)
    return pickupClock >= from || pickupClock <= until;
  }
}

/**
 * Checks whether a particular supplier can serve a specific ride request (R4).
 */
function canSupplierServeRequest(supplier, request, flight, hotel, driveMinutes) {
  if (!supplier) return false;

  const targetFlight = flight || catalogService.getFlightById(request.flightId || request.flight_id);
  const targetHotel = hotel || catalogService.getHotelById(request.hotelId || request.hotel_id);
  if (!targetFlight || !targetHotel) return false;

  // 1. Check arrival airport
  const airports = supplier.airports || [];
  if (!airports.includes(targetFlight.to)) {
    return false;
  }

  // 2 & 3. Check hotel city and area
  const areas = supplier.areas || [];
  const servesArea = areas.some(
    a => a.city.toLowerCase() === targetHotel.city.toLowerCase() &&
         a.area.toLowerCase() === targetHotel.area.toLowerCase()
  );
  if (!servesArea) {
    return false;
  }

  // 4. Check operating hours
  const pickupTime = request.pickupTime || request.pickupAt || request.pickup_at || request.pickup;
  if (!pickupTime || !isSupplierOpen(supplier, pickupTime)) {
    return false;
  }

  // 5. Determine drive duration
  let minutes = driveMinutes;
  if (minutes === undefined) {
    try {
      const route = routePricingService.getRoute(targetFlight.flight_id, targetHotel.hotel_id);
      minutes = route.drive_minutes;
    } catch (e) {
      return false;
    }
  }

  // 6. Check whether at least one car has sufficient capacity (R5) and is available (R6)
  const vehicles = supplier.vehicles || [];
  const hasSuitableCar = vehicles.some((car) => {
    const capacityCheck = vehicleCapacityService.validateCarCapacity(car, request);
    if (!capacityCheck.valid) return false;

    const availabilityCheck = availabilityService.isCarAvailable(car.vehicle_id, pickupTime, minutes);
    return availabilityCheck.available;
  });

  return hasSuitableCar;
}

/**
 * Returns detailed reasons why a supplier cannot serve a request.
 */
function explainIneligibility(supplier, request) {
  if (!supplier) return { eligible: false, reasons: ['Supplier not found'] };

  const flight = catalogService.getFlightById(request.flightId || request.flight_id);
  const hotel = catalogService.getHotelById(request.hotelId || request.hotel_id);
  const reasons = [];

  if (!flight) reasons.push('Flight not found in catalog');
  if (!hotel) reasons.push('Hotel not found in catalog');
  if (!flight || !hotel) return { eligible: false, reasons };

  // 1. Airport check
  const airports = supplier.airports || [];
  if (!airports.includes(flight.to)) {
    reasons.push(`Supplier does not operate at arrival airport ${flight.to}. Serves: [${airports.join(', ')}]`);
  }

  // 2. City & Area check
  const areas = supplier.areas || [];
  const servesArea = areas.some(
    a => a.city.toLowerCase() === hotel.city.toLowerCase() &&
         a.area.toLowerCase() === hotel.area.toLowerCase()
  );
  if (!servesArea) {
    reasons.push(`Supplier does not drive to ${hotel.city} (${hotel.area})`);
  }

  // 3. Operating hours check
  const pickupTime = request.pickupTime || request.pickupAt || request.pickup_at || request.pickup;
  if (!isSupplierOpen(supplier, pickupTime)) {
    const timeMatch = pickupTime.match(/T(\d{2}:\d{2})/);
    const clock = timeMatch ? timeMatch[1] : pickupTime;
    reasons.push(`Pickup time ${clock} is outside supplier operating hours (${supplier.service_from} – ${supplier.service_until})`);
  }

  // 4. Vehicle check
  let driveMinutes = 60;
  try {
    const route = routePricingService.getRoute(flight.flight_id, hotel.hotel_id);
    driveMinutes = route.drive_minutes;
  } catch (e) {
    reasons.push(e.message);
  }

  const vehicles = supplier.vehicles || [];
  const suitableVehicles = [];
  const vehicleIssues = [];

  for (const car of vehicles) {
    const cap = vehicleCapacityService.validateCarCapacity(car, request);
    if (!cap.valid) {
      vehicleIssues.push(`${car.vehicle_id} (${car.type}): ${cap.message}`);
      continue;
    }
    const avail = availabilityService.isCarAvailable(car.vehicle_id, pickupTime, driveMinutes);
    if (!avail.available) {
      vehicleIssues.push(`${car.vehicle_id} (${car.type}): Busy at requested time window`);
      continue;
    }
    suitableVehicles.push(car);
  }

  if (suitableVehicles.length === 0) {
    reasons.push(`No available vehicle fits the request: ${vehicleIssues.join('; ')}`);
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    suitableVehicles,
  };
}

/**
 * Returns all suppliers that satisfy eligibility requirements for a given request.
 */
function getEligibleSuppliers(request) {
  const allSuppliers = catalogService.getSuppliers();
  const flight = catalogService.getFlightById(request.flightId || request.flight_id);
  const hotel = catalogService.getHotelById(request.hotelId || request.hotel_id);
  let driveMinutes = 60;
  try {
    const route = routePricingService.getRoute(flight.flight_id, hotel.hotel_id);
    driveMinutes = route.drive_minutes;
  } catch (e) {}

  return allSuppliers.filter(s => canSupplierServeRequest(s, request, flight, hotel, driveMinutes));
}

/**
 * Returns all ride requests eligible for a specific supplier.
 */
function getSupplierEligibleRequests(supplierId) {
  const supplier = catalogService.getSupplierById(supplierId);
  if (!supplier) return [];

  const openRequests = rideRequestRepo.findOpenRequests();
  return openRequests.filter(req => {
    return canSupplierServeRequest(supplier, req);
  });
}

module.exports = {
  isSupplierOpen,
  canSupplierServeRequest,
  explainIneligibility,
  getEligibleSuppliers,
  getSupplierEligibleRequests,
};

