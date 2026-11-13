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
 * 1. Intro Stage: Airplane Window (Image 1) with clean cinematic glass portal.
 * 2. Main Page Stage: 50 / 50 Split Layout:
 *    - Left (50%): All text (Title, Subtitle, *SPECS table, and BOOK NOW button)
 *    - Right (50%): Big, prominent 3D rotating blue sports car video!
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
      engine: '4.0L Twin-Turbo V8',
      carClass: 'SPORTS SEDAN'
    },
    {
      production: '2024 - Present',
      maxSpeed: '335 km/h',
      engine: '4.4L TwinPower V8',
      carClass: 'LUXURY SEDAN'
    },
    {
      production: '2024 - Present',
      maxSpeed: '340 km/h',
      engine: '5.2L V10',
      carClass: 'SUPERCAR / VIP'
    },
    {
      production: '2025 - Planned',
      maxSpeed: '350 km/h',
      engine: '6.5L Hybrid V12',
      carClass: 'HYPERCAR'
    },
    {
      production: '2024 - Present',
      maxSpeed: '310 km/h',
      engine: 'Electric Dual-Motor',
      carClass: 'PERFORMANCE EV'
    }
  ];

  const currentSpecs = specsList[activeSlide];

  // Keep videos playing smoothly
  useEffect(() => {
    if (portalVideoRef.current) {
      portalVideoRef.current.play().catch(() => {});
    }
    if (isWindowZoomed && mainVideoRef.current) {
      mainVideoRef.current.play().catch(() => {});
    }
  }, [isWindowZoomed, activeSlide]);

  return (
    <div className={`landing-viewport ${isWindowZoomed ? 'landing-viewport--zoomed' : ''}`}>
      {/* ====================================================================
          STAGE 1: AIRPLANE WINDOW INTRO (IMAGE 1)
          Clean cinematic airplane window with live glass portal into the car.
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

        {/* Small live view through the window glass */}
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
          <div className="window-portal__glass-sheen"></div>
        </div>
      </div>

      {/* ====================================================================
          STAGE 2: MAIN PAGE DESIGN (50 / 50 SPLIT LAYOUT)
          Left 50%: All Text & Specs
          Right 50%: Big 3D Rotating Blue Sports Car Video
          ==================================================================== */}
      <main className={`main-stage ${isWindowZoomed ? 'main-stage--active' : ''}`}>
        {/* Top Navbar */}
        <Navbar 
          onBookNowClick={() => setIsBookingOpen(true)}
          onResetWindow={() => setIsWindowZoomed(false)}
          isWindowZoomed={isWindowZoomed}
        />

        {/* 50 / 50 Hero Split Grid */}
        <div className="hero-split">
          <div className="hero-split__container">
            {/* ================= LEFT 50%: ALL TEXT & SPECS ================= */}
            <div className="hero-split__left">
              <span className="hero-split__eyebrow">LUXURY CAR RENTALS</span>
              
              <h1 className="hero-split__title">
                LUXURY CAR<br />
                RENTALS
              </h1>

              <p className="hero-split__subtitle">
                FIND THE PERFECT CAR FOR YOUR NEXT AIRPORT TRIP!
              </p>

              {/* Specs Block integrated on the left */}
              <div className="hero-split__specs-box">
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
                  <div className="specs-row">
                    <span className="specs-label">Class</span>
                    <span className="specs-val">{currentSpecs.carClass}</span>
                  </div>
                </div>
              </div>

              {/* BOOK NOW ▶ Button */}
              <div className="hero-split__actions">
                <button 
                  type="button" 
                  className="hero-btn-book"
                  onClick={() => setIsBookingOpen(true)}
                >
                  <span>BOOK NOW</span>
                  <span className="hero-btn-arrow">&#9654;</span>
                </button>
              </div>
            </div>

            {/* ================= RIGHT 50%: BIG ROTATING CAR VIDEO ================= */}
            <div className="hero-split__right">
              <div className="car-big-video-card">
                <video
                  ref={mainVideoRef}
                  src={rotatingCarVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="car-big-video"
                />
                {/* High-tech cyan glow ring & floor shadow */}
                <div className="car-big-video__glow"></div>
                <div className="car-big-video__shadow"></div>
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
