const loader = require('../data/loader');
const { getDatabase } = require('../config/database');

/**
 * Parses local wall-clock ISO string to epoch milliseconds reliably.
 */
function parseLocalTime(dateStr) {
  if (!dateStr) return null;
  const clean = dateStr.trim();
  const iso = clean.endsWith('Z') ? clean : clean + 'Z';
  const timestamp = Date.parse(iso);
  return isNaN(timestamp) ? null : timestamp;
}

/**
 * Checks if two half-open intervals [aStart, aEnd) and [bStart, bEnd) overlap.
 */
function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Calculates the busy interval for a car given pickup time and one-way drive minutes.
 * Busy duration = 2 * drive_minutes (airport to hotel and back).
 */
function getBusyInterval(pickupAt, driveMinutes) {
  const startMs = parseLocalTime(pickupAt);
  if (!startMs) {
    throw new Error(`Invalid pickup timestamp: ${pickupAt}`);
  }

  const durationMs = 2 * Number(driveMinutes) * 60 * 1000;
  const endMs = startMs + durationMs;

  return {
    startMs,
    endMs,
    startIso: new Date(startMs).toISOString().replace('.000Z', '').replace('Z', '').slice(0, 19),
    endIso: new Date(endMs).toISOString().replace('.000Z', '').replace('Z', '').slice(0, 19),
  };
}

/**
 * Finds all conflicting busy intervals for a given car.
 * Checks both booked_rides.json and confirmed bookings in SQLite.
 *
 * @param {string} carId - The vehicle ID (e.g. "SC-2")
 * @param {string} pickupAt - Proposed pickup ISO string
 * @param {number} driveMinutes - Route one-way drive time
 * @param {object} [options] - Optional settings (e.g. { excludeBookingId })
 * @returns {Array} Array of conflict details
 */
function getCarConflicts(carId, pickupAt, driveMinutes, options = {}) {
  const { startMs, endMs, startIso, endIso } = getBusyInterval(pickupAt, driveMinutes);
  const conflicts = [];

  // 1. Check initial booked_rides.json
  const bookedRides = loader.cache.bookedRides || loader.loadBookedRides();
  if (Array.isArray(bookedRides)) {
    for (const ride of bookedRides) {
      if (ride.vehicle_id === carId) {
        const rideStartMs = parseLocalTime(ride.start);
        const rideEndMs = parseLocalTime(ride.end);
        if (rideStartMs && rideEndMs && intervalsOverlap(startMs, endMs, rideStartMs, rideEndMs)) {
          conflicts.push({
            source: 'booked_rides.json',
            rideId: ride.ride_id,
            carId: ride.vehicle_id,
            conflictStart: ride.start,
            conflictEnd: ride.end,
            proposedStart: startIso,
            proposedEnd: endIso,
            message: `Car ${carId} is busy with pre-scheduled ride ${ride.ride_id} (${ride.start} to ${ride.end}).`,
          });
        }
      }
    }
  }

  // 2. Check confirmed bookings in SQLite database
  const db = getDatabase();
  let query = "SELECT * FROM bookings WHERE car_id = ? AND status = 'confirmed'";
  const params = [carId];

  if (options.excludeBookingId) {
    query += ' AND id != ?';
    params.push(options.excludeBookingId);
  }

  const existingBookings = db.prepare(query).all(...params);
  for (const b of existingBookings) {
    const bInterval = getBusyInterval(b.pickup_at, b.drive_minutes);
    if (intervalsOverlap(startMs, endMs, bInterval.startMs, bInterval.endMs)) {
      conflicts.push({
        source: 'database_bookings',
        bookingNumber: b.booking_number,
        bookingId: b.id,
        carId: b.car_id,
        conflictStart: bInterval.startIso,
        conflictEnd: bInterval.endIso,
        proposedStart: startIso,
        proposedEnd: endIso,
        message: `Car ${carId} is already booked under booking #${b.booking_number} (${bInterval.startIso} to ${bInterval.endIso}).`,
      });
    }
  }

  return conflicts;
}

/**
 * Determines whether a car is available for the given request.
 */
function isCarAvailable(carId, pickupAt, driveMinutes, options = {}) {
  const conflicts = getCarConflicts(carId, pickupAt, driveMinutes, options);
  return {
    available: conflicts.length === 0,
    conflicts,
  };
}

module.exports = {
  parseLocalTime,
  intervalsOverlap,
  getBusyInterval,
  getCarConflicts,
  isCarAvailable,
};

