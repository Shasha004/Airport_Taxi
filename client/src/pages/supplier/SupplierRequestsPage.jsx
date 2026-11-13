import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plane,
  Building,
  Clock,
  Users,
  Briefcase,
  IndianRupee,
  Car,
  RefreshCw,
  AlertCircle,
  PlusCircle,
  Filter,
} from 'lucide-react';
import { supplierApi, catalogApi } from '../../api/api';

export default function SupplierRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const supplierId = searchParams.get('supplierId') || 'TX-JP-01';
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [supplierData, setSupplierData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const res = await catalogApi.getSuppliers();
        setSuppliers(res.data || []);
      } catch (err) {}
    }
    loadSuppliers();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await supplierApi.getSupplierRequests(supplierId);
      setSupplierData(res);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load eligible requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [supplierId]);

  const handleSupplierChange = (newId) => {
    setSearchParams({ supplierId: newId });
  };

  return (
    <div className="supplier-requests-container">
      <div className="page-header">
        <Link to="/supplier" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Supplier Dashboard</span>
        </Link>
        <div className="header-row">
          <div>
            <h1 className="page-title">Eligible Ride Requests (R4–R6)</h1>
            <p className="page-subtitle">
              Requests matching your operating airports, service areas, hours, and fleet capacity.
            </p>
          </div>

          <div className="supplier-filter-box">
            <span className="filter-lbl">Active Supplier:</span>
            <select
              className="input-field"
              value={supplierId}
              onChange={(e) => handleSupplierChange(e.target.value)}
            >
              {suppliers.map((s) => (
                <option key={s.company_id} value={s.company_id}>
                  {s.name} ({s.company_id})
                </option>
              ))}
            </select>
            <button className="btn-secondary" onClick={loadRequests} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-banner alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <RefreshCw size={36} className="spin text-primary" />
          <p>Filtering requests for {supplierData?.supplier?.name || supplierId}...</p>
        </div>
      ) : !supplierData || supplierData.data.length === 0 ? (
        <div className="empty-state">
          <Car size={48} className="empty-icon" />
          <h3>No Eligible Open Requests</h3>
          <p>
            There are currently no open requests matching {supplierData?.supplier?.name || supplierId}'s operating airports, areas, or fleet schedule.
          </p>
          <p className="empty-sub">
            Tip: Post a new request as a traveler matching this supplier's airports ({supplierData?.supplier?.airports?.join(', ')}).
          </p>
          <Link to="/traveler/create" className="btn-primary" style={{ marginTop: '1rem' }}>
            <span>Post a Test Request</span>
          </Link>
        </div>
      ) : (
        <div className="requests-grid">
          {supplierData.data.map((req) => {
            const childCount = Array.isArray(req.childAges) ? req.childAges.length : 0;
            const totalPassengers = (req.adults || 0) + childCount;

            return (
              <div key={req.id} className="request-card supplier-card-border">
                <div className="request-card-header">
                  <div>
                    <span className="request-id-badge">{req.id}</span>
                    <span className="traveler-name-tag">{req.travelerName || 'Traveler'}</span>
                  </div>
                  <span className="eligible-badge">✓ ELIGIBLE (R4)</span>
                </div>

                <div className="request-route-banner">
                  <div className="route-segment">
                    <Plane size={18} className="route-icon" />
                    <div>
                      <span className="segment-label">Arrival Flight</span>
                      <strong className="segment-value">
                        {req.flight?.flight_number || req.flightId}
                      </strong>
                      <span className="segment-sub">
                        {req.flight ? `${req.flight.from} → ${req.flight.to}` : req.flightId}
                      </span>
                    </div>
                  </div>

                  <div className="route-arrow">➔</div>

                  <div className="route-segment">
                    <Building size={18} className="route-icon" />
                    <div>
                      <span className="segment-label">Destination Hotel</span>
                      <strong className="segment-value">
                        {req.hotel?.name || req.hotelId}
                      </strong>
                      <span className="segment-sub">
                        {req.hotel ? `${req.hotel.city}, ${req.hotel.area}` : req.hotelId}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="request-details-grid">
                  <div className="detail-item">
                    <Clock size={16} className="detail-icon" />
                    <div>
                      <span className="detail-label">Pickup Time</span>
                      <span className="detail-val">{req.pickupTime || req.pickupAt}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Users size={16} className="detail-icon" />
                    <div>
                      <span className="detail-label">Passengers</span>
                      <span className="detail-val">
                        {req.adults} Adults{childCount > 0 && ` + ${childCount} Children`} ({totalPassengers} seats)
                      </span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <Briefcase size={16} className="detail-icon" />
                    <div>
                      <span className="detail-label">Luggage Required</span>
                      <span className="detail-val">
                        {req.largeBags} Large, {req.smallBags} Small
                      </span>
                    </div>
                  </div>

                  {req.carType && (
                    <div className="detail-item">
                      <Car size={16} className="detail-icon" />
                      <div>
                        <span className="detail-label">Requested Car Type</span>
                        <span className="detail-val">{req.carType}</span>
                      </div>
                    </div>
                  )}

                  {req.route && (
                    <div className="detail-item">
                      <Car size={16} className="detail-icon" />
                      <div>
                        <span className="detail-label">Drive Duration</span>
                        <span className="detail-val">
                          ~{req.route.drive_minutes} mins ({req.route.distance_km} km)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="request-card-footer">
                  <div className="price-tag-block">
                    <span className="price-label">Traveler Proposed:</span>
                    <strong className="price-val">₹{Number(req.travelerPrice).toLocaleString()}</strong>
                  </div>
                  {req.route && (
                    <div className="range-tag-block">
                      <span className="range-label">Route Range (R3/R7):</span>
                      <span className="range-val">
                        ₹{req.route.price_min_inr.toLocaleString()} – ₹{req.route.price_max_inr.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="card-action-bar">
                  <Link
                    to={`/supplier/offer/${req.id}?supplierId=${supplierId}`}
                    className="btn-primary w-full"
                  >
                    <PlusCircle size={16} />
                    <span>Assign Car & Propose Price (R7)</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
