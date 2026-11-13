import React from 'react';
import '../css/Navbar.css';

/**
 * Navbar Component for Landing Page.
 * Links to the separate Traveler module (http://localhost:5174/)
 * and Cab Owner module (http://localhost:5175/).
 */
function Navbar() {
  return (
    <header className="navbar">
      <div className="container navbar__inner">
        {/* Brand Logo & Name */}
        <div className="navbar__brand">
          <span className="navbar__logo">AT</span>
          <span className="navbar__title">Airport Taxi</span>
          <span className="navbar__sub">RIDE OFFERS</span>
        </div>

        {/* Center Nav Links */}
        <nav className="navbar__links" aria-label="Main Navigation">
          <span className="navbar__link navbar__link--active">
            Home / Overview
          </span>
          
          {/* Direct link to the separate Traveler application on port 5174 */}
          <a
            href="http://localhost:5174/"
            className="navbar__link"
            title="Open Traveler Portal"
          >
            Traveller &rarr;
          </a>

          {/* Direct link to the separate Cab Owner application on port 5175 */}
          <a
            href="http://localhost:5175/"
            className="navbar__link"
            title="Open Cab Owner Portal"
          >
            Cab Owner &rarr;
          </a>
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
