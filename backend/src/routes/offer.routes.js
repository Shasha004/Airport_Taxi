const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offer.controller');

router.post('/requests/:requestId', offerController.createOffer);
router.get('/requests/:requestId', offerController.getOffers);
router.post('/:offerId/reject', offerController.rejectOffer);

module.exports = router;
