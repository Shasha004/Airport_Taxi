import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import TravelerDashboard from './pages/traveler/TravelerDashboard';
import CreateRidePage from './pages/traveler/CreateRidePage';

export default function App() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/traveler" element={<TravelerDashboard />} />
          <Route path="/traveler/create" element={<CreateRidePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <div className="footer-content">
          <p>Airport Taxi → Ride Offers Platform • Part 1: Traveler Module & Foundation</p>
          <p className="footer-sub">Rules R1, R2, R3 enforced. Powered by Node.js, Express, SQLite & React.</p>
        </div>
      </footer>
    </div>
  );
}
