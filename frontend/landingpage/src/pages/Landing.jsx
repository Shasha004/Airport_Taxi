import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import BookingModal from '../components/BookingModal.jsx';
import airplaneWindowImg from '../image/airplane_window.jpg';
import rotatingCarVideo from '../image/Blue_sports_car_rotating_01db1ae0.mp4';
import '../css/Landing.css';

/**
 * Landing Page Component.
 *
 * 1. Intro Stage: Realistic Airplane Window (Image 1) with zero ugly overlays.
 *    Through the window aperture, the user gets a seamless sneak peek into the
 *    main page's rotating blue sports car!
 * 2. Clicking anywhere on the window zooms through the glass directly into the
 *    full-screen AirportCarWala design (Image 2).
 */
function Landing() {
  // Controls the zoom transition from airplane window to full-screen main page
  const [isWindowZoomed, setIsWindowZoomed] = useState(false);

  // Controls the Hackathon Problem 2 Booking & Rules modal
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Active spec slide (default index 2 matching the open ring dot from Image 2)
  const [activeSlide, setActiveSlide] = useState(2);

  const mainVideoRef = useRef(null);
  const portalVideoRef = useRef(null);

  // Specs list for interactive carousel
  const specsList = [
    {
      production: '2023 - Present',
      maxSpeed: '325 km/h',
      engine: '4.0L Twin-Turbo V8'
    },
    {
      production: '2024 - Present',
      maxSpeed: '335 km/h',
      engine: '4.4L TwinPower V8'
    },
    {
      production: '2024 - Present',
      maxSpeed: '340 km/h',
      engine: '5.2L V10'
    },
    {
      production: '2025 - Planned',
      maxSpeed: '350 km/h',
      engine: '6.5L Hybrid V12'
    },
    {
      production: '2024 - Present',
      maxSpeed: '310 km/h',
      engine: 'Electric Dual-Motor'
    }
  ];

  const currentSpecs = specsList[activeSlide];

  // Keep both videos playing smoothly
  useEffect(() => {
    if (portalVideoRef.current) {
      portalVideoRef.current.play().catch(() => {});
    }
    if (isWindowZoomed && mainVideoRef.current) {
      mainVideoRef.current.play().catch(() => {});
    }
  }, [isWindowZoomed]);

  return (
    <div className={`landing-viewport ${isWindowZoomed ? 'landing-viewport--zoomed' : ''}`}>
      {/* ====================================================================
          STAGE 1: AIRPLANE WINDOW INTRO (IMAGE 1)
          Pure, realistic cinematic window with NO ugly popups or boxes.
          Inside the glass aperture, the user sees a small preview of the
          rotating blue sports car in the lounge.
          ==================================================================== */}
      <div 
        className={`window-portal ${isWindowZoomed ? 'window-portal--zoomed-in' : ''}`}
        onClick={() => setIsWindowZoomed(true)}
        title="Click window to fly into lounge"
      >
        <div className="window-portal__bg">
          <img 
            src={airplaneWindowImg} 
            alt="Airplane window view" 
            className="window-portal__img"
          />
        </div>

        {/* Small live view of the main page rotating car through the window glass */}
        <div className="window-portal__glass-aperture">
          <video
            ref={portalVideoRef}
            src={rotatingCarVideo}
            autoPlay
            loop
            muted
            playsInline
            className="window-portal__glass-video"
          />
          {/* Realistic curved glass sheen overlay */}
          <div className="window-portal__glass-sheen"></div>
        </div>
      </div>

      {/* ====================================================================
          STAGE 2: MAIN PAGE DESIGN (EXACT 1:1 RECREATION OF IMAGE 2)
          Centered 3D Rotating Blue Sports Car with full-bleed silk background.
          ==================================================================== */}
      <main className={`main-stage ${isWindowZoomed ? 'main-stage--active' : ''}`}>
        {/* Full-bleed rotating car video layer */}
        <div className="main-stage__video-wrap">
          <video
            ref={mainVideoRef}
            src={rotatingCarVideo}
            autoPlay
            loop
            muted
            playsInline
            className="main-stage__video"
          />
        </div>

        {/* Top Navbar */}
        <Navbar 
          onBookNowClick={() => setIsBookingOpen(true)}
          onResetWindow={() => setIsWindowZoomed(false)}
          isWindowZoomed={isWindowZoomed}
        />

        {/* Hero Overlay Grid (Left typography, Right *SPECS) */}
        <div className="hero-overlay">
          <div className="hero-overlay__inner">
            {/* Left Column: LUXURY CAR RENTALS */}
            <div className="hero-overlay__left">
              <h1 className="hero-title">
                LUXURY CAR<br />
                RENTALS
              </h1>
              <p className="hero-subtitle">
                FIND THE PERFECT CAR<br />
                FOR YOUR NEXT AIRPORT TRIP!
              </p>
              
              <button 
                type="button" 
                className="hero-btn-book"
                onClick={() => setIsBookingOpen(true)}
              >
                <span>BOOK NOW</span>
                <span className="hero-btn-arrow">&#9654;</span>
              </button>
            </div>

            {/* Right Column: *SPECS */}
            <div className="hero-overlay__right">
              <div className="specs-box">
                <h2 className="specs-title">*SPECS</h2>
                <div className="specs-table">
                  <div className="specs-row">
                    <span className="specs-label">Production</span>
                    <span className="specs-val">{currentSpecs.production}</span>
                  </div>
                  <div className="specs-row">
                    <span className="specs-label">Max Speed</span>
                    <span className="specs-val">{currentSpecs.maxSpeed}</span>
                  </div>
                  <div className="specs-row">
                    <span className="specs-label">Engine</span>
                    <span className="specs-val">{currentSpecs.engine}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <Footer 
          activeSlide={activeSlide}
          onSlideChange={setActiveSlide}
          onMoreClick={() => setIsBookingOpen(true)}
        />
      </main>

      {/* Problem 2 Hackathon Ride Offer Engine Modal */}
      <BookingModal 
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}

export default Landing;
