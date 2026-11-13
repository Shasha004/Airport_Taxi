const express = require('express');
const router = express.Router();
const changeRequestController = require('../controllers/changeRequest.controller');

router.post('/:bookingNumber', changeRequestController.createChangeRequest);
router.get('/supplier/:supplierId', changeRequestController.getSupplierChangeRequests);
router.patch('/:changeRequestId', changeRequestController.reviewChangeRequest);

module.exports = router;
