import React from 'react';
import '../css/Navbar.css';

/**
 * Navbar Component matching Image 2 (AirportCarWala).
 * Header items: Logo with airplane over car, nav links, and hamburger menu.
 */
function Navbar({ onBookNowClick, onResetWindow, isWindowZoomed }) {
  return (
    <header className="navbar">
      <div className="navbar__container">
        {/* Brand Logo: Plane above Car outline */}
        <div className="navbar__brand" onClick={onResetWindow} title="Click to view Airplane Window intro">
          <div className="navbar__logo-icon">
            <svg viewBox="0 0 54 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Airplane taking off angled to the right */}
              <path 
                d="M40 3L43 0L48 3L46 6L42 5L36 10L42 11L41 13L35 12L31 16L29 15L32 10L29 9L30 7L40 3Z" 
                fill="#ffffff" 
              />
              {/* Smooth luxury car outline */}
              <path 
                d="M5 24C5 22.5 6 21 8 20.5L15 17.5C18 16.5 21 16 25 16H35C39 16 43 18 45 20.5L48 24C50 26 50 27.5 48 27.5H43C42.5 25.5 40.5 24 38 24C35.5 24 33.5 25.5 33 27.5H21C20.5 25.5 18.5 24 16 24C13.5 24 11.5 25.5 11 27.5H6.5C5.5 27.5 5 25.5 5 24Z" 
                stroke="#ffffff" 
                strokeWidth="2.2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              {/* Wheels */}
              <circle cx="16" cy="27" r="3" stroke="#ffffff" strokeWidth="2.2" />
              <circle cx="38" cy="27" r="3" stroke="#ffffff" strokeWidth="2.2" />
            </svg>
          </div>
          <span className="navbar__brand-name">AirportCarWala</span>
        </div>

        {/* Center Nav Links matching Image 2 */}
        <nav className="navbar__nav">
          <a href="#home" className="navbar__link">Home</a>
          <a href="#cars" className="navbar__link navbar__link--active">Cars</a>
          <button type="button" onClick={onBookNowClick} className="navbar__link navbar__link--btn">
            Bookings
          </button>
          <a href="#about" className="navbar__link" onClick={onBookNowClick}>About</a>
          <a href="#contact" className="navbar__link" onClick={onBookNowClick}>Contact Us</a>
        </nav>

        {/* Right side: Window re-trigger and Hamburger menu */}
        <div className="navbar__right">
          {isWindowZoomed && (
            <button 
              type="button" 
              onClick={onResetWindow} 
              className="navbar__window-pill"
              title="Return to Airplane Window view"
            >
              ✈ Window
            </button>
          )}
          <button 
            type="button" 
            className="navbar__hamburger" 
            aria-label="Toggle menu" 
            onClick={onBookNowClick}
          >
            <span className="navbar__hamburger-bar"></span>
            <span className="navbar__hamburger-bar"></span>
            <span className="navbar__hamburger-bar"></span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
