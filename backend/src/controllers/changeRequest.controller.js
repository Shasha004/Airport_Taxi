const changeRequestService = require('../services/changeRequest.service');

class ChangeRequestController {
  createChangeRequest(req, res, next) {
    try {
      const { bookingNumber } = req.params;
      const created = changeRequestService.createChangeRequest(bookingNumber, req.body);
      res.status(201).json({
        success: true,
        message: 'Change request submitted successfully',
        data: created,
      });
    } catch (err) {
      res.status(err.statusCode || 400).json({
        success: false,
        error: err.message,
      });
    }
  }

  getSupplierChangeRequests(req, res, next) {
    try {
      const { supplierId } = req.params;
      const requests = changeRequestService.getSupplierChangeRequests(supplierId);
      res.json({
        success: true,
        count: requests.length,
        data: requests,
      });
    } catch (err) {
      next(err);
    }
  }

  getBookingChangeRequests(req, res, next) {
    try {
      const { bookingNumber } = req.params;
      const requests = changeRequestService.getBookingChangeRequests(bookingNumber);
      res.json({
        success: true,
        count: requests.length,
        data: requests,
      });
    } catch (err) {
      next(err);
    }
  }

  getRequestChangeRequests(req, res, next) {
    try {
      const { requestId } = req.params;
      const requests = changeRequestService.getRequestChangeRequests(requestId);
      res.json({
        success: true,
        count: requests.length,
        data: requests,
      });
    } catch (err) {
      next(err);
    }
  }

  reviewChangeRequest(req, res, next) {
    try {
      const { changeRequestId } = req.params;
      const result = changeRequestService.reviewChangeRequest(changeRequestId, req.body);
      res.json(result);
    } catch (err) {
      res.status(err.statusCode || 400).json({
        success: false,
        error: err.message,
      });
    }
  }
}

module.exports = new ChangeRequestController();

