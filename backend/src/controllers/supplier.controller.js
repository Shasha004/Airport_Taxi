const supplierEligibilityService = require('../services/supplierEligibility.service');
const catalogService = require('../services/catalog.service');
const offerRepo = require('../repositories/offer.repository');
const changeRequestRepo = require('../repositories/changeRequest.repository');
const bookingRepo = require('../repositories/booking.repository');

class SupplierController {
  getSupplierRequests(req, res, next) {
    try {
      const { supplierId } = req.params;
      const supplier = catalogService.getSupplierById(supplierId);
      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: `Supplier with ID "${supplierId}" not found.`,
        });
      }

      const eligibleRequests = supplierEligibilityService.getSupplierEligibleRequests(supplierId);
      const submittedOffersCount = offerRepo.countBySupplier(supplierId);
      const changeRequests = changeRequestRepo.findBySupplierId(supplierId);
      const pendingChangeRequestsCount = changeRequests.filter(c => c.status === 'pending').length;
      const supplierBookings = bookingRepo.findBySupplierId(supplierId);
      const confirmedBookings = supplierBookings.filter(b => b.status === 'confirmed');

      // Enrich bookings with flight and hotel metadata for display
      const enrichedBookings = confirmedBookings.map(b => {
        const flight = catalogService.getFlightById(b.flightId);
        const hotel = catalogService.getHotelById(b.hotelId);
        return {
          ...b,
          flight,
          hotel,
        };
      });

      res.json({
        success: true,
        supplier: {
          company_id: supplier.company_id,
          name: supplier.name,
          airports: supplier.airports,
          areas: supplier.areas,
          service_from: supplier.service_from,
          service_until: supplier.service_until,
          rating: supplier.rating,
          vehicles: supplier.vehicles,
        },
        stats: {
          eligibleRequestsCount: eligibleRequests.length,
          submittedOffersCount,
          pendingChangeRequestsCount,
          confirmedBookingsCount: confirmedBookings.length,
        },
        bookings: enrichedBookings,
        count: eligibleRequests.length,
        data: eligibleRequests,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SupplierController();

