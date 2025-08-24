import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage.js';
import DashboardPage from './pages/DashboardPage.js';
import { auth, onAuthStateChanged } from './services/firebase.js';

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    isLoading: true, // Add a loading state
  });
  const [currentPage, setCurrentPage] = useState('landing');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState({ isAuthenticated: !!user, user, isLoading: false });
    });
    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  // Show a loading indicator while Firebase is initializing
  if (authState.isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <p>Loading Application...</p>
      </div>
    );
  }

  const handleViewReport = () => setCurrentPage('dashboard');
  const handleNavigateToLanding = () => setCurrentPage('landing');

  switch (currentPage) {
    case 'dashboard':
      return authState.isAuthenticated 
        ? <DashboardPage onNavigateToLanding={handleNavigateToLanding} /> 
        : <LandingPage onNavigateToDashboard={handleViewReport} authState={authState} />;
    default:
      return <LandingPage onNavigateToDashboard={handleViewReport} authState={authState} />;
  }
}

export default App;
