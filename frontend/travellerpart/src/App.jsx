import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import LandingPage from './pages/LandingPage.jsx';
import TravelerDashboard from './pages/TravelerDashboard.jsx';
import CreateRidePage from './pages/CreateRidePage.jsx';

function App() {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/traveler" element={<TravelerDashboard />} />
        <Route path="/traveler/create" element={<CreateRidePage />} />
      </Routes>
    </div>
  );
}

export default App;
