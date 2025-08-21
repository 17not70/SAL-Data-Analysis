// -- RMK: A simplified test version of the landing page for debugging. Version 7.0
// -- FILE: frontend/src/pages/LandingPage.js

import React from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../services/firebase.js';

const LandingPage = () => {
  // We are temporarily removing all complex state and logic for this test.

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign-in error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col items-center justify-center p-4 antialiased">
      <div className="w-full max-w-lg mx-auto text-center">
        
        {/* The headers that are already rendering correctly */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
            SAL Data Analysis
          </h1>
          <p className="text-slate-600 mt-2 text-lg">
            Managing Aviation Data
          </p>
        </div>

        {/* The Card we are testing */}
        <div className="bg-white p-8 rounded-2xl shadow-lg transition-all">
          <div>
            <h2 className="text-2xl font-semibold text-slate-700">Login</h2>
            <p className="text-slate-500 mt-2 mb-6">
              Use your Google account to access the dashboard.
            </p>
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-slate-300 text-base font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-all duration-200"
            >
              <svg className="w-5 h-5" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google
            </button>
          </div>
        </div>

      </div>
      
      {/* The footer that is already rendering correctly */}
      <footer className="absolute bottom-6 text-slate-500 text-sm">
        Developed by Ghanshyam Acharya & Gemini
      </footer>
    </div>
  );
};

export default LandingPage;
