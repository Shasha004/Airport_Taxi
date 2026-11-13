import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Car,
  Plane,
  Building,
  Navigation,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Clock,
  Compass,
  CheckCircle,
  MapPin,
  ExternalLink,
  Shield,
  Crosshair,
  Radio,
} from 'lucide-react';

// Coordinates lookup for airports in catalog
const AIRPORT_COORDS = {
  NRT: { lat: 35.7720, lng: 140.3929, name: 'Narita International Airport', code: 'NRT' },
  HND: { lat: 35.5494, lng: 139.7798, name: 'Haneda Airport', code: 'HND' },
  KIX: { lat: 34.4320, lng: 135.2304, name: 'Kansai International Airport', code: 'KIX' },
  ITM: { lat: 34.7855, lng: 135.4382, name: 'Osaka Itami Airport', code: 'ITM' },
  DEL: { lat: 28.5562, lng: 77.1000, name: 'Indira Gandhi International Airport', code: 'DEL' },
  BLR: { lat: 13.1986, lng: 77.7066, name: 'Kempegowda International Airport', code: 'BLR' },
  BOM: { lat: 19.0896, lng: 72.8656, name: 'Chhatrapati Shivaji Airport', code: 'BOM' },
  MAA: { lat: 12.9941, lng: 80.1709, name: 'Chennai International Airport', code: 'MAA' },
  DXB: { lat: 25.2532, lng: 55.3657, name: 'Dubai International Airport', code: 'DXB' },
  AUH: { lat: 24.4330, lng: 54.6511, name: 'Zayed International Airport', code: 'AUH' },
};

// Default hotel coordinates fallback
const DEFAULT_HOTEL_COORDS = {
  lat: 35.7120,
  lng: 139.7728,
  name: 'Ueno Garden Inn',
  city: 'Tokyo',
  area: 'Ueno',
};

// Realistic expressway waypoints for NRT -> Tokyo
const NRT_TOKYO_WAYPOINTS = [
  [35.7720, 140.3929, 'Narita Terminal Pickup'],
  [35.7600, 140.3650, 'Shin-Kuko Expressway Ramp'],
  [35.7330, 140.3200, 'Tomisato Interchange'],
  [35.7000, 140.2600, 'Shisui Parking Area'],
  [35.7150, 140.2100, 'Sakura Interchange'],
  [35.6700, 140.1650, 'Yotsukaido Highway'],
  [35.6550, 140.1150, 'Chiba-Kita Interchange'],
  [35.6450, 140.0350, 'Makuhari Tokyo Bay Corridor'],
  [35.6600, 140.0000, 'Higashi-Kanto Expressway'],
  [35.6850, 139.9800, 'Funabashi Junction'],
  [35.7100, 139.9300, 'Ichikawa Toll Gate'],
  [35.7050, 139.8900, 'Edogawa River Crossing'],
  [35.7000, 139.8500, 'Komatsugawa Shuto Route 7'],
  [35.6960, 139.8150, 'Kinshicho Interchange'],
  [35.7050, 139.7900, 'Asakusa & Ueno Exit'],
  [35.7120, 139.7728, 'Ueno Destination Hotel'],
];

// Realistic expressway waypoints for HND -> Tokyo
const HND_TOKYO_WAYPOINTS = [
  [35.5494, 139.7798, 'Haneda Terminal Pickup'],
  [35.5650, 139.7600, 'Haneda Ramp Route 1'],
  [35.5900, 139.7500, 'Oi Junction Coastal Line'],
  [35.6200, 139.7500, 'Shinagawa Expressway'],
  [35.6450, 139.7600, 'Hamamatsucho Bay Corridor'],
  [35.6680, 139.7650, 'Shimbashi & Ginza Expressway'],
  [35.6900, 139.7700, 'Nihonbashi Route'],
  [35.7120, 139.7728, 'Destination Hotel'],
];

// Realistic expressway waypoints for KIX -> Osaka
const KIX_OSAKA_WAYPOINTS = [
  [34.4320, 135.2304, 'Kansai Airport Terminal'],
  [34.4450, 135.2600, 'Sky Gate Bridge R'],
  [34.4600, 135.3100, 'Rinku Town Ramp'],
  [34.5000, 135.3700, 'Hanshin Expressway Route 4'],
  [34.5500, 135.4200, 'Sakai Coastal Corridor'],
  [34.6100, 135.4800, 'Suminoe Highway'],
  [34.6500, 135.4950, 'Minato-machi Junction'],
  [34.6650, 135.5000, 'Namba Destination Hotel'],
];

/**
 * Calculates distance in km between two lat/lng coordinates (Haversine formula).
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generates smooth curved road waypoints between start and end.
 */
function generateRouteWaypoints(origin, destination, airportCode) {
  if (airportCode === 'NRT' && destination.city?.toLowerCase() === 'tokyo') {
    return NRT_TOKYO_WAYPOINTS.map(([lat, lng, desc]) => ({ lat, lng, desc }));
  }
  if (airportCode === 'HND' && destination.city?.toLowerCase() === 'tokyo') {
    return HND_TOKYO_WAYPOINTS.map(([lat, lng, desc]) => ({ lat, lng, desc }));
  }
  if (airportCode === 'KIX' && destination.city?.toLowerCase() === 'osaka') {
    return KIX_OSAKA_WAYPOINTS.map(([lat, lng, desc]) => ({ lat, lng, desc }));
  }

  // General interpolator with natural road curve
  const points = [];
  const count = 40;
  const lat1 = origin.lat;
  const lng1 = origin.lng;
  const lat2 = destination.lat || DEFAULT_HOTEL_COORDS.lat;
  const lng2 = destination.lng || DEFAULT_HOTEL_COORDS.lng;

  // Arc midpoint perpendicular offset for realistic curved trajectory
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const offsetLat = -dLng * 0.15;
  const offsetLng = dLat * 0.15;

  for (let i = 0; i <= count; i++) {
    const t = i / count;
    // Quadratic bezier curve (t^2, 2t(1-t), (1-t)^2)
    const b0 = (1 - t) * (1 - t);
    const b1 = 2 * (1 - t) * t;
    const b2 = t * t;

    const lat = b0 * lat1 + b1 * (midLat + offsetLat) + b2 * lat2;
    const lng = b0 * lng1 + b1 * (midLng + offsetLng) + b2 * lng2;

    let desc = 'En route on Expressway';
    if (t === 0) desc = `${origin.name || 'Airport'} Terminal Pickup`;
    else if (t < 0.2) desc = 'Airport Expressway Link';
    else if (t < 0.5) desc = 'Main Metropolitan Highway Corridor';
    else if (t < 0.8) desc = 'City Center Expressway';
    else if (t < 1) desc = 'Approaching Destination District';
    else desc = `${destination.name || 'Hotel'} Dropoff Location`;

    points.push({ lat, lng, desc });
  }

  return points;
}

/**
 * Calculates bearing in degrees between two points.
 */
function getBearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin((lon2 - lon1) * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180);
  const x =
    Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos((lon2 - lon1) * Math.PI / 180);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export default function LiveRideTracker({ booking }) {
  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const carMarkerRef = useRef(null);
  const fullPolylineRef = useRef(null);
  const traveledPolylineRef = useRef(null);

  // Determine origin & destination
  const airportCode = booking?.flight?.to || 'NRT';
  const airport = useMemo(() => {
    if (booking?.flight?.airport?.lat && booking?.flight?.airport?.lng) {
      return booking.flight.airport;
    }
    return AIRPORT_COORDS[airportCode] || AIRPORT_COORDS.NRT;
  }, [airportCode, booking]);

  const hotel = useMemo(() => {
    if (booking?.hotel?.lat && booking?.hotel?.lng) {
      return booking.hotel;
    }
    return DEFAULT_HOTEL_COORDS;
  }, [booking]);

  const routeWaypoints = useMemo(() => {
    return generateRouteWaypoints(airport, hotel, airportCode);
  }, [airport, hotel, airportCode]);

  // Total trip stats
  const totalDistanceKm = useMemo(() => {
    return booking?.driveMinutes ? Math.round(booking.driveMinutes * 0.82) : 73.3;
  }, [booking]);

  const estimatedMinutes = booking?.driveMinutes || 90;

  // Tracking state
  // tripState: 'WAITING_PICKUP' | 'EN_ROUTE' | 'ARRIVED'
  const [tripState, setTripState] = useState('WAITING_PICKUP');
  const [progress, setProgress] = useState(0); // 0.0 to 1.0
  const [speedMultiplier, setSpeedMultiplier] = useState(2); // 1x, 2x, 5x
  const [isPaused, setIsPaused] = useState(false);
  const [followCab, setFollowCab] = useState(true);
  const [useFallbackSvg, setUseFallbackSvg] = useState(false);

  // Compute current coordinates based on progress
  const currentNavState = useMemo(() => {
    const totalPoints = routeWaypoints.length;
    if (totalPoints === 0) return { lat: airport.lat, lng: airport.lng, desc: '', bearing: 0 };

    const virtualIndex = progress * (totalPoints - 1);
    const lowIndex = Math.floor(virtualIndex);
    const highIndex = Math.min(lowIndex + 1, totalPoints - 1);
    const ratio = virtualIndex - lowIndex;

    const p1 = routeWaypoints[lowIndex];
    const p2 = routeWaypoints[highIndex];

    const currentLat = p1.lat + (p2.lat - p1.lat) * ratio;
    const currentLng = p1.lng + (p2.lng - p1.lng) * ratio;
    const bearing = getBearing(p1.lat, p1.lng, p2.lat, p2.lng);

    const distRemaining = Math.max(0, (totalDistanceKm * (1 - progress))).toFixed(1);
    const minsRemaining = Math.max(0, Math.round(estimatedMinutes * (1 - progress)));

    // Fluctuating realistic highway speed
    let speedKmh = 0;
    if (tripState === 'EN_ROUTE') {
      speedKmh = progress > 0.85 ? 42 : Math.round(75 + Math.sin(progress * 25) * 12);
    }

    return {
      lat: currentLat,
      lng: currentLng,
      desc: p1.desc || 'En Route',
      bearing,
      distRemaining,
      minsRemaining,
      speedKmh,
    };
  }, [progress, routeWaypoints, airport, totalDistanceKm, estimatedMinutes, tripState]);

  // Leaflet map initialization
  useEffect(() => {
    const L = window.L;
    if (!L || !mapContainerRef.current) {
      setUseFallbackSvg(true);
      return;
    }

    // Clean up if already initialized
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: [airport.lat, airport.lng],
        zoom: 11,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Custom Airport Marker (DivIcon)
      const airportIcon = L.divIcon({
        className: 'custom-map-pin airport-pin',
        html: `
          <div style="background: #000; color: #fff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2.5px solid #fff;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      // Custom Hotel Marker (DivIcon)
      const hotelIcon = L.divIcon({
        className: 'custom-map-pin hotel-pin',
        html: `
          <div style="background: #16a34a; color: #fff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2.5px solid #fff;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      L.marker([airport.lat, airport.lng], { icon: airportIcon })
        .addTo(map)
        .bindPopup(`<strong>${airport.name} (${airport.code})</strong><br>Terminal Ride Pickup Location`);

      L.marker([hotel.lat || DEFAULT_HOTEL_COORDS.lat, hotel.lng || DEFAULT_HOTEL_COORDS.lng], { icon: hotelIcon })
        .addTo(map)
        .bindPopup(`<strong>${hotel.name}</strong><br>${hotel.city}, ${hotel.area}`);

      // Route lines: Full planned path (dashed gray) and traveled path (solid black/blue)
      const latLngs = routeWaypoints.map((p) => [p.lat, p.lng]);

      fullPolylineRef.current = L.polyline(latLngs, {
        color: '#737373',
        weight: 5,
        opacity: 0.6,
        dashArray: '6, 8',
      }).addTo(map);

      traveledPolylineRef.current = L.polyline([[airport.lat, airport.lng]], {
        color: '#000000',
        weight: 6,
        opacity: 0.95,
      }).addTo(map);

      // Moving Cab Marker with Animated Pulsing Radar
      const createCarIcon = (bearing) =>
        L.divIcon({
          className: 'moving-cab-marker',
          html: `
            <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(0,0,0,0.18); animation: cabPulse 1.4s infinite;"></div>
              <div style="transform: rotate(${bearing}deg); transition: transform 0.2s ease; background: #000; color: #fff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4); border: 2.5px solid #fff; z-index: 2;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11.1 2 11.5 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });

      carMarkerRef.current = L.marker([airport.lat, airport.lng], {
        icon: createCarIcon(0),
        zIndexOffset: 1000,
      }).addTo(map);

      // Fit bounds to show entire route comfortably
      map.fitBounds(L.latLngBounds(latLngs), { padding: [60, 60] });

      leafletMapRef.current = map;
    } catch (e) {
      console.warn('Leaflet initialization failed, falling back to SVG:', e);
      setUseFallbackSvg(true);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [airport, hotel, routeWaypoints]);

  // Live animation loop
  useEffect(() => {
    if (tripState !== 'EN_ROUTE' || isPaused) return;

    // Advance duration: 30 seconds total simulated at 1x
    const stepDurationMs = 50;
    const totalSimulatedSeconds = 30 / speedMultiplier;
    const progressStep = stepDurationMs / (totalSimulatedSeconds * 1000);

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + progressStep;
        if (next >= 1) {
          clearInterval(interval);
          setTripState('ARRIVED');
          return 1;
        }
        return next;
      });
    }, stepDurationMs);

    return () => clearInterval(interval);
  }, [tripState, isPaused, speedMultiplier]);

  // Update Leaflet marker and polyline as progress advances
  useEffect(() => {
    const map = leafletMapRef.current;
    const carMarker = carMarkerRef.current;
    const traveledPolyline = traveledPolylineRef.current;
    const L = window.L;

    if (!map || !carMarker || !L) return;

    const currentLatLng = [currentNavState.lat, currentNavState.lng];
    carMarker.setLatLng(currentLatLng);

    // Update rotation bearing
    const iconElement = carMarker.getElement();
    if (iconElement) {
      const innerCar = iconElement.querySelector('div > div:last-child');
      if (innerCar) {
        innerCar.style.transform = `rotate(${currentNavState.bearing}deg)`;
      }
    }

    // Update traveled route polyline
    const totalPoints = routeWaypoints.length;
    const currentHighIndex = Math.floor(progress * (totalPoints - 1));
    const passedPoints = routeWaypoints.slice(0, currentHighIndex + 1).map((p) => [p.lat, p.lng]);
    passedPoints.push(currentLatLng);

    if (traveledPolyline) {
      traveledPolyline.setLatLngs(passedPoints);
    }

    // Auto-center camera on cab if followCab is enabled
    if (followCab && tripState === 'EN_ROUTE') {
      map.panTo(currentLatLng, { animate: false });
    }
  }, [progress, currentNavState, routeWaypoints, followCab, tripState]);

  // Traveler boards cab handler
  const handleTravelerBoarded = () => {
    setTripState('EN_ROUTE');
    setIsPaused(false);
  };

  const handleResetTrip = () => {
    setProgress(0);
    setTripState('WAITING_PICKUP');
    setIsPaused(false);
    if (leafletMapRef.current && fullPolylineRef.current) {
      leafletMapRef.current.fitBounds(fullPolylineRef.current.getBounds(), { padding: [60, 60] });
    }
  };

  const handleCenterOnCab = () => {
    setFollowCab(true);
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([currentNavState.lat, currentNavState.lng], 14, { animate: true });
    }
  };

  return (
    <div className="live-ride-tracker-card">
      {/* Top Telemetry Header */}
      <div className="tracker-top-header">
        <div className="tracker-route-info">
          <div className="live-badge-row">
            {tripState === 'WAITING_PICKUP' && (
              <span className="live-status-pill waiting">
                <Clock size={14} />
                <span>CAB WAITING AT AIRPORT PICKUP</span>
              </span>
            )}
            {tripState === 'EN_ROUTE' && (
              <span className="live-status-pill active-live">
                <Radio size={14} className="pulse-icon" />
                <span>TRAVELER IN CAB • LIVE GPS LOCATION</span>
              </span>
            )}
            {tripState === 'ARRIVED' && (
              <span className="live-status-pill completed">
                <CheckCircle size={14} />
                <span>SAFELY ARRIVED AT DESTINATION HOTEL</span>
              </span>
            )}
            <span className="vehicle-ref-tag">
              {booking?.carId || 'Assigned Vehicle'} • {booking?.supplier?.name || 'Verified Supplier'}
            </span>
          </div>

          <h2 className="tracker-title">
            {airport.code} ({airport.name.split(' ')[0]}) ➔ {hotel.name}
          </h2>
          <p className="tracker-sub">
            Real-time live route tracking from airport terminal arrivals to destination hotel.
          </p>
        </div>

        {/* Action button trigger: When after the traveler get into the cab */}
        <div className="tracker-cta-wrap">
          {tripState === 'WAITING_PICKUP' && (
            <button
              type="button"
              className="btn-primary btn-board-cab"
              onClick={handleTravelerBoarded}
            >
              <Car size={18} />
              <span>Traveler In Cab — Start Live Route</span>
            </button>
          )}

          {tripState === 'EN_ROUTE' && (
            <div className="tracker-controls-row">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsPaused(!isPaused)}
                title={isPaused ? 'Resume live simulation' : 'Pause simulation'}
              >
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>

              <div className="speed-pills-group">
                {[1, 2, 5].map((multiplier) => (
                  <button
                    key={multiplier}
                    type="button"
                    className={`speed-pill ${speedMultiplier === multiplier ? 'active' : ''}`}
                    onClick={() => setSpeedMultiplier(multiplier)}
                  >
                    {multiplier}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                className={`btn-secondary ${followCab ? 'active-follow' : ''}`}
                onClick={handleCenterOnCab}
                title="Center camera on cab"
              >
                <Crosshair size={16} />
                <span>Center Cab</span>
              </button>
            </div>
          )}

          {tripState === 'ARRIVED' && (
            <button type="button" className="btn-secondary" onClick={handleResetTrip}>
              <RotateCcw size={16} />
              <span>Replay Live Journey</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="trip-progress-container">
        <div className="trip-progress-track">
          <div
            className="trip-progress-fill"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>
        <div className="trip-progress-labels">
          <span>{airport.code} Airport (0 km)</span>
          <span className="current-milestone-text">
            {currentNavState.desc} ({Math.round(progress * 100)}%)
          </span>
          <span>{hotel.name} ({totalDistanceKm} km)</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="map-view-wrapper">
        <div
          ref={mapContainerRef}
          id="live-tracking-map"
          className="leaflet-map-element"
          style={{ height: '460px', width: '100%', borderRadius: '12px' }}
        />

        {/* Fallback SVG Map if Leaflet is unavailable */}
        {useFallbackSvg && (
          <div className="svg-fallback-map">
            <svg viewBox="0 0 800 460" className="fallback-svg">
              {/* Background Map Grid */}
              <rect width="800" height="460" fill="#f8fafc" />
              <path
                d="M 50 230 Q 400 80 750 230"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="8"
                strokeDasharray="8 8"
              />
              <path
                d="M 50 230 Q 400 80 750 230"
                fill="none"
                stroke="#000000"
                strokeWidth="8"
                strokeDasharray="1000"
                strokeDashoffset={1000 * (1 - progress)}
              />

              {/* Airport Terminal Marker */}
              <circle cx="50" cy="230" r="18" fill="#000" />
              <text x="50" y="270" textAnchor="middle" fontWeight="bold" fontSize="13">
                {airport.code} Airport
              </text>

              {/* Destination Hotel Marker */}
              <circle cx="750" cy="230" r="18" fill="#16a34a" />
              <text x="750" y="270" textAnchor="middle" fontWeight="bold" fontSize="13">
                {hotel.name}
              </text>

              {/* Moving Cab Icon */}
              {(() => {
                const cx = 50 + (750 - 50) * progress;
                const cy = 230 - Math.sin(progress * Math.PI) * 110;
                return (
                  <g transform={`translate(${cx}, ${cy})`}>
                    <circle r="22" fill="rgba(0,0,0,0.15)">
                      <animate attributeName="r" values="18;28;18" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    <circle r="14" fill="#000" stroke="#fff" strokeWidth="2.5" />
                    <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
                      CAB
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>
        )}

        {/* Live HUD Telemetry Card Overlay on Top of Map */}
        <div className="map-hud-overlay">
          <div className="hud-metric">
            <span className="hud-lbl">CURRENT SPEED</span>
            <div className="hud-val-row">
              <Compass size={16} />
              <strong>{currentNavState.speedKmh} <small>km/h</small></strong>
            </div>
          </div>

          <div className="hud-metric">
            <span className="hud-lbl">ESTIMATED ETA</span>
            <div className="hud-val-row">
              <Clock size={16} />
              <strong>{currentNavState.minsRemaining} <small>mins</small></strong>
            </div>
          </div>

          <div className="hud-metric">
            <span className="hud-lbl">DISTANCE LEFT</span>
            <div className="hud-val-row">
              <Navigation size={16} />
              <strong>{currentNavState.distRemaining} <small>km</small></strong>
            </div>
          </div>

          <div className="hud-metric highlight-hud">
            <span className="hud-lbl">CURRENT ROAD</span>
            <span className="hud-road-name">{currentNavState.desc}</span>
          </div>
        </div>
      </div>

      {/* Driver & Trip Details Footer */}
      <div className="tracker-footer-grid">
        <div className="driver-profile-box">
          <div className="driver-avatar">
            <Car size={22} />
          </div>
          <div>
            <span className="driver-lbl">ASSIGNED DRIVER & VEHICLE</span>
            <strong className="driver-name">Kenji Sato • {booking?.car?.type || 'Sedan'} ({booking?.carId || 'SC-1'})</strong>
            <span className="driver-fleet">{booking?.supplier?.name || 'Verified Fleet Supplier'} • 4.9 ★ Rating</span>
          </div>
        </div>

        <div className="trip-specs-box">
          <div>
            <span className="lbl">Pickup Airport:</span>
            <strong>{airport.name} ({airport.code})</strong>
          </div>
          <div>
            <span className="lbl">Dropoff Destination:</span>
            <strong>{hotel.name} ({hotel.area}, {hotel.city})</strong>
          </div>
          <div>
            <span className="lbl">Confirmed Fare:</span>
            <strong className="text-success">₹{Number(booking?.price || 12000).toLocaleString()}</strong>
          </div>
          <div>
            <span className="lbl">Ride Status:</span>
            <strong className={tripState === 'ARRIVED' ? 'text-success' : ''}>
              {tripState === 'WAITING_PICKUP' && 'Awaiting Traveler Boarding'}
              {tripState === 'EN_ROUTE' && 'En Route to Hotel'}
              {tripState === 'ARRIVED' && 'Arrived at Hotel'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
