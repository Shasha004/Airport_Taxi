import React from 'react';
import '../css/Navbar.css';

/**
 * Navbar Component for Cab Owner Portal.
 * Links to Landing Page (http://localhost:5173/)
 * and Traveler Portal (http://localhost:5174/).
 */
function Navbar({ activeView = 'dashboard', onNavigate }) {
  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <a href="http://localhost:5173/" className="navbar__brand" title="Back to Landing Page">
          <span className="navbar__logo">AT</span>
          <span className="navbar__title">Airport Taxi</span>
          <span className="navbar__sub">CAB OWNER</span>
        </a>

        <nav className="navbar__links" aria-label="Cab Owner Navigation">
          <a href="http://localhost:5173/" className="navbar__link">
            &larr; Landing Page
          </a>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className={`navbar__link ${activeView === 'dashboard' ? 'navbar__link--active' : ''}`}
          >
            Fleet Dashboard
          </button>
          <a href="http://localhost:5174/" className="navbar__link" title="Open Traveler Portal">
            Traveler &rarr;
          </a>
        </nav>

        <a
          href="http://localhost:5174/"
          className="btn btn--solid navbar__cta"
        >
          View Traveler Offers
        </a>
      </div>
    </header>
  );
}

export default Navbar;
