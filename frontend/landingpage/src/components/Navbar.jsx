import React from 'react';
import '../css/Navbar.css';

/**
 * Navbar Component for Landing Page.
 * Links to the separate Traveler module (http://localhost:5174/)
 * and allows navigating between Landing and Cabowner views.
 */
function Navbar({ activeTab = 'landing', onNavigate }) {
  return (
    <header className="navbar">
      <div className="container navbar__inner">
        {/* Brand Logo & Name */}
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
            Home / Overview
          </button>
          
          {/* Direct link to the separate Traveler application on port 5174 */}
          <a
            href="http://localhost:5174/"
            className="navbar__link"
            title="Open Traveler Portal"
          >
            Traveller &rarr;
          </a>

          <button
            type="button"
            onClick={() => onNavigate('cabowner')}
            className={`navbar__link ${activeTab === 'cabowner' ? 'navbar__link--active' : ''}`}
          >
            Cab Owner
          </button>
        </nav>

        {/* Right CTA: opens Traveler Create Ride flow */}
        <a
          href="http://localhost:5174/"
          className="btn btn--solid navbar__cta"
        >
          Post Ride Request
        </a>
      </div>
    </header>
  );
}

export default Navbar;
