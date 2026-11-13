const loader = require('../data/loader');
const catalogService = require('./catalog.service');

class RoutePricingService {
  getRoute(flightId, hotelId) {
    if (!flightId) {
      throw new Error('Flight ID is required to determine the route');
    }
    if (!hotelId) {
      throw new Error('Hotel ID is required to determine the route');
    }

    const flight = catalogService.getFlightById(flightId);
    if (!flight) {
      throw new Error(`Flight ${flightId} not found in catalog`);
    }

    const hotel = catalogService.getHotelById(hotelId);
    if (!hotel) {
      throw new Error(`Hotel ${hotelId} not found in catalog`);
    }

    const airport = catalogService.getAirportByCode(flight.to);
    if (!airport) {
      throw new Error(`Arrival airport ${flight.to} not found in catalog`);
    }

    // Verify airport serves hotel's city (R1)
    const servesCities = airport.serves_cities || [];
    if (!servesCities.includes(hotel.city)) {
      throw new Error(
        `Airport ${airport.code} (${airport.city}) does not serve hotel city ${hotel.city}. Serves: [${servesCities.join(', ')}]`
      );
    }

    const routes = loader.cache.routes || loader.loadRoutes();
    const route = routes.find(
      r => r.airport.toUpperCase() === flight.to.toUpperCase() &&
           r.city.toLowerCase() === hotel.city.toLowerCase() &&
           r.area.toLowerCase() === hotel.area.toLowerCase()
    );

    if (!route) {
      throw new Error(
        `No route found from airport ${flight.to} to ${hotel.city} (${hotel.area})`
      );
    }

    return {
      ...route,
      flight,
      hotel,
      airportCode: flight.to,
      hotelCity: hotel.city,
      hotelArea: hotel.area,
    };
  }

  getSuggestedPriceRange(flightId, hotelId) {
    const route = this.getRoute(flightId, hotelId);
    return {
      minPrice: route.price_min_inr,
      maxPrice: route.price_max_inr,
      price_min_inr: route.price_min_inr,
      price_max_inr: route.price_max_inr,
      currency: 'INR',
      route: {
        airport: route.airport,
        city: route.city,
        area: route.area,
        distance_km: route.distance_km,
        drive_minutes: route.drive_minutes,
      }
    };
  }

  validatePrice(price, minPrice, maxPrice) {
    const numPrice = Number(price);
    if (isNaN(numPrice)) {
      return {
        isValid: false,
        message: 'Price must be a valid number'
      };
    }

    if (numPrice < minPrice || numPrice > maxPrice) {
      return {
        isValid: false,
        message: `Proposed price ₹${numPrice.toLocaleString()} is outside the allowed range of ₹${minPrice.toLocaleString()} – ₹${maxPrice.toLocaleString()} for this route`
      };
    }

    return {
      isValid: true,
      price: numPrice
    };
  }

  getDriveMinutes(flightId, hotelId) {
    const route = this.getRoute(flightId, hotelId);
    return route.drive_minutes;
  }
}

module.exports = new RoutePricingService();

