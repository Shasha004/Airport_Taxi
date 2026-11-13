import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Building2, ShieldCheck, Clock, MapPin, Sparkles } from 'lucide-react';
import RoleCard from '../components/RoleCard';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
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
          onClick={() => navigate('/traveler')}
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

