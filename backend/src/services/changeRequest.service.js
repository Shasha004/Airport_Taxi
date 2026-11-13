const changeRequestRepo = require('../repositories/changeRequest.repository');
const bookingRepo = require('../repositories/booking.repository');
const catalogService = require('./catalog.service');
const routePricingService = require('./routePricing.service');
const availabilityService = require('./availability.service');
const requestValidator = require('../validators/request.validator');

class ChangeRequestService {
  createChangeRequest(bookingNumber, payload) {
    const booking = bookingRepo.findByBookingNumber(bookingNumber);
    if (!booking) {
      const err = new Error(`Booking with number "${bookingNumber}" not found.`);
      err.statusCode = 404;
      err.code = 'BOOKING_NOT_FOUND';
      throw err;
    }

    if (booking.status !== 'confirmed') {
      const err = new Error(`Cannot request changes for booking with status "${booking.status}".`);
      err.statusCode = 400;
      throw err;
    }

    const newFlightId = payload.newFlightId || payload.new_flight_id || null;
    const newPickupAt = payload.newPickupAt || payload.new_pickup_at || null;

    if (!newFlightId && !newPickupAt) {
      const err = new Error('At least one change (newFlightId or newPickupAt) must be provided.');
      err.statusCode = 400;
      throw err;
    }

    const currentHotel = catalogService.getHotelById(booking.hotelId);
    let targetFlight = null;

    // Validate new flight if provided (R1)
    if (newFlightId) {
      targetFlight = catalogService.getFlightById(newFlightId);
      if (!targetFlight) {
        const err = new Error(`New flight "${newFlightId}" not found in catalog.`);
        err.statusCode = 400;
        throw err;
      }
      if (currentHotel) {
        const airport = catalogService.getAirportByCode(targetFlight.to);
        const serves = airport?.serves_cities || [];
        if (!serves.includes(currentHotel.city)) {
          const err = new Error(
            `R1 Violation: New flight arrives at ${targetFlight.to} which does not serve destination hotel city "${currentHotel.city}".`
          );
          err.statusCode = 400;
          throw err;
        }
      }
    } else {
      targetFlight = catalogService.getFlightById(booking.flightId);
    }

    // Validate new pickup if provided (R2)
    if (newPickupAt && targetFlight) {
      try {
        requestValidator.validatePickupTime(targetFlight, newPickupAt);
      } catch (e) {
        const err = new Error(`R2 Violation: ${e.message}`);
        err.statusCode = 400;
        throw err;
      }
    }

    const created = changeRequestRepo.create({
      bookingId: booking.id,
      newFlightId,
      newPickupAt,
      status: 'pending',
    });

    return this.enrichChangeRequest(created);
  }

  getSupplierChangeRequests(supplierId) {
    const requests = changeRequestRepo.findBySupplierId(supplierId);
    return requests.map(r => this.enrichChangeRequest(r));
  }

  getBookingChangeRequests(bookingNumber) {
    const booking = bookingRepo.findByBookingNumber(bookingNumber);
    if (!booking) return [];
    const requests = changeRequestRepo.findByBookingId(booking.id);
    return requests.map(r => this.enrichChangeRequest(r));
  }

  reviewChangeRequest(changeRequestId, decision = {}) {
    const changeReq = changeRequestRepo.findById(changeRequestId);
    if (!changeReq) {
      const err = new Error(`Change request with ID "${changeRequestId}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (changeReq.status !== 'pending') {
      const err = new Error(`Change request "${changeRequestId}" has already been ${changeReq.status}.`);
      err.statusCode = 400;
      throw err;
    }

    const booking = bookingRepo.findById(changeReq.bookingId);
    if (!booking) {
      const err = new Error(`Associated booking "${changeReq.bookingId}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    const action = (decision.action || '').toLowerCase();
    const reason = decision.reason || decision.supplierResponse || '';

    // If Supplier Rejects
    if (action === 'reject') {
      const updated = changeRequestRepo.updateDecision(
        changeRequestId,
        'rejected',
        reason || 'Rejected by supplier'
      );
      return {
        success: true,
        message: 'Change request rejected. Original booking preserved.',
        changeRequest: this.enrichChangeRequest(updated),
        booking: bookingRepo.findById(booking.id),
      };
    }

    // If Supplier Accepts
    if (action === 'accept') {
      const targetFlightId = changeReq.newFlightId || booking.flightId;
      const targetFlight = catalogService.getFlightById(targetFlightId);
      if (!targetFlight) {
        const err = new Error(`Target flight "${targetFlightId}" not found in catalog.`);
        err.statusCode = 400;
        throw err;
      }

      const targetPickupAt = changeReq.newPickupAt || booking.pickupAt;

      // 1. Verify R2 against target flight
      try {
        requestValidator.validatePickupTime(targetFlight, targetPickupAt);
      } catch (e) {
        const err = new Error(`R2 Validation Error: ${e.message}`);
        err.statusCode = 400;
        throw err;
      }

      // 2. Check car availability for originally booked car at new time (R9 & R6)
      // Exclude this booking's current time window so it doesn't conflict with itself!
      const avail = availabilityService.isCarAvailable(
        booking.carId,
        targetPickupAt,
        booking.driveMinutes,
        { excludeBookingId: booking.id }
      );

      if (!avail.available) {
        const conflictMsgs = avail.conflicts.map(c => c.message).join(' ');
        const err = new Error(
          `R9 Violation: Vehicle "${booking.carId}" cannot accommodate the new pickup time due to a schedule conflict: ${conflictMsgs}`
        );
        err.statusCode = 409;
        throw err;
      }

      // 3. Atomically update booking and change request
      const updated = changeRequestRepo.acceptChangeTransaction(
        changeRequestId,
        booking.id,
        targetFlightId,
        targetPickupAt,
        reason || 'Accepted by supplier'
      );

      return {
        success: true,
        message: 'Change request accepted. Booking successfully updated.',
        changeRequest: this.enrichChangeRequest(updated),
        booking: bookingRepo.findById(booking.id),
      };
    }

    const err = new Error('Invalid review action. Must be "accept" or "reject".');
    err.statusCode = 400;
    throw err;
  }

  enrichChangeRequest(changeReq) {
    if (!changeReq) return null;
    const newFlight = changeReq.newFlightId ? catalogService.getFlightById(changeReq.newFlightId) : null;
    const currentFlight = changeReq.currentFlightId ? catalogService.getFlightById(changeReq.currentFlightId) : null;

    return {
      ...changeReq,
      newFlight: newFlight ? {
        flight_id: newFlight.flight_id,
        flight_number: newFlight.flight_number,
        airline: newFlight.airline,
        from: newFlight.from,
        to: newFlight.to,
        arrival_local: newFlight.arrival_local,
      } : null,
      currentFlight: currentFlight ? {
        flight_id: currentFlight.flight_id,
        flight_number: currentFlight.flight_number,
        airline: currentFlight.airline,
        from: currentFlight.from,
        to: currentFlight.to,
        arrival_local: currentFlight.arrival_local,
      } : null,
    };
  }
}

module.exports = new ChangeRequestService();
