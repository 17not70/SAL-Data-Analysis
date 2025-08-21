// Final comment to trigger a fresh build
// -- RMK: Main application router. Cleaned and finalized. Version 2.1
// -- FILE: frontend/src/App.js

import React, { useState, useEffect } from 'react';

// Import our page components
import LandingPage from './pages/LandingPage.js';
import DashboardPage from './pages/DashboardPage.js';

// Import only the Firebase services needed for authentication state
import { auth, onAuthStateChanged } from './services/firebase.js';

const App = () => {
  const [authState, setAuthState] = useState({ isAuthenticated: false, user: null });
  const [currentPage, setCurrentPage] = useState('landing');

  // Listen for authentication changes and update the state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState({ isAuthenticated: !!user, user });
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const handleViewReport = () => setCurrentPage('dashboard');
  const handleNavigateToLanding = () => setCurrentPage('landing');

  // The main router logic
  switch (currentPage) {
    case 'dashboard':
      // Show dashboard only if authenticated, otherwise show landing page
      return authState.isAuthenticated 
        ? <DashboardPage onNavigateToLanding={handleNavigateToLanding} /> 
        : <LandingPage onNavigateToDashboard={handleViewReport} authState={authState} />;
    case 'landing':
    default:
      return <LandingPage onNavigateToDashboard={handleViewReport} authState={authState} />;
  }
};

export default App;
