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
  getTravelers: async () => {
    const res = await api.get('/ride-requests/meta/travelers');
    return res.data;
  },
  updateRideRequest: async (id, payload) => {
    const res = await api.patch(`/ride-requests/${id}`, payload);
    return res.data;
  },
  reportFlightDelay: async (id, payload) => {
    const res = await api.post(`/ride-requests/${id}/delay`, payload);
    return res.data;
  },
};

export const supplierApi = {
  getSupplierRequests: async (supplierId) => {
    const res = await api.get(`/suppliers/${supplierId}/requests`);
    return res.data;
  },
};

export const offerApi = {
  createOffer: async (requestId, payload) => {
    const res = await api.post(`/offers/requests/${requestId}`, payload);
    return res.data;
  },
  getOffers: async (requestId) => {
    const res = await api.get(`/offers/requests/${requestId}`);
    return res.data;
  },
  rejectOffer: async (offerId) => {
    const res = await api.post(`/offers/${offerId}/reject`);
    return res.data;
  },
};

export const bookingApi = {
  bookOffer: async (offerId) => {
    const res = await api.post(`/bookings/offers/${offerId}`);
    return res.data;
  },
  getBooking: async (bookingNumber) => {
    const res = await api.get(`/bookings/${bookingNumber}`);
    return res.data;
  },
  cancelBooking: async (bookingNumber) => {
    const res = await api.post(`/bookings/${bookingNumber}/cancel`);
    return res.data;
  },
};

export const changeRequestApi = {
  createChangeRequest: async (bookingNumber, payload) => {
    const res = await api.post(`/change-requests/${bookingNumber}`, payload);
    return res.data;
  },
  getSupplierChangeRequests: async (supplierId) => {
    const res = await api.get(`/change-requests/supplier/${supplierId}`);
    return res.data;
  },
  getBookingChangeRequests: async (bookingNumber) => {
    const res = await api.get(`/change-requests/booking/${bookingNumber}`);
    return res.data;
  },
  getRequestChangeRequests: async (requestId) => {
    const res = await api.get(`/change-requests/request/${requestId}`);
    return res.data;
  },
  reviewChangeRequest: async (changeRequestId, payload) => {
    const res = await api.patch(`/change-requests/${changeRequestId}`, payload);
    return res.data;
  },
};

export default api;
