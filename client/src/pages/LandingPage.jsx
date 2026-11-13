import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Building2, ShieldCheck, Clock, MapPin, Sparkles, ArrowRight, X, User, Hash, Users } from 'lucide-react';
import RoleCard from '../components/RoleCard';
import { rideRequestApi } from '../api/api';

const TRAVELER_NAME_KEY = 'airportTaxi_travelerName';
const TRAVELER_ID_KEY = 'airportTaxi_travelerId';

const FALLBACK_TRAVELERS = [
  { travelerId: 'TRV-001', travelerName: 'Kavya Rao' },
  { travelerId: 'TRV-002', travelerName: 'Arjun and Meera' },
  { travelerId: 'TRV-003', travelerName: 'Iyer family' },
  { travelerId: 'TRV-004', travelerName: 'Menon family' },
  { travelerId: 'TRV-005', travelerName: 'Menon family P2' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [idInput, setIdInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [availableTravelers, setAvailableTravelers] = useState(FALLBACK_TRAVELERS);

  const savedName = localStorage.getItem(TRAVELER_NAME_KEY);
  const savedId = localStorage.getItem(TRAVELER_ID_KEY);

  useEffect(() => {
    async function fetchTravelers() {
      try {
        const res = await rideRequestApi.getTravelers();
        if (res.data && res.data.length > 0) {
          setAvailableTravelers(res.data);
        }
      } catch (e) {
        // Fallback already set
      }
    }
    fetchTravelers();
  }, []);

  const handleEnterTraveler = () => {
    setIdInput(savedId || '');
    setNameInput(savedName || '');
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSelectPredefined = (val) => {
    if (!val) {
      setIdInput('');
      setNameInput('');
      return;
    }
    const selected = availableTravelers.find(
      (t) => t.travelerId.toLowerCase() === val.toLowerCase() || t.travelerName.toLowerCase() === val.toLowerCase()
    );
    if (selected) {
      setIdInput(selected.travelerId);
      setNameInput(selected.travelerName);
      setErrorMsg('');
    }
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    const cleanId = idInput.trim();
    const cleanName = nameInput.trim();

    if (!cleanId && !cleanName) {
      setErrorMsg('Please enter either a Traveler ID or Traveler / Group Name to continue.');
      return;
    }

    // Auto-fill ID or Name if only one was provided
    let finalId = cleanId;
    let finalName = cleanName;

    if (!finalId && finalName) {
      const match = availableTravelers.find(
        (t) => t.travelerName.toLowerCase() === finalName.toLowerCase()
      );
      finalId = match ? match.travelerId : `TRV-${Math.floor(100 + Math.random() * 900)}`;
    }

    if (!finalName && finalId) {
      const match = availableTravelers.find(
        (t) => t.travelerId.toLowerCase() === finalId.toLowerCase()
      );
      finalName = match ? match.travelerName : finalId;
    }

    localStorage.setItem(TRAVELER_ID_KEY, finalId);
    localStorage.setItem(TRAVELER_NAME_KEY, finalName);
    setShowModal(false);
    navigate('/traveler');
  };

  const handleSwitchUser = () => {
    localStorage.removeItem(TRAVELER_NAME_KEY);
    localStorage.removeItem(TRAVELER_ID_KEY);
    setIdInput('');
    setNameInput('');
    setErrorMsg('');
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

            {savedName || savedId ? (
              <div className="modal-body">
                <p className="modal-desc">Welcome back! Continue with your saved traveler profile:</p>
                <div className="saved-name-pill" style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <User size={16} />
                  <span>{savedName || 'Traveler'}</span>
                  {savedId && <span style={{ opacity: 0.7, fontSize: '0.85em' }}>({savedId})</span>}
                </div>
                <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
                  <button
                    className="btn-primary"
                    onClick={() => { setShowModal(false); navigate('/traveler'); }}
                  >
                    <span>Continue as {savedName || savedId}</span>
                    <ArrowRight size={16} />
                  </button>
                  <button className="btn-secondary" onClick={handleSwitchUser}>
                    Switch User / Change ID
                  </button>
                </div>
              </div>
            ) : (
              <form className="modal-body" onSubmit={handleModalSubmit}>
                <p className="modal-desc">
                  Select an existing traveler profile or enter your Traveler ID and Name.
                </p>

                {/* Quick Pick Dropdown */}
                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label htmlFor="quickSelectTraveler">
                    <Users size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                    Quick Select Existing Traveler
                  </label>
                  <select
                    id="quickSelectTraveler"
                    className="input-field"
                    onChange={(e) => handleSelectPredefined(e.target.value)}
                    value={idInput || ''}
                  >
                    <option value="">-- Choose Profile or Type Below --</option>
                    {availableTravelers.map((t) => (
                      <option key={t.travelerId} value={t.travelerId}>
                        {t.travelerId} • {t.travelerName} {t.count ? `(${t.count} requests)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', margin: '0.6rem 0', opacity: 0.6 }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                  <span style={{ padding: '0 8px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>or enter manually</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
                </div>

                {/* Traveler ID Field */}
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label htmlFor="travelerIdInput">
                    <Hash size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                    Traveler ID
                  </label>
                  <input
                    id="travelerIdInput"
                    type="text"
                    className={`input-field${errorMsg ? ' input-error' : ''}`}
                    placeholder="e.g. TRV-001, TRV-004, or custom ID"
                    value={idInput}
                    onChange={(e) => { setIdInput(e.target.value); setErrorMsg(''); }}
                    maxLength={30}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    Case-insensitive (e.g. trv-001 or TRV-001)
                  </span>
                </div>

                {/* Traveler Name Field */}
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label htmlFor="travelerNameInput">
                    <User size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                    Traveler / Group Name
                  </label>
                  <input
                    id="travelerNameInput"
                    type="text"
                    className={`input-field${errorMsg ? ' input-error' : ''}`}
                    placeholder="e.g. Menon family, Kavya Rao, John Smith"
                    value={nameInput}
                    onChange={(e) => { setNameInput(e.target.value); setErrorMsg(''); }}
                    maxLength={80}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    Case-insensitive (e.g. menon family or Menon Family)
                  </span>
                  {errorMsg && <span className="field-error">{errorMsg}</span>}
                </div>

                <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
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
