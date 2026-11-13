import React, { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import CabownerDashboard from './pages/CabownerDashboard.jsx';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const handleNavigate = (view) => {
    if (view === 'traveler') {
      window.open('http://localhost:5174/', '_blank');
      return;
    }
    setActiveView(view);
  };

  return (
    <div className="cabowner-app">
      <Navbar activeView={activeView} onNavigate={handleNavigate} />
      {activeView === 'dashboard' && (
        <CabownerDashboard onNavigate={handleNavigate} />
      )}
    </div>
  );
}

export default App;
