import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import BookingModal from '../components/BookingModal.jsx';
import rotatingCarVideo from '../image/Blue_sports_car_rotating_075f9c82.mp4';
import '../css/Landing.css';

/**
 * Main Landing Page Component (AirportCarWala).
 * Black and White Luxury Noir Theme:
 * - Left (50%): Signature "Awesome" script font styling, subtitle, *SPECS, and Book Now
 * - Right (50%): Big size 3D rotating supercar video in high-contrast monochrome silver & black!
 */
function Landing() {
  // Controls the Hackathon Problem 2 Booking & Rules modal
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Active spec slide (default index 2 matching the open ring dot from Image 2)
  const [activeSlide, setActiveSlide] = useState(2);

  const mainVideoRef = useRef(null);

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

  // Auto-play the rotating car video immediately
  useEffect(() => {
    if (mainVideoRef.current) {
      mainVideoRef.current.play().catch(() => {});
    }
  }, [activeSlide]);

  return (
    <div className="landing-viewport">
      {/* ====================================================================
          MAIN PAGE (50 / 50 BLACK & WHITE LUXURY SPLIT)
          ==================================================================== */}
      <main className="main-stage">
        {/* Top Navbar */}
        <Navbar 
          onBookNowClick={() => setIsBookingOpen(true)}
        />

        {/* 50 / 50 Hero Split Grid */}
        <div className="hero-split">
          <div className="hero-split__container">
            {/* ================= LEFT 50%: ALL TEXT & SPECS ================= */}
            <div className="hero-split__left">
              <span className="hero-split__eyebrow">Luxury Car Rentals</span>
              
              <h1 className="hero-split__title font-awesome-style">
                Luxury Car<br />
                Rentals
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
                <div className="car-big-video__glow"></div>
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
