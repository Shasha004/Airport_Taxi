const catalogService = require('../services/catalog.service');

class CatalogController {
  getFlights(req, res, next) {
    try {
      const flights = catalogService.getFlights(req.query);
      res.json({
        success: true,
        count: flights.length,
        data: flights
      });
    } catch (err) {
      next(err);
    }
  }

  getHotels(req, res, next) {
    try {
      const hotels = catalogService.getHotels(req.query);
      res.json({
        success: true,
        count: hotels.length,
        data: hotels
      });
    } catch (err) {
      next(err);
    }
  }

  getAirports(req, res, next) {
    try {
      const airports = catalogService.getAirports();
      res.json({
        success: true,
        count: airports.length,
        data: airports
      });
    } catch (err) {
      next(err);
    }
  }

  getSuppliers(req, res, next) {
    try {
      const suppliers = catalogService.getSuppliers();
      res.json({
        success: true,
        count: suppliers.length,
        data: suppliers
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CatalogController();

