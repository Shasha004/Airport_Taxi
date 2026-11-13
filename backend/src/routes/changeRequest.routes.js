const express = require('express');
const router = express.Router();
const changeRequestController = require('../controllers/changeRequest.controller');

router.post('/:bookingNumber', changeRequestController.createChangeRequest);
router.get('/supplier/:supplierId', changeRequestController.getSupplierChangeRequests);
router.get('/booking/:bookingNumber', changeRequestController.getBookingChangeRequests);
router.get('/request/:requestId', changeRequestController.getRequestChangeRequests);
router.patch('/:changeRequestId', changeRequestController.reviewChangeRequest);

module.exports = router;

