import React from 'react';
import '../css/Navbar.css';

/**
 * Navbar Component for Traveler Portal.
 * Links to Landing Page (http://localhost:5173/)
 * and controls Traveler Dashboard & Post Ride views.
 */
function Navbar({ activeView = 'dashboard', onNavigate }) {
  return (
    <header className="navbar">
      <div className="container navbar__inner">
        {/* Brand Logo & Name linking back to Landing Page */}
        <a href="http://localhost:5173/" className="navbar__brand" title="Back to Landing Page">
          <span className="navbar__logo">AT</span>
          <span className="navbar__title">Airport Taxi</span>
          <span className="navbar__sub">TRAVELER</span>
        </a>

        {/* Center Nav Links */}
        <nav className="navbar__links" aria-label="Traveler Navigation">
          <a href="http://localhost:5173/" className="navbar__link">
            &larr; Landing Page
          </a>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className={`navbar__link ${activeView === 'dashboard' ? 'navbar__link--active' : ''}`}
          >
            Traveler Dashboard
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
