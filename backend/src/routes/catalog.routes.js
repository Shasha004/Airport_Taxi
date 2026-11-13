const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalog.controller');

router.get('/flights', catalogController.getFlights);
router.get('/hotels', catalogController.getHotels);
router.get('/airports', catalogController.getAirports);
router.get('/suppliers', catalogController.getSuppliers);

module.exports = router;

