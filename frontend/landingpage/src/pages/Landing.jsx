import airplaneWindowImg from '../image/airplane_window.jpg';
import '../css/Landing.css';

/**
 * Landing page for the Airport Taxi platform.
 *
 * Keep it simple: a full-screen sky background with a single entrance card.
 * No extra sections — just the entry point into the app.
 */
function Landing() {
  return (
    <div
      className="landing"
      style={{ backgroundImage: `url(${airplaneWindowImg})` }}
    >
      <main className="landing__main">
        <div className="entrance-card" role="button" tabIndex={0}>
          <span className="entrance-card__icon" aria-hidden="true">✈</span>
          <h1 className="entrance-card__title">Click to Enter Lounge</h1>
          <p className="entrance-card__subtitle">Fly into Airport Taxi &amp; Ride Offers</p>
        </div>
      </main>
    </div>
  );
}

export default Landing;
