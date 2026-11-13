const rideRequestRepo = require('../repositories/rideRequest.repository');
const requestValidator = require('../validators/request.validator');
const catalogService = require('./catalog.service');
const routePricingService = require('./routePricing.service');

class RideRequestService {
  createRideRequest(payload) {
    // Run full validation pipeline (R1, R2, R3, etc.)
    const validationResult = requestValidator.validateRideRequest(payload);
    if (!validationResult.isValid) {
      const err = new Error(validationResult.errors.join('; '));
      err.statusCode = 400;
      err.errors = validationResult.errors;
      throw err;
    }

    const {
      flightId,
      hotelId,
      travelerName,
      adults,
      childAges,
      largeBags,
      smallBags,
      pickupTime,
      travelerPrice,
      carType,
    } = validationResult.data;

    // Generate unique request ID: REQ- followed by timestamp suffix
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedId = `REQ-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const newRecord = {
      id: payload.id || payload.requestId || generatedId,
      travelerId: payload.travelerId || payload.traveler_id,
      travelerName,
      flightId,
      hotelId,
      adults,
      childAges,
      largeBags,
      smallBags,
      pickupTime,
      carType,
      travelerPrice,
      status: 'open',
    };

    const saved = rideRequestRepo.create(newRecord);
    return this.enrichRequest(saved);
  }

  getRideRequestById(requestId) {
    const request = rideRequestRepo.findById(requestId);
    if (!request) {
      return null;
    }
    return this.enrichRequest(request);
  }

  listOpenRideRequests() {
    return this.listRideRequests({ status: 'open' });
  }

  listAllRideRequests() {
    return this.listRideRequests();
  }

  listRideRequests(filters = {}) {
    const requests = rideRequestRepo.findAll(filters);
    return requests.map(req => this.enrichRequest(req));
  }

  getTravelers() {
    return rideRequestRepo.getDistinctTravelers();
  }

  enrichRequest(request) {
    if (!request) return null;
    const flight = catalogService.getFlightById(request.flightId);
    const hotel = catalogService.getHotelById(request.hotelId);
    let route = null;
    try {
      if (flight && hotel) {
        route = routePricingService.getRoute(flight.flight_id, hotel.hotel_id);
      }
    } catch (e) {
      // Ignored if incompatible
    }

    return {
      ...request,
      flight: flight ? {
        flight_id: flight.flight_id,
        flight_number: flight.flight_number,
        airline: flight.airline,
        from: flight.from,
        to: flight.to,
        arrival_local: flight.arrival_local,
      } : null,
      hotel: hotel ? {
        hotel_id: hotel.hotel_id,
        name: hotel.name,
        city: hotel.city,
        area: hotel.area,
      } : null,
      route: route ? {
        distance_km: route.distance_km,
        drive_minutes: route.drive_minutes,
        price_min_inr: route.price_min_inr,
        price_max_inr: route.price_max_inr,
      } : null,
    };
  }
}

module.exports = new RideRequestService();

