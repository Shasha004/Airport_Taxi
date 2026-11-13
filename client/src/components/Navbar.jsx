import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car, Plane, Home, PlusCircle, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="logo-icon-wrap">
            <Car className="brand-car-icon" size={22} />
            <Plane className="brand-plane-icon" size={16} />
          </div>
          <div className="brand-text">
            <span className="brand-title">Airport Taxi</span>
            <span className="brand-subtitle">Ride Offers</span>
          </div>
        </Link>

        <nav className="nav-links">
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            <Home size={16} />
            <span>Select Role</span>
          </Link>
          <Link
            to="/traveler"
            className={`nav-link ${isActive('/traveler') ? 'active' : ''}`}
          >
            <LayoutDashboard size={16} />
            <span>Traveler Dashboard</span>
          </Link>
          <Link
            to="/traveler/create"
            className={`nav-btn ${isActive('/traveler/create') ? 'active' : ''}`}
          >
            <PlusCircle size={16} />
            <span>Post Ride Request</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

