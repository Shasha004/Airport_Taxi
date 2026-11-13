const express = require('express');
const router = express.Router();
const routeController = require('../controllers/route.controller');

router.get('/price-range', routeController.getPriceRange);
router.get('/', routeController.getRouteDetails);
router.get('/details', routeController.getRouteDetails);

module.exports = router;

