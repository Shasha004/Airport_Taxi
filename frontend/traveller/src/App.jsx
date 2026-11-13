import React, { useState } from 'react';
import Navbar from './components/Navbar.jsx';
import TravelerDashboard from './pages/TravelerDashboard.jsx';
import CreateRidePage from './pages/CreateRidePage.jsx';

function App() {
  // activeView: 'dashboard' | 'create'
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <div className="traveler-app">
      <Navbar activeView={activeView} onNavigate={setActiveView} />
      {activeView === 'dashboard' ? (
        <TravelerDashboard onNavigate={setActiveView} />
      ) : (
        <CreateRidePage onNavigate={setActiveView} />
      )}
    </div>
  );
}

export default App;

