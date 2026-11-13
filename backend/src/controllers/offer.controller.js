const offerService = require('../services/offer.service');

class OfferController {
  createOffer(req, res, next) {
    try {
      const { requestId } = req.params;
      const { supplierId, carId, price } = req.body;

      if (!supplierId || !carId || price === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required offer fields: supplierId, carId, and price are required.',
        });
      }

      const offer = offerService.assignCarAndPrice(requestId, supplierId, carId, price);
      res.status(201).json({
        success: true,
        message: 'Offer submitted successfully',
        data: offer,
      });
    } catch (err) {
      res.status(err.statusCode || 400).json({
        success: false,
        error: err.message,
      });
    }
  }

  getOffers(req, res, next) {
    try {
      const { requestId } = req.params;
      const offers = offerService.listOffersForRequest(requestId);
      res.json({
        success: true,
        count: offers.length,
        data: offers,
      });
    } catch (err) {
      next(err);
    }
  }

  rejectOffer(req, res, next) {
    try {
      const { offerId } = req.params;
      const rejected = offerService.rejectOffer(offerId);
      res.json({
        success: true,
        message: 'Offer rejected successfully',
        data: rejected,
      });
    } catch (err) {
      res.status(err.statusCode || 400).json({
        success: false,
        error: err.message,
      });
    }
  }
}

module.exports = new OfferController();

