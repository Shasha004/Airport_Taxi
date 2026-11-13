const rideRequestRepo = require('../repositories/rideRequest.repository');
const bookingRepo = require('../repositories/booking.repository');
const changeRequestRepo = require('../repositories/changeRequest.repository');
const changeRequestService = require('./changeRequest.service');
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

    const travelerId = payload.travelerId || payload.traveler_id;

    // Deduplication check: if an identical open request was recently submitted
    // (e.g. from multiple rapid clicks on submit), return the existing open request
    // so only ONE request is created and reflected.
    const existingDuplicate = rideRequestRepo.findDuplicateOpenRequest({
      travelerId,
      travelerName,
      flightId,
      hotelId,
      pickupAt: pickupTime,
      travelerPrice,
      adults,
    });

    if (existingDuplicate) {
      return this.enrichRequest(existingDuplicate);
    }

    // Generate unique request ID: REQ- followed by timestamp suffix
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedId = `REQ-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const newRecord = {
      id: payload.id || payload.requestId || generatedId,
      travelerId,
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
    const deduplicated = [];
    const seen = new Set();
    for (const req of requests) {
      const key = req.status === 'open'
        ? `${(req.travelerName || '').trim().toLowerCase()}_${req.flightId}_${req.hotelId}_${(req.pickupAt || '').slice(0, 16)}_${req.travelerPrice}`
        : `id_${req.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(req);
      }
    }
    return deduplicated.map(req => this.enrichRequest(req));
  }

  getTravelers() {
    return rideRequestRepo.getDistinctTravelers();
  }

  updateRideRequest(id, payload) {
    const request = rideRequestRepo.findById(id);
    if (!request) {
      const err = new Error(`Ride request with ID "${id}" not found`);
      err.statusCode = 404;
      throw err;
    }

    const booking = bookingRepo.findByRequestId(id);
    if (booking && booking.status === 'confirmed') {
      // If a booking is confirmed, forward to change request so supplier gets option to accept/reject
      return changeRequestService.createChangeRequest(booking.bookingNumber, payload);
    }

    // Otherwise, validate and update open request directly
    const targetFlightId = payload.flightId || payload.flight_id || request.flightId;
    const targetPickupAt = payload.pickupTime || payload.pickupAt || payload.pickup_at || request.pickupAt;

    const flight = catalogService.getFlightById(targetFlightId);
    if (!flight) {
      const err = new Error(`Flight "${targetFlightId}" not found`);
      err.statusCode = 400;
      throw err;
    }

    const hotel = catalogService.getHotelById(request.hotelId);
    if (hotel) {
      const airport = catalogService.getAirportByCode(flight.to);
      if (!airport?.serves_cities?.includes(hotel.city)) {
        const err = new Error(`Flight destination ${flight.to} does not serve hotel city ${hotel.city}`);
        err.statusCode = 400;
        throw err;
      }
    }

    requestValidator.validatePickupTime(flight, targetPickupAt);

    const updated = rideRequestRepo.update(id, {
      flightId: targetFlightId,
      pickupAt: targetPickupAt,
    });

    return this.enrichRequest(updated);
  }

  reportFlightDelay(id, payload = {}) {
    const request = rideRequestRepo.findById(id);
    if (!request) {
      const err = new Error(`Ride request with ID "${id}" not found`);
      err.statusCode = 404;
      throw err;
    }

    const targetFlightId = payload.newFlightId || payload.flightId || request.flightId;
    const flight = catalogService.getFlightById(targetFlightId);
    if (!flight) {
      const err = new Error(`Flight "${targetFlightId}" not found`);
      err.statusCode = 400;
      throw err;
    }

    let calculatedPickupAt = payload.newPickupAt || payload.pickupTime || payload.pickupAt;

    if (!calculatedPickupAt && payload.delayMinutes) {
      const curTime = request.pickupAt;
      const curMs = new Date(curTime.endsWith('Z') ? curTime : curTime + 'Z').getTime();
      const newMs = curMs + Number(payload.delayMinutes) * 60 * 1000;
      calculatedPickupAt = new Date(newMs).toISOString().slice(0, 19);
    }

    if (!calculatedPickupAt) {
      const err = new Error('Either delayMinutes or newPickupAt must be provided');
      err.statusCode = 400;
      throw err;
    }

    // Ensure R2 validation (pickup at least 60m after flight landing)
    requestValidator.validatePickupTime(flight, calculatedPickupAt);

    const booking = bookingRepo.findByRequestId(id);
    if (booking && booking.status === 'confirmed') {
      const changeReq = changeRequestService.createChangeRequest(booking.bookingNumber, {
        newFlightId: targetFlightId !== booking.flightId ? targetFlightId : undefined,
        newPickupAt: calculatedPickupAt,
      });

      return {
        success: true,
        isBooked: true,
        message: 'Flight delay reported. Updated schedule sent to your confirmed supplier for accept/reject review.',
        changeRequest: changeReq,
        booking: {
          bookingNumber: booking.bookingNumber,
          supplierId: booking.supplierId,
        },
        request: this.enrichRequest(request),
      };
    }

    const updated = rideRequestRepo.update(id, {
      flightId: targetFlightId,
      pickupAt: calculatedPickupAt,
    });

    return {
      success: true,
      isBooked: false,
      message: 'Flight delay recorded. Ride request pickup time updated successfully.',
      request: this.enrichRequest(updated),
    };
  }

  enrichRequest(request) {
    if (!request) return null;
    const flight = catalogService.getFlightById(request.flightId);
    const hotel = catalogService.getHotelById(request.hotelId);
    const airport = flight ? catalogService.getAirportByCode(flight.to) : null;
    let route = null;
    try {
      if (flight && hotel) {
        route = routePricingService.getRoute(flight.flight_id, hotel.hotel_id);
      }
    } catch (e) {
      // Ignored if incompatible
    }

    const booking = bookingRepo.findByRequestId(request.id);
    let changeRequests = [];
    let pendingChangeRequest = null;
    let supplier = null;

    if (booking) {
      const crs = changeRequestRepo.findByBookingId(booking.id);
      changeRequests = crs.map(cr => changeRequestService.enrichChangeRequest(cr));
      pendingChangeRequest = changeRequests.find(cr => cr.status === 'pending') || null;
      supplier = catalogService.getSupplierById(booking.supplierId);
    }

    return {
      ...request,
      booking: booking ? {
        ...booking,
        supplier,
      } : null,
      hasBooking: Boolean(booking && booking.status === 'confirmed' && request.status !== 'cancelled'),
      isCancelled: Boolean(request.status === 'cancelled' || (booking && booking.status === 'cancelled')),
      pendingChangeRequest,
      changeRequests,
      flight: flight ? {
        flight_id: flight.flight_id,
        flight_number: flight.flight_number,
        airline: flight.airline,
        from: flight.from,
        to: flight.to,
        arrival_local: flight.arrival_local,
        airport: airport ? {
          code: airport.code,
          name: airport.name,
          city: airport.city,
          lat: airport.lat,
          lng: airport.lng,
        } : null,
      } : null,
      hotel: hotel ? {
        hotel_id: hotel.hotel_id,
        name: hotel.name,
        city: hotel.city,
        area: hotel.area,
        lat: hotel.lat,
        lng: hotel.lng,
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
