import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Building2, ShieldCheck, Clock, MapPin, Sparkles, ArrowRight, X, User } from 'lucide-react';
import RoleCard from '../components/RoleCard';

const TRAVELER_KEY = 'airportTaxi_travelerName';

export default function LandingPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState('');

  const savedName = localStorage.getItem(TRAVELER_KEY);

  const handleEnterTraveler = () => {
    setNameInput(savedName || '');
    setNameError('');
    setShowModal(true);
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('Please enter your name or group name to continue.');
      return;
    }
    localStorage.setItem(TRAVELER_KEY, trimmed);
    setShowModal(false);
    navigate('/traveler');
  };

  const handleSwitchUser = () => {
    localStorage.removeItem(TRAVELER_KEY);
    setNameInput('');
    setNameError('');
  };

  return (
    <div className="landing-page">
      {/* Traveler Identity Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <User size={22} className="text-primary" />
                <h3>Enter as Traveler</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)} title="Close">
                <X size={18} />
              </button>
            </div>

            {savedName ? (
              <div className="modal-body">
                <p className="modal-desc">Welcome back!</p>
                <div className="saved-name-pill">
                  <User size={16} />
                  <span>{savedName}</span>
                </div>
                <div className="modal-actions" style={{ marginTop: '1rem' }}>
                  <button
                    className="btn-primary"
                    onClick={() => { setShowModal(false); navigate('/traveler'); }}
                  >
                    <span>Continue as {savedName}</span>
                    <ArrowRight size={16} />
                  </button>
                  <button className="btn-secondary" onClick={handleSwitchUser}>
                    Switch User
                  </button>
                </div>
              </div>
            ) : (
              <form className="modal-body" onSubmit={handleModalSubmit}>
                <p className="modal-desc">
                  Enter your name or group name. Your requests will be linked to this identity.
                </p>
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label htmlFor="travelerNameInput">Your Name / Group Name</label>
                  <input
                    id="travelerNameInput"
                    type="text"
                    className={`input-field${nameError ? ' input-error' : ''}`}
                    placeholder="e.g. Menon family, John Smith"
                    value={nameInput}
                    onChange={(e) => { setNameInput(e.target.value); setNameError(''); }}
                    autoFocus
                    maxLength={80}
                  />
                  {nameError && <span className="field-error">{nameError}</span>}
                </div>
                <div className="modal-actions" style={{ marginTop: '1rem' }}>
                  <button type="submit" className="btn-primary">
                    <span>Continue as Traveler</span>
                    <ArrowRight size={16} />
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <section className="hero-section">
        <div className="hero-badge">
          <Sparkles size={16} />
          <span>Airport Ride Offers Platform • Part 1</span>
        </div>
        <h1 className="hero-title">
          Seamless Airport Transfers with Transparent Pricing
        </h1>
        <p className="hero-description">
          Choose your role to get started. Travelers can post ride requests with custom prices within validated route boundaries, and taxi suppliers will fulfill them with suitable vehicles.
        </p>
      </section>

      <section className="roles-container">
        <RoleCard
          title="Traveler Portal"
          subtitle="Family & Business Airport Transfers"
          description="Arriving from a long flight? Select your arrival flight and destination hotel, get verified route pricing, and propose your custom price."
          icon={UserCheck}
          badgeText="Active • Part 1"
          badgeType="active"
          buttonText="Enter as Traveler"
          highlight={true}
          features={[
            'Catalog-backed flight & hotel selection',
            'Automated 60-min landing pickup validation (R2)',
            'Dynamic route pricing boundary checks (R3)',
            'Luggage and passenger capacity validation (R1)',
          ]}
          onClick={handleEnterTraveler}
        />

        <RoleCard
          title="Taxi Supplier Portal"
          subtitle="Fleet Management & Ride Matching"
          description="Taxi operators view open traveler requests eligible for their operational airports, schedule slots, and vehicle capacity."
          icon={Building2}
          badgeText="Active • Part 2"
          badgeType="active"
          buttonText="Enter as Taxi Supplier"
          highlight={true}
          disabled={false}
          features={[
            'Operational airport & service area filtering (R4)',
            'Vehicle seating and luggage fit matching (R5)',
            'Overlap-free busy window scheduling (R6)',
            'Competitive offer assignment & bidding (R7)',
          ]}
          onClick={() => navigate('/supplier')}
        />
      </section>

      <section className="info-banner">
        <div className="info-card">
          <ShieldCheck size={24} className="info-icon" />
          <div>
            <h4>Strict Rule Enforcement</h4>
            <p>Rules R1, R2, and R3 are validated both client-side and server-side.</p>
          </div>
        </div>
        <div className="info-card">
          <Clock size={24} className="info-icon" />
          <div>
            <h4>60-Minute Buffer (R2)</h4>
            <p>Guaranteed 60-minute pickup window post-landing for baggage collection.</p>
          </div>
        </div>
        <div className="info-card">
          <MapPin size={24} className="info-icon" />
          <div>
            <h4>Authoritative Route Limits (R3)</h4>
            <p>Traveler prices are anchored to verified route distances and caps.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
