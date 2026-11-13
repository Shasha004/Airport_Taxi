const crypto = require('crypto');
const bookingRepo = require('../repositories/booking.repository');
const offerRepo = require('../repositories/offer.repository');
const rideRequestRepo = require('../repositories/rideRequest.repository');
const catalogService = require('./catalog.service');
const routePricingService = require('./routePricing.service');
const availabilityService = require('./availability.service');

class BookingService {
  generateUniqueBookingNumber() {
    let attempts = 0;
    while (attempts < 10) {
      const num = crypto.randomInt(1000000000, 10000000000).toString();
      const existing = bookingRepo.findByBookingNumber(num);
      if (!existing) {
        return num;
      }
      attempts++;
    }
    // Fallback if needed
    return `${Date.now()}`.slice(-10);
  }

  bookOffer(offerId) {
    const offer = offerRepo.findById(offerId);
    if (!offer) {
      const err = new Error(`Offer with ID "${offerId}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (offer.status === 'rejected') {
      const err = new Error('R8 Violation: Cannot book an offer that has already been rejected.');
      err.statusCode = 400;
      throw err;
    }

    if (offer.status !== 'assigned') {
      const err = new Error(`R8 Violation: Cannot book an offer with status "${offer.status}". Only assigned offers can be booked.`);
      err.statusCode = 400;
      throw err;
    }

    const request = rideRequestRepo.findById(offer.requestId);
    if (!request) {
      const err = new Error(`Associated ride request "${offer.requestId}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (request.status !== 'open') {
      const err = new Error(`Ride request "${request.id}" is already ${request.status}.`);
      err.statusCode = 400;
      throw err;
    }

    // Determine drive minutes
    let driveMinutes = 60;
    try {
      const route = routePricingService.getRoute(request.flightId, request.hotelId);
      driveMinutes = route.drive_minutes;
    } catch (e) {
      const err = new Error(`Failed to calculate route for booking: ${e.message}`);
      err.statusCode = 400;
      throw err;
    }

    // Recheck car availability at booking confirmation time (M6 & R8)
    const pickupTime = request.pickupTime || request.pickupAt;
    const availabilityCheck = availabilityService.isCarAvailable(offer.carId, pickupTime, driveMinutes);
    if (!availabilityCheck.available) {
      const err = new Error(
        `M6 Violation: Car "${offer.carId}" has become busy due to another conflicting booking. Offer cannot be confirmed.`
      );
      err.statusCode = 409;
      throw err;
    }

    // Generate unique 10-digit booking number (R8)
    const bookingNumber = this.generateUniqueBookingNumber();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingId = `BOOK-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const newBookingRecord = {
      id: bookingId,
      bookingNumber,
      requestId: request.id,
      offerId: offer.id,
      supplierId: offer.supplierId,
      carId: offer.carId,
      flightId: request.flightId,
      hotelId: request.hotelId,
      pickupAt: pickupTime,
      driveMinutes,
      price: offer.offerPrice,
      status: 'confirmed',
    };

    const saved = bookingRepo.saveBookingTransaction(newBookingRecord, offer.id, request.id);
    return this.enrichBooking(saved);
  }

  getBookingByNumber(bookingNumber) {
    const booking = bookingRepo.findByBookingNumber(bookingNumber);
    if (!booking) return null;
    return this.enrichBooking(booking);
  }

  getBookingById(id) {
    const booking = bookingRepo.findById(id);
    if (!booking) return null;
    return this.enrichBooking(booking);
  }

  cancelBooking(bookingNumber) {
    const booking = bookingRepo.findByBookingNumber(bookingNumber);
    if (!booking) {
      const err = new Error(`Booking "${bookingNumber}" not found.`);
      err.statusCode = 404;
      throw err;
    }
    if (booking.status !== 'confirmed') {
      const err = new Error(`Cannot cancel booking with status "${booking.status}". Only confirmed bookings can be cancelled.`);
      err.statusCode = 400;
      throw err;
    }
    const updated = bookingRepo.cancelBookingTransaction(booking.id, booking.offerId, booking.requestId);
    return this.enrichBooking(updated);
  }

  enrichBooking(booking) {
    if (!booking) return null;
    const flight = catalogService.getFlightById(booking.flightId);
    const hotel = catalogService.getHotelById(booking.hotelId);
    const supplier = catalogService.getSupplierById(booking.supplierId);
    let car = null;
    if (supplier && Array.isArray(supplier.vehicles)) {
      car = supplier.vehicles.find(v => v.vehicle_id === booking.carId);
    }
    const busyInterval = availabilityService.getBusyInterval(booking.pickupAt, booking.driveMinutes);

    return {
      ...booking,
      busyInterval: {
        start: busyInterval.startIso,
        end: busyInterval.endIso,
      },
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
      supplier: supplier ? {
        company_id: supplier.company_id,
        name: supplier.name,
        rating: supplier.rating,
      } : null,
      car: car ? {
        vehicle_id: car.vehicle_id,
        type: car.type,
        seats: car.seats,
        large_bags: car.large_bags,
        small_bags: car.small_bags,
      } : null,
    };
  }
}

module.exports = new BookingService();

