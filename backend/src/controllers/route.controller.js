const routePricingService = require('../services/routePricing.service');

class RouteController {
  getPriceRange(req, res, next) {
    try {
      const flightId = req.query.flightId || req.params.flightId;
      const hotelId = req.query.hotelId || req.params.hotelId;

      if (!flightId || !hotelId) {
        return res.status(400).json({
          success: false,
          error: 'Both flightId and hotelId query parameters are required'
        });
      }

      const priceRange = routePricingService.getSuggestedPriceRange(flightId, hotelId);
      res.json({
        success: true,
        data: priceRange
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  }

  getRouteDetails(req, res, next) {
    try {
      const flightId = req.query.flightId || req.params.flightId;
      const hotelId = req.query.hotelId || req.params.hotelId;

      if (!flightId || !hotelId) {
        return res.status(400).json({
          success: false,
          error: 'Both flightId and hotelId query parameters are required'
        });
      }

      const route = routePricingService.getRoute(flightId, hotelId);
      res.json({
        success: true,
        data: route
      });
    } catch (err) {
      res.status(400).json({
        success: false,
        error: err.message
      });
    }
  }
}

module.exports = new RouteController();

