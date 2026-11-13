import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  Car,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Star,
  FileText,
  Bell,
  MapPin,
} from 'lucide-react';
import { catalogApi, supplierApi, changeRequestApi } from '../../api/api';

export default function SupplierDashboard() {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('TX-JP-01'); // Default to Sakura Cabs
  const [supplierData, setSupplierData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadSuppliersList() {
      try {
        const res = await catalogApi.getSuppliers();
        setSuppliers(res.data || []);
      } catch (err) {
        setError('Failed to load supplier catalog');
      }
    }
    loadSuppliersList();
  }, []);

  const loadDashboardData = async () => {
    if (!selectedSupplierId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await supplierApi.getSupplierRequests(selectedSupplierId);
      setSupplierData(res);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load supplier dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedSupplierId]);

  return (
    <div className="supplier-dashboard-container">
      {/* Top Header & Supplier Selector */}
      <div className="supplier-top-bar">
        <div>
          <span className="supplier-role-badge">Taxi Supplier Portal • Part 2</span>
          <h1 className="supplier-page-title">Supplier Operations Dashboard</h1>
          <p className="supplier-page-sub">
            Monitor real-time demand, assign vehicles from your fleet, and manage booking changes.
          </p>
        </div>

        <div className="supplier-picker-wrap">
          <label htmlFor="supplierSelect">Act as Supplier:</label>
          <select
            id="supplierSelect"
            className="input-field supplier-select"
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
          >
            {suppliers.map((s) => (
              <option key={s.company_id} value={s.company_id}>
                {s.name} ({s.company_id}) — {s.airports.join(', ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading && !supplierData ? (
        <div className="loading-state">
          <RefreshCw size={36} className="spin text-primary" />
          <p>Loading supplier metrics...</p>
        </div>
      ) : supplierData ? (
        <>
          {/* Supplier Info Banner */}
          <div className="supplier-profile-card">
            <div className="profile-main">
              <div className="profile-icon-box">
                <Building2 size={32} />
              </div>
              <div>
                <h2 className="profile-name">{supplierData.supplier.name}</h2>
                <div className="profile-meta-row">
                  <span className="profile-rating">
                    <Star size={14} className="star-icon" />
                    <span>{supplierData.supplier.rating} Rating</span>
                  </span>
                  <span className="meta-dot">•</span>
                  <span>Operating Airports: <strong>{supplierData.supplier.airports.join(', ')}</strong></span>
                  <span className="meta-dot">•</span>
                  <span>Hours: <strong>{supplierData.supplier.service_from} – {supplierData.supplier.service_until}</strong></span>
                  <span className="meta-dot">•</span>
                  <span>Fleet Size: <strong>{supplierData.supplier.vehicles?.length || 0} Cars</strong></span>
                </div>
              </div>
            </div>

            <button className="btn-secondary" onClick={loadDashboardData} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {/* Metric Stats Cards */}
          <div className="metric-cards-grid">
            <div className="metric-card highlight-green">
              <div className="metric-top">
                <span className="metric-lbl">Eligible Ride Requests (R4–R6)</span>
                <Car size={24} className="metric-icon" />
              </div>
              <strong className="metric-val">{supplierData.stats.eligibleRequestsCount}</strong>
              <p className="metric-sub">Open traveler requests ready for car assignment</p>
              <Link
                to={`/supplier/requests?supplierId=${selectedSupplierId}`}
                className="metric-link"
              >
                <span>View Eligible Requests</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="metric-card">
              <div className="metric-top">
                <span className="metric-lbl">Submitted Offers</span>
                <FileText size={24} className="metric-icon" />
              </div>
              <strong className="metric-val">{supplierData.stats.submittedOffersCount}</strong>
              <p className="metric-sub">Total active and historical taxi offers submitted</p>
              <Link
                to={`/supplier/requests?supplierId=${selectedSupplierId}`}
                className="metric-link"
              >
                <span>Manage Offers</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="metric-card highlight-orange">
              <div className="metric-top">
                <span className="metric-lbl">Pending Changes (R9)</span>
                <Bell size={24} className="metric-icon" />
              </div>
              <strong className="metric-val">{supplierData.stats.pendingChangeRequestsCount}</strong>
              <p className="metric-sub">Booking flight or pickup adjustments awaiting your review</p>
              <Link
                to={`/supplier/changes?supplierId=${selectedSupplierId}`}
                className="metric-link"
              >
                <span>Review Change Requests</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Fleet Overview */}
          <div className="fleet-overview-section">
            <h3 className="section-title">
              <Car size={20} />
              <span>Your Registered Fleet Vehicles ({supplierData.supplier.vehicles?.length})</span>
            </h3>
            <div className="fleet-grid">
              {supplierData.supplier.vehicles?.map((car) => (
                <div key={car.vehicle_id} className="fleet-car-card">
                  <div className="car-card-top">
                    <span className="car-id-tag">{car.vehicle_id}</span>
                    <span className="car-type-pill">{car.type}</span>
                  </div>
                  <div className="car-specs-list">
                    <div>
                      <span className="spec-lbl">Passenger Seats:</span>
                      <strong>{car.seats} seats</strong>
                    </div>
                    <div>
                      <span className="spec-lbl">Large Bags:</span>
                      <strong>{car.large_bags} max</strong>
                    </div>
                    <div>
                      <span className="spec-lbl">Small Bags:</span>
                      <strong>{car.small_bags} max</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
