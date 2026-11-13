import React from 'react';
import '../css/Navbar.css';

/**
 * Navbar Component strictly matching the Black & White Airport Taxi Design System.
 * Features:
 * - Brand: [AT] Airport Taxi RIDE OFFERS
 * - Center: Role navigation tabs (Select Role, Traveler Dashboard, Cabowner Dashboard)
 * - Right CTA: "Post Ride Request" button
 */
function Navbar({ activeTab = 'traveler', onNavigate }) {
  return (
    <header className="navbar">
      <div className="container navbar__inner">
        {/* Brand: [AT] Airport Taxi RIDE OFFERS */}
        <div className="navbar__brand" onClick={() => onNavigate('landing')}>
          <span className="navbar__logo">AT</span>
          <span className="navbar__title">Airport Taxi</span>
          <span className="navbar__sub">RIDE OFFERS</span>
        </div>

        {/* Center Nav Links */}
        <nav className="navbar__links" aria-label="Main Navigation">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className={`navbar__link ${activeTab === 'landing' ? 'navbar__link--active' : ''}`}
          >
            Select Role
          </button>
          <button
            type="button"
            onClick={() => onNavigate('traveler')}
            className={`navbar__link ${activeTab === 'traveler' ? 'navbar__link--active' : ''}`}
          >
            Traveler Dashboard
          </button>
          <button
            type="button"
            onClick={() => onNavigate('cabowner')}
            className={`navbar__link ${activeTab === 'cabowner' ? 'navbar__link--active' : ''}`}
          >
            Cabowner Dashboard
          </button>
        </nav>

        {/* Right CTA */}
        <button
          type="button"
          onClick={() => onNavigate('create')}
          className="btn btn--solid navbar__cta"
        >
          Post Ride Request
        </button>
      </div>
    </header>
  );
}

export default Navbar;

