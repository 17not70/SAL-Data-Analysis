// -- RMK: The main landing page with Google Sign-in. Version 2.0
// -- FILE: frontend/src/pages/LandingPage.js

import React, { useState, useEffect } from 'react';
import { Upload, Download, Eye, CheckCircle, Loader } from 'lucide-react';
import { auth, db, storage, doc, setDoc, serverTimestamp, addDoc, collection, onSnapshot, ref, uploadBytesResumable, GoogleAuthProvider, signInWithPopup } from '../services/firebase.js';

// --- NEW: Google Sign-In Logic ---
const handleGoogleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user; // Get user info from Google

    // Save user's name and email to Firestore automatically
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      name: user.displayName,
      email: user.email,
      lastSignIn: serverTimestamp(),
    }, { merge: true });

  } catch (error) {
    console.error("Error during Google sign-in:", error);
    alert("Sign-in with Google failed. Please try again.");
  }
};

const LandingPage = ({ onNavigateToDashboard, authState }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('initial');
  const [processingStatus, setProcessingStatus] = useState('initial');
  const [uploadProgress, setUploadProgress] = useState(0);

  // This effect will run when authState changes after a successful sign-in
  useEffect(() => {
    if (authState.isAuthenticated) {
      // Any logic you want to run after sign-in can go here
    }
  }, [authState.isAuthenticated]);

  const handleFileChange = (e) => {
    // ... (File change logic remains the same)
  };
  
  const handleUpload = async () => {
    // ... (Upload logic remains the same)
  };

  // --- NEW, SIMPLIFIED LAYOUT ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-4">
          Welcome to the SAL Data Analysis Platform
        </h1>
        <p className="text-lg text-gray-600 mb-12">
          Please sign in with your Google account to continue.
        </p>

        <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg">
          {!authState.isAuthenticated ? (
            // User is NOT signed in, show the sign-in button
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-3" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path fill="white" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.9 1.62-3.03 0-5.49-2.3-5.49-5.09s2.46-5.09 5.49-5.09c1.5 0 2.73.45 3.57 1.2l-2.06 2.06c-.68-.62-1.56-1.02-2.8-1.02-2.28 0-4.11 1.77-4.11 4.1s1.83 4.1 4.11 4.1c2.61 0 3.74-1.92 3.87-2.88h-3.87v-3.28h7.84z"/></svg>
              Sign in with Google
            </button>
          ) : (
            // User IS signed in, show the upload functionality
            <div>
               {/* Upload logic will go here once the user is authenticated */}
               <p className="text-xl font-bold">Welcome, {auth.currentUser.displayName}!</p>
               <p className="text-gray-600 mt-2">You are now ready to upload your file.</p>
               {/* We can add the upload form here later */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
