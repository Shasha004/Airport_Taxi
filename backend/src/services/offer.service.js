const offerRepo = require('../repositories/offer.repository');
const rideRequestRepo = require('../repositories/rideRequest.repository');
const catalogService = require('./catalog.service');
const offerValidator = require('../validators/offer.validator');
const offerExpiryService = require('./offerExpiry.service');

class OfferService {
  assignCarAndPrice(requestId, supplierId, carId, price, expiryMinutes = 15, now = new Date()) {
    const validExpiryMinutes = offerValidator.validateExpiryDuration(expiryMinutes);
    offerExpiryService.expireOffers(now);

    const request = rideRequestRepo.findById(requestId);
    if (!request) {
      const err = new Error(`Ride request with ID "${requestId}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    // Run complete R4, R5, R6, R7 validations
    const validated = offerValidator.validateOffer(request, supplierId, carId, price);
    const expiresAt = offerExpiryService.calculateExpiryTime(validExpiryMinutes, now);

    // Idempotency check: if this supplier already has an assigned offer for this request+car, return existing
    // (prevents duplicate offers when supplier clicks submit multiple times)
    const existingOffer = offerRepo.findAssignedByRequestAndSupplierAndCar(requestId, supplierId, carId);
    if (existingOffer) {
      if (Number(existingOffer.offerPrice) !== Number(validated.price)) {
        const updated = offerRepo.updateCarAndPrice(existingOffer.id, carId, validated.price);
        return this.enrichOffer(updated);
      }
      return this.enrichOffer(existingOffer);
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const offerId = `OFFER-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const newOffer = {
      id: offerId,
      requestId,
      supplierId,
      carId,
      offerPrice: validated.price,
      status: 'assigned',
      expiresAt,
      expiryMinutes: validExpiryMinutes,
    };

    const saved = offerRepo.create(newOffer);
    return this.enrichOffer(saved);
  }

  getOfferById(offerId) {
    offerExpiryService.expireOffers();
    const offer = offerRepo.findById(offerId);
    if (!offer) return null;
    return this.enrichOffer(offer);
  }

  listOffersForRequest(requestId) {
    offerExpiryService.expireOffers();
    const offers = offerRepo.findByRequestId(requestId);
    // Deduplicate any identical offers from multiple rapid clicks
    const seen = new Set();
    const unique = [];
    for (const o of offers) {
      const key = `${o.requestId}_${o.supplierId}_${o.carId}_${o.status}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(o);
      }
    }
    return unique.map(o => this.enrichOffer(o));
  }

  listOffersForSupplier(supplierId) {
    offerExpiryService.expireOffers();
    const offers = offerRepo.findBySupplierId(supplierId);
    return offers.map(o => this.enrichOffer(o));
  }

  rejectOffer(offerId) {
    offerExpiryService.expireOffers();
    const offer = offerRepo.findById(offerId);
    if (!offer) {
      const err = new Error(`Offer with ID "${offerId}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    if (offer.status !== 'assigned') {
      const err = new Error(`Cannot reject offer with status "${offer.status}". Only assigned offers can be rejected.`);
      err.statusCode = 400;
      throw err;
    }

    const updated = offerRepo.updateStatus(offerId, 'rejected');
    return this.enrichOffer(updated);
  }

  enrichOffer(offer) {
    if (!offer) return null;
    const supplier = catalogService.getSupplierById(offer.supplierId);
    let car = null;
    if (supplier && Array.isArray(supplier.vehicles)) {
      car = supplier.vehicles.find(v => v.vehicle_id === offer.carId);
    }

    return {
      ...offer,
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

module.exports = new OfferService();

