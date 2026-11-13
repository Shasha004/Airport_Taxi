const rideRequestService = require('../services/rideRequest.service');

class RideRequestController {
  createRideRequest(req, res, next) {
    try {
      const created = rideRequestService.createRideRequest(req.body);
      res.status(201).json({
        success: true,
        message: 'Ride request created successfully',
        data: created
      });
    } catch (err) {
      res.status(err.statusCode || 400).json({
        success: false,
        error: err.message,
        errors: err.errors || [err.message]
      });
    }
  }

  getRideRequestById(req, res, next) {
    try {
      const { id } = req.params;
      const request = rideRequestService.getRideRequestById(id);
      if (!request) {
        return res.status(404).json({
          success: false,
          error: `Ride request with ID "${id}" not found`
        });
      }
      res.json({
        success: true,
        data: request
      });
    } catch (err) {
      next(err);
    }
  }

  getRideRequests(req, res, next) {
    try {
      const { status, travelerName } = req.query;
      const requests = rideRequestService.listRideRequests({ status, travelerName });
      res.json({
        success: true,
        count: requests.length,
        data: requests
      });
    } catch (err) {
      next(err);
    }
  }

  updateRideRequest(req, res, next) {
    try {
      const { id } = req.params;
      const result = rideRequestService.updateRideRequest(id, req.body);
      res.json({
        success: true,
        message: 'Ride request updated successfully',
        data: result
      });
    } catch (err) {
      res.status(err.statusCode || 400).json({
        success: false,
        error: err.message
      });
    }
  }

  reportFlightDelay(req, res, next) {
    try {
      const { id } = req.params;
      const result = rideRequestService.reportFlightDelay(id, req.body);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 400).json({
        success: false,
        error: err.message
      });
    }
  }
}

module.exports = new RideRequestController();

