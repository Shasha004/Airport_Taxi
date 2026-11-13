const loader = require('../data/loader');

const VALID_ARRIVAL_AIRPORTS = ['NRT', 'HND', 'KIX', 'DXB', 'AUH'];

class CatalogService {
  getFlights(query = {}) {
    let flights = loader.cache.flights || loader.loadFlights();

    // Default to arrival flights unless ?all=true is explicitly requested
    if (query.all !== 'true') {
      flights = flights.filter(f => VALID_ARRIVAL_AIRPORTS.includes(f.to));
    }

    if (query.to) {
      flights = flights.filter(f => f.to.toUpperCase() === query.to.toUpperCase());
    }

    if (query.from) {
      flights = flights.filter(f => f.from.toUpperCase() === query.from.toUpperCase());
    }

    if (query.date) {
      flights = flights.filter(f => f.arrival_local && f.arrival_local.startsWith(query.date));
    }

    return flights;
  }

  getFlightById(flightId) {
    const flights = loader.cache.flights || loader.loadFlights();
    return flights.find(f => f.flight_id === flightId) || null;
  }

  getHotels(query = {}) {
    let hotels = loader.cache.hotels || loader.loadHotels();

    if (query.city) {
      hotels = hotels.filter(h => h.city.toLowerCase() === query.city.toLowerCase());
    }

    if (query.area) {
      hotels = hotels.filter(h => h.area.toLowerCase() === query.area.toLowerCase());
    }

    return hotels;
  }

  getHotelById(hotelId) {
    const hotels = loader.cache.hotels || loader.loadHotels();
    return hotels.find(h => h.hotel_id === hotelId) || null;
  }

  getAirports() {
    return loader.cache.airports || loader.loadAirports();
  }

  getAirportByCode(code) {
    const airports = this.getAirports();
    return airports.find(a => a.code.toUpperCase() === code.toUpperCase()) || null;
  }

  getSuppliers() {
    return loader.cache.taxiCompanies || loader.loadTaxiCompanies();
  }

  getSupplierById(companyId) {
    const suppliers = this.getSuppliers();
    return suppliers.find(s => s.company_id === companyId) || null;
  }
}

module.exports = new CatalogService();

