import React from 'react';
import '../css/Navbar.css';

/**
 * Navbar Component (Black & White Theme).
 * Brand Logo on the left, "Traveller" and "Cabowner" role navigation in the center.
 */
function Navbar({ activeRole = 'traveller', onRoleSelect }) {
  return (
    <header className="navbar">
      <div className="navbar__container">
        {/* Brand Logo: Plane above Car outline */}
        <div className="navbar__brand" onClick={() => onRoleSelect && onRoleSelect('traveller')}>
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

        {/* Center Nav: Replaced old 5 links with strictly "Traveller" and "Cabowner" */}
        <nav className="navbar__nav" aria-label="Main Navigation">
          <button 
            type="button" 
            onClick={() => onRoleSelect && onRoleSelect('traveller')} 
            className={`navbar__link navbar__link--btn ${activeRole === 'traveller' ? 'navbar__link--active' : ''}`}
            aria-current={activeRole === 'traveller' ? 'page' : undefined}
          >
            Traveller
          </button>
          <button 
            type="button" 
            onClick={() => onRoleSelect && onRoleSelect('cabowner')} 
            className={`navbar__link navbar__link--btn ${activeRole === 'cabowner' ? 'navbar__link--active' : ''}`}
            aria-current={activeRole === 'cabowner' ? 'page' : undefined}
          >
            Cabowner
          </button>
        </nav>

        {/* Right side: Hamburger menu */}
        <div className="navbar__right">
          <button 
            type="button" 
            className="navbar__hamburger" 
            aria-label="Toggle menu" 
            onClick={() => onRoleSelect && onRoleSelect(activeRole === 'traveller' ? 'cabowner' : 'traveller')}
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
