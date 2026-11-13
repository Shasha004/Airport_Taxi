const offerRepo = require('../repositories/offer.repository');

function calculateExpiryTime(expiryMinutes, now = Date.now()) {
  if (!Number.isInteger(expiryMinutes) || expiryMinutes <= 0) {
    throw new Error('Expiry duration must be a positive whole number of minutes.');
  }

  const baseTime = now instanceof Date ? now.getTime() : Number(now);
  if (!Number.isFinite(baseTime)) {
    throw new Error('Expiry start time is invalid.');
  }

  return new Date(baseTime + expiryMinutes * 60 * 1000).toISOString();
}

function expireOffers(now = new Date()) {
  const timestamp = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  return offerRepo.expireAssignedOffers(timestamp);
}

module.exports = {
  calculateExpiryTime,
  expireOffers,
};
