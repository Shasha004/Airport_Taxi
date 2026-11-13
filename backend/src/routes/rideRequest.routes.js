const express = require('express');
const router = express.Router();
const rideRequestController = require('../controllers/rideRequest.controller');

router.post('/', rideRequestController.createRideRequest);
router.get('/meta/travelers', rideRequestController.getTravelers);
router.get('/:id', rideRequestController.getRideRequestById);
router.get('/', rideRequestController.getRideRequests);

module.exports = router;

