import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import TravelerDashboard from './pages/traveler/TravelerDashboard';
import CreateRidePage from './pages/traveler/CreateRidePage';
import OffersPage from './pages/traveler/OffersPage';
import BookingSummaryPage from './pages/traveler/BookingSummaryPage';
import ChangeBookingPage from './pages/traveler/ChangeBookingPage';
import LiveTrackingPage from './pages/traveler/LiveTrackingPage';

import SupplierDashboard from './pages/supplier/SupplierDashboard';
import SupplierRequestsPage from './pages/supplier/SupplierRequestsPage';
import CreateOfferPage from './pages/supplier/CreateOfferPage';
import ChangeRequestsPage from './pages/supplier/ChangeRequestsPage';

export default function App() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          {/* Traveler Flow */}
          <Route path="/traveler" element={<TravelerDashboard />} />
          <Route path="/traveler/create" element={<CreateRidePage />} />
          <Route path="/traveler/offers/:requestId" element={<OffersPage />} />
          <Route path="/traveler/booking" element={<BookingSummaryPage />} />
          <Route path="/traveler/booking/:bookingNumber" element={<BookingSummaryPage />} />
          <Route path="/traveler/booking/:bookingNumber/change" element={<ChangeBookingPage />} />
          <Route path="/traveler/track/:bookingNumber" element={<LiveTrackingPage />} />

          {/* Supplier Flow */}
          <Route path="/supplier" element={<SupplierDashboard />} />
          <Route path="/supplier/requests" element={<SupplierRequestsPage />} />
          <Route path="/supplier/offer/:requestId" element={<CreateOfferPage />} />
          <Route path="/supplier/changes" element={<ChangeRequestsPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <div className="footer-content">
          <p>Airport Taxi → Ride Offers Platform • End-to-End Traveler & Supplier System</p>
          <p className="footer-sub">Rules R1 through R9 enforced. Powered by Node.js, Express, SQLite & React.</p>
        </div>
      </footer>
    </div>
  );
}
