import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car, Plane, Home, PlusCircle, LayoutDashboard, Building2, Ticket } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const isSupplierActive = location.pathname.startsWith('/supplier');
  const isTravelerActive = location.pathname.startsWith('/traveler') && location.pathname !== '/traveler/create';

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
            className={`nav-link ${isTravelerActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={16} />
            <span>Traveler</span>
          </Link>
          <Link
            to="/supplier"
            className={`nav-link ${isSupplierActive ? 'active' : ''}`}
          >
            <Building2 size={16} />
            <span>Supplier Portal</span>
          </Link>
          <Link
            to="/traveler/booking"
            className={`nav-link ${isActive('/traveler/booking') ? 'active' : ''}`}
          >
            <Ticket size={16} />
            <span>Lookup Booking</span>
          </Link>
          <Link
            to="/traveler/create"
            className={`nav-btn ${isActive('/traveler/create') ? 'active' : ''}`}
          >
            <PlusCircle size={16} />
            <span>Post Request</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
