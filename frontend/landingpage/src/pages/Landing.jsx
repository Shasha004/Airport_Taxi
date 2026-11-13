import React, { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import TravelerDashboard from './TravelerDashboard.jsx';
import CabownerDashboard from './CabownerDashboard.jsx';
import CreateRidePage from './CreateRidePage.jsx';
import '../css/Landing.css';

const rules = [
  { code: 'R1', title: 'Catalog Validation', text: 'Flights and hotels must exist in the official catalog. The arrival airport must serve the destination hotel city. Travel group must have at least 1 adult.' },
  { code: 'R2', title: '60-Min Pickup Buffer', text: 'Pickup time must be at least 60 minutes after flight landing so passengers can clear immigration, baggage claim, and customs.' },
  { code: 'R3', title: 'Route Price Bands', text: 'Proposed fares must sit within the route’s suggested price range (e.g. ₹10,200 – ₹16,800 for Narita to Ueno). Zero price haggling.' },
  { code: 'R4', title: 'Supplier Licensing', text: 'Taxi suppliers must be actively licensed for the arrival airport and operate within verified service hours (e.g. Sakura Cabs at NRT & HND, 06:00–23:00).' },
  { code: 'R5', title: 'Seating & Luggage Fit', text: 'Vehicles must accommodate all passengers and luggage pieces comfortably (Sedans fit up to 4 pax, 3L + 2S bags; SUVs fit up to 6 pax, 5L + 4S bags).' },
  { code: 'R6', title: 'Non-Overlapping Schedule', text: 'Each dispatched vehicle locks a dedicated busy window (e.g. 11:30 to 13:00) with zero overlapping bookings permitted.' },
  { code: 'R7', title: 'Flight Delay Protection', text: 'If an arrival flight is delayed, pickup times and vehicle busy windows adjust automatically with a guaranteed 60-minute buffer.' },
  { code: 'R8', title: '10-Digit Booking Code', text: 'Every confirmed ride generates an immutable, unique 10-digit booking reference used for tracking and dispatch verification.' },
  { code: 'R9', title: 'Itinerary Change Policy', text: 'Travelers can request amendments before dispatch. Destination hotel changes recalculate route distance and allowable pricing bands.' }
];

const travelerFeatures = [
  'Catalog selection for flights & hotels (Rule R1)',
  'Automatic 60-minute post-landing buffer (Rule R2)',
  'Route price range limits (Rule R3)',
  'Passenger & luggage capacity validation (Rule R5)',
  'Unique 10-digit booking reference generation (Rule R8)'
];

const supplierFeatures = [
  'Airport & service-area filtering (Rule R4)',
  'Fleet seating & luggage fit check (Rule R5)',
  'Busy-window scheduling with no overlaps (Rule R6)',
  'Direct bid acceptance within route price band (Rule R3)',
  'Flight delay schedule tracking (Rule R7)'
];

function FeatureList({ items }) {
  return (
    <ul className="lp-features">
      {items.map((item) => (
        <li key={item}>
          <span className="lp-tick">&#10003;</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Landing() {
  // activeTab: 'landing' | 'traveler' | 'cabowner' | 'create'
  const [activeTab, setActiveTab] = useState('traveler');

  return (
    <div className="landing-app">
      {/* Top Universal Navbar matching the Screenshot */}
      <Navbar activeTab={activeTab} onNavigate={setActiveTab} />

      {/* View Switcher */}
      {activeTab === 'landing' && (
        <div className="lp">
          {/* Hero Section */}
          <section className="lp-hero">
            <div className="container lp-hero__inner">
              <span className="badge badge--fill lp-hero__badge">
                Airport Ride Offers Platform &bull; Problem 2
              </span>
              <h1 className="lp-hero__title">
                Seamless Airport Transfers with Transparent Pricing
              </h1>
              <p className="lp-hero__text">
                Travelers post their trip with a price; eligible taxi suppliers assign a car and a quote.
                Compare, book, and receive a 10-digit booking number &mdash; all with zero hidden fees.
              </p>
              <div className="lp-hero__actions">
                <button
                  type="button"
                  className="btn btn--solid"
                  onClick={() => setActiveTab('traveler')}
                >
                  Enter as Traveler
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setActiveTab('cabowner')}
                >
                  Enter as Cab Owner
                </button>
              </div>
            </div>
          </section>

          {/* Role Cards Section */}
          <section className="container lp-roles">
            <div className="lp-roles__grid">
              {/* Traveler Card */}
              <article className="card lp-card">
                <div className="lp-card__top">
                  <span className="badge">Traveler Role</span>
                  <span className="lp-icon">&#128100;</span>
                </div>
                <h2 className="lp-card__title">Traveler Portal</h2>
                <p className="lp-card__sub">Family &amp; Business Airport Transfers (Menon Family Demo)</p>
                <FeatureList items={travelerFeatures} />
                <button
                  type="button"
                  className="btn btn--solid lp-card__cta"
                  onClick={() => setActiveTab('traveler')}
                >
                  Go to Traveler Dashboard
                </button>
              </article>

              {/* Cab Owner Card */}
              <article className="card lp-card">
                <div className="lp-card__top">
                  <span className="badge">Supplier Role</span>
                  <span className="lp-icon">&#128661;</span>
                </div>
                <h2 className="lp-card__title">Cabowner Portal</h2>
                <p className="lp-card__sub">Taxi Fleet Management &amp; Dispatch (Sakura Cabs Tokyo)</p>
                <FeatureList items={supplierFeatures} />
                <button
                  type="button"
                  className="btn btn--solid lp-card__cta"
                  onClick={() => setActiveTab('cabowner')}
                >
                  Go to Cabowner Dashboard
                </button>
              </article>
            </div>
          </section>

          {/* Hackathon Rules Section */}
          <section className="lp-rules">
            <div className="container">
              <h2 className="lp-rules__head">System Rules Enforced for Every Ride</h2>
              <div className="lp-rules__grid">
                {rules.map((r) => (
                  <article className="card lp-rule" key={r.code}>
                    <span className="lp-rule__code">{r.code}</span>
                    <h3 className="lp-rule__title">{r.title}</h3>
                    <p className="lp-rule__text">{r.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'traveler' && (
        <TravelerDashboard onNavigate={setActiveTab} />
      )}

      {activeTab === 'cabowner' && (
        <CabownerDashboard onNavigate={setActiveTab} />
      )}

      {activeTab === 'create' && (
        <CreateRidePage onNavigate={setActiveTab} />
      )}
    </div>
  );
}

export default Landing;
