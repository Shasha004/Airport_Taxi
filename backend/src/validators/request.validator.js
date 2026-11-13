const catalogService = require('../services/catalog.service');
const routePricingService = require('../services/routePricing.service');

function parseLocalTime(dateStr) {
  if (!dateStr) return null;
  // If string contains seconds or not, append Z to parse as UTC point in time
  const cleanStr = dateStr.trim();
  const iso = cleanStr.endsWith('Z') ? cleanStr : cleanStr + 'Z';
  const timestamp = Date.parse(iso);
  return isNaN(timestamp) ? null : timestamp;
}

function addMinutesToLocalTime(dateStr, minutes) {
  const time = parseLocalTime(dateStr);
  if (!time) return null;
  const newDate = new Date(time + minutes * 60 * 1000);
  return newDate.toISOString().replace('.000Z', '').replace('Z', '').slice(0, 19);
}

class RequestValidator {
  validateFlight(flightId) {
    if (!flightId) {
      throw new Error('Flight ID is required (R1)');
    }
    const flight = catalogService.getFlightById(flightId);
    if (!flight) {
      throw new Error(`Flight with ID "${flightId}" does not exist in the catalog (R1)`);
    }
    return flight;
  }

  validateHotel(hotelId) {
    if (!hotelId) {
      throw new Error('Hotel ID is required (R1)');
    }
    const hotel = catalogService.getHotelById(hotelId);
    if (!hotel) {
      throw new Error(`Hotel with ID "${hotelId}" does not exist in the catalog (R1)`);
    }
    return hotel;
  }

  validateAirportHotelCompatibility(flight, hotel) {
    const airport = catalogService.getAirportByCode(flight.to);
    if (!airport) {
      throw new Error(`Arrival airport "${flight.to}" for flight "${flight.flight_id}" not found in catalog (R1)`);
    }
    const servesCities = airport.serves_cities || [];
    if (!servesCities.includes(hotel.city)) {
      throw new Error(
        `R1 Validation Error: Arrival airport ${airport.code} (${airport.city}) does not serve hotel city "${hotel.city}". Serves: [${servesCities.join(', ')}]`
      );
    }
    return airport;
  }

  validateAdults(adults) {
    const numAdults = Number(adults);
    if (!Number.isInteger(numAdults) || numAdults < 1) {
      throw new Error('R1 Validation Error: At least one adult passenger is required (adults >= 1)');
    }
    return numAdults;
  }

  validateChildren(childAges) {
    if (childAges === undefined || childAges === null || childAges === '') {
      return [];
    }

    let ages = childAges;
    if (typeof childAges === 'string') {
      try {
        ages = JSON.parse(childAges);
      } catch (e) {
        throw new Error('R1 Validation Error: Child ages must be a valid array of numbers');
      }
    }

    if (!Array.isArray(ages)) {
      throw new Error('R1 Validation Error: Child ages must be provided as an array');
    }

    for (let i = 0; i < ages.length; i++) {
      const age = Number(ages[i]);
      if (!Number.isInteger(age) || age < 0 || age > 17) {
        throw new Error(`R1 Validation Error: Invalid child age ${ages[i]}. Children must be aged 0 to 17`);
      }
    }

    return ages.map(Number);
  }

  validatePickupTime(flight, pickupTime) {
    const arrivalLocal = flight.arrival_local;
    if (!arrivalLocal) {
      throw new Error(`Flight ${flight.flight_id} has no arrival_local time`);
    }

    const arrivalTimestamp = parseLocalTime(arrivalLocal);
    if (!arrivalTimestamp) {
      throw new Error(`Invalid flight arrival_local format: ${arrivalLocal}`);
    }

    // If traveler does not provide a pickup time, use landing time + 60 minutes as default (R2)
    if (!pickupTime || (typeof pickupTime === 'string' && pickupTime.trim() === '')) {
      const defaultPickup = addMinutesToLocalTime(arrivalLocal, 60);
      return {
        pickupTime: defaultPickup,
        isDefault: true,
      };
    }

    const pickupTimestamp = parseLocalTime(pickupTime);
    if (!pickupTimestamp) {
      throw new Error(`R2 Validation Error: Invalid pickup time format "${pickupTime}"`);
    }

    const diffMinutes = (pickupTimestamp - arrivalTimestamp) / (60 * 1000);
    const earliestPickup = addMinutesToLocalTime(arrivalLocal, 60);

    if (diffMinutes < 60) {
      throw new Error(
        `R2 Validation Error: Pickup must be at least 60 minutes after flight landing time. Flight lands at ${arrivalLocal}, earliest allowed pickup is ${earliestPickup}. Provided pickup: ${pickupTime}`
      );
    }

    return {
      pickupTime: pickupTime.trim(),
      isDefault: false,
    };
  }

  validateTravelerPrice(price, minPrice, maxPrice) {
    const numPrice = Number(price);
    if (isNaN(numPrice) || price === '' || price === null || price === undefined) {
      throw new Error('R3 Validation Error: Traveler proposed price is required and must be a number');
    }

    if (numPrice < minPrice || numPrice > maxPrice) {
      throw new Error(
        `R3 Validation Error: Proposed price ₹${numPrice.toLocaleString()} is outside the allowed route range of ₹${minPrice.toLocaleString()} – ₹${maxPrice.toLocaleString()}`
      );
    }

    return numPrice;
  }

  validateRideRequest(payload) {
    const errors = [];
    let flight = null;
    let hotel = null;
    let airport = null;
    let adults = 1;
    let childAges = [];
    let pickupResult = null;
    let validatedPrice = null;
    let routeInfo = null;

    // 1. Flight
    try {
      flight = this.validateFlight(payload.flightId || payload.flight_id);
    } catch (err) {
      errors.push(err.message);
    }

    // 2. Hotel
    try {
      hotel = this.validateHotel(payload.hotelId || payload.hotel_id);
    } catch (err) {
      errors.push(err.message);
    }

    // 3. Compatibility (R1)
    if (flight && hotel) {
      try {
        airport = this.validateAirportHotelCompatibility(flight, hotel);
      } catch (err) {
        errors.push(err.message);
      }
    }

    // 4. Passengers (R1)
    try {
      adults = this.validateAdults(payload.adults);
    } catch (err) {
      errors.push(err.message);
    }

    try {
      childAges = this.validateChildren(payload.childAges ?? payload.child_ages);
    } catch (err) {
      errors.push(err.message);
    }

    // 5. Pickup time (R2)
    if (flight) {
      try {
        pickupResult = this.validatePickupTime(
          flight,
          payload.pickupTime || payload.pickup_at || payload.pickup
        );
      } catch (err) {
        errors.push(err.message);
      }
    }

    // 6 & 7. Route and Price range (R3)
    if (flight && hotel && airport) {
      try {
        routeInfo = routePricingService.getRoute(flight.flight_id, hotel.hotel_id);
        const proposedPrice = payload.travelerPrice ?? payload.traveler_price ?? payload.price_inr;
        validatedPrice = this.validateTravelerPrice(
          proposedPrice,
          routeInfo.price_min_inr,
          routeInfo.price_max_inr
        );
      } catch (err) {
        errors.push(err.message);
      }
    }

    // Bags
    const largeBags = Number(payload.largeBags ?? payload.large_bags ?? 0);
    const smallBags = Number(payload.smallBags ?? payload.small_bags ?? 0);
    if (!Number.isInteger(largeBags) || largeBags < 0) {
      errors.push('Large bags must be a non-negative integer');
    }
    if (!Number.isInteger(smallBags) || smallBags < 0) {
      errors.push('Small bags must be a non-negative integer');
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
      };
    }

    return {
      isValid: true,
      data: {
        flightId: flight.flight_id,
        hotelId: hotel.hotel_id,
        travelerName: payload.travelerName || payload.traveler_name || 'Traveler',
        adults,
        childAges,
        largeBags,
        smallBags,
        pickupTime: pickupResult.pickupTime,
        travelerPrice: validatedPrice,
        carType: payload.carType || payload.car_type || null,
        routeInfo,
      }
    };
  }
}

module.exports = new RequestValidator();

