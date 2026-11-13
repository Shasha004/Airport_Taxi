const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');

router.post('/offers/:offerId', bookingController.bookOffer);
router.get('/:bookingNumber', bookingController.getBooking);

module.exports = router;

