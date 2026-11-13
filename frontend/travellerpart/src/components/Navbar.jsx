import { Link, useLocation } from 'react-router-dom';
import '../css/Navbar.css';

function Navbar() {
  const { pathname } = useLocation();

  const links = [
    { to: '/', label: 'Select Role' },
    { to: '/traveler', label: 'Traveler Dashboard' }
  ];

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__brand">
          <span className="navbar__logo">AT</span>
          <span className="navbar__title">Airport Taxi</span>
          <span className="navbar__sub">RIDE OFFERS</span>
        </Link>

        <nav className="navbar__links">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={pathname === l.to ? 'navbar__link navbar__link--active' : 'navbar__link'}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Link to="/traveler/create" className="btn btn--solid navbar__cta">
          Post Ride Request
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
