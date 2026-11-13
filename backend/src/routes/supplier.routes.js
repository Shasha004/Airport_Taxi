const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');

router.get('/:supplierId/requests', supplierController.getSupplierRequests);

module.exports = router;
