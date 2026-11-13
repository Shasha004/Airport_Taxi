const { expireOffers } = require('./offerExpiry.service');

function startOfferExpiryWorker() {
  try {
    expireOffers();
  } catch (error) {
    console.error('[Offer Expiry] Initial expiration check failed:', error);
  }

  const intervalId = setInterval(() => {
    try {
      const expiredCount = expireOffers();
      if (expiredCount > 0) {
        console.log(`[Offer Expiry] ${expiredCount} offer(s) expired.`);
      }
    } catch (error) {
      console.error('[Offer Expiry] Worker check failed:', error);
    }
  }, 5000);

  return intervalId;
}

module.exports = {
  startOfferExpiryWorker,
};
