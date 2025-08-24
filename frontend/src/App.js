import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage.js';
import DashboardPage from './pages/DashboardPage.js';
import { auth, onAuthStateChanged } from './services/firebase.js';

const App = () => {
  const [authState, setAuthState] = useState({ isAuthenticated: false, user: null });
  const [currentPage, setCurrentPage] = useState('landing');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState({ isAuthenticated: !!user, user });
    });
    return () => unsubscribe();
  }, []);

  const handleViewReport = () => setCurrentPage('dashboard');
  const handleNavigateToLanding = () => setCurrentPage('landing');

  switch (currentPage) {
    case 'dashboard':
      return authState.isAuthenticated 
        ? <DashboardPage onNavigateToLanding={handleNavigateToLanding} /> 
        : <LandingPage onNavigateToDashboard={handleViewReport} authState={authState} />;
    case 'landing':
    default:
      return <LandingPage onNavigateToDashboard={handleViewReport} authState={authState} />;
  }
};

export default App;
