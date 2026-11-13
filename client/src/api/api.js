import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const catalogApi = {
  getFlights: async (params = {}) => {
    const res = await api.get('/catalog/flights', { params });
    return res.data;
  },
  getHotels: async (params = {}) => {
    const res = await api.get('/catalog/hotels', { params });
    return res.data;
  },
  getAirports: async () => {
    const res = await api.get('/catalog/airports');
    return res.data;
  },
  getSuppliers: async () => {
    const res = await api.get('/catalog/suppliers');
    return res.data;
  },
};

export const routeApi = {
  getPriceRange: async (flightId, hotelId) => {
    const res = await api.get('/routes/price-range', {
      params: { flightId, hotelId },
    });
    return res.data;
  },
  getRouteDetails: async (flightId, hotelId) => {
    const res = await api.get('/routes/details', {
      params: { flightId, hotelId },
    });
    return res.data;
  },
};

export const rideRequestApi = {
  createRideRequest: async (payload) => {
    const res = await api.post('/ride-requests', payload);
    return res.data;
  },
  getRideRequestById: async (id) => {
    const res = await api.get(`/ride-requests/${id}`);
    return res.data;
  },
  getRideRequests: async (params = {}) => {
    const res = await api.get('/ride-requests', { params });
    return res.data;
  },
};

export default api;

