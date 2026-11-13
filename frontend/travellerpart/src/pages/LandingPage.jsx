import { Link } from 'react-router-dom';
import '../css/LandingPage.css';

const rules = [
  { code: 'R1', title: 'Valid request', text: 'Flight & hotel from the catalog. Arrival airport serves the hotel city. At least 1 adult, children 0–17.' },
  { code: 'R2', title: '60-min buffer', text: 'Pickup is at least 60 minutes after landing so you clear arrivals with time to spare.' },
  { code: 'R3', title: 'Fair price', text: 'Your proposed price must sit inside the route’s suggested price band — no surprises, no haggling.' }
];

const travelerFeatures = [
  'Catalog selection for flights & hotels',
  '60-minute landing-to-pickup buffer (R2)',
  'Route price range limits (R3)',
  'Passenger & baggage validation (R1)'
];

const supplierFeatures = [
  'Airport & service-area filtering (R4)',
  'Car seating & luggage fit check (R5)',
  'Busy-window scheduling (R6)',
  'Price bidding within range (R7)'
];

function FeatureList({ items }) {
  return (
    <ul className="lp-features">
      {items.map((f) => (
        <li key={f}>
          <span className="lp-tick">✓</span>
          {f}
        </li>
      ))}
    </ul>
  );
}

function LandingPage() {
  return (
    <div className="lp">
      {/* Hero */}
      <section className="lp-hero">
        <div className="container lp-hero__inner">
          <span className="badge badge--fill lp-hero__badge">Airport Ride Offers Platform • Part 1</span>
          <h1 className="lp-hero__title">Seamless Airport Transfers with Transparent Pricing</h1>
          <p className="lp-hero__text">
            Travelers post their trip with a price; eligible taxi suppliers assign a car and a quote. Compare,
            book, and get a 10-digit booking number — all in one place.
          </p>
        </div>
      </section>

      {/* Role cards */}
      <section className="container lp-roles">
        <div className="lp-roles__grid">
          {/* Traveler */}
          <article className="lp-card lp-card--active">
            <div className="lp-card__top">
              <span className="badge">Active • Part 1</span>
              <span className="lp-icon">👤</span>
            </div>
            <h2 className="lp-card__title">Traveler Portal</h2>
            <p className="lp-card__sub">Family &amp; Business Airport Transfers</p>
            <FeatureList items={travelerFeatures} />
            <Link to="/traveler" className="btn btn--solid lp-card__cta">
              Enter as Traveler
            </Link>
          </article>

          {/* Supplier */}
          <article className="lp-card lp-card--soon">
            <div className="lp-card__top">
              <span className="badge">Coming in Part 2</span>
              <span className="lp-icon">🏢</span>
            </div>
            <h2 className="lp-card__title">Taxi Supplier Portal</h2>
            <p className="lp-card__sub">Fleet Management &amp; Ride Matching</p>
            <FeatureList items={supplierFeatures} />
            <button className="btn btn--ghost lp-card__cta btn--disabled" disabled>
              Supplier Portal (Part 2)
            </button>
          </article>
        </div>
      </section>

      {/* Rule guarantees */}
      <section className="lp-rules">
        <div className="container">
          <h2 className="lp-rules__head">Rules we enforce for every ride</h2>
          <div className="lp-rules__grid">
            {rules.map((r) => (
              <article className="lp-rule" key={r.code}>
                <span className="lp-rule__code">{r.code}</span>
                <h3 className="lp-rule__title">{r.title}</h3>
                <p className="lp-rule__text">{r.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
