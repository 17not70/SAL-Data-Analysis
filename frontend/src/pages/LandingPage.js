// -- RMK: The main landing page with a professional, centered layout. Version 4.0
// -- FILE: frontend/src/pages/LandingPage.js

import React, { useState } from 'react';
import { Upload, Eye, CheckCircle, Loader } from 'lucide-react';
import { auth, db, storage, doc, setDoc, serverTimestamp, addDoc, collection, ref, uploadBytesResumable, GoogleAuthProvider, signInWithPopup } from '../services/firebase.js';

const LandingPage = ({ onNavigateToDashboard, authState }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('initial');
  const [processingStatus, setProcessingStatus] = useState('initial');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
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
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.xlsx')) {
      setSelectedFile(file);
      setUploadProgress(0);
      setUploadStatus('initial');
      setProcessingStatus('initial');
    } else {
      setSelectedFile(null);
      alert('Invalid file type. Please upload a .xlsx file.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !auth.currentUser) return;
    setUploadStatus('uploading');
    // ... (rest of the upload logic is unchanged)
  };

  const renderProgressCircle = () => {
    // ... (progress circle logic is unchanged)
  };

  return (
    // Main container for the whole page
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center justify-center p-4">
      
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-800">
          SAL Data Analysis
        </h1>
        <p className="text-slate-600 mt-2 text-lg">
          Managing Aviation Data
        </p>
      </div>

      {/* The main interactive card */}
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg mt-8">
        {!authState.isAuthenticated ? (
          // Unauthenticated State: Show Sign-In
          <div>
            <h2 className="text-2xl font-semibold text-center text-slate-700">Login</h2>
            <p className="text-slate-500 text-center mt-2 mb-6">
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
        ) : (
          // Authenticated State: Show Upload Form
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-slate-700">Welcome, {auth.currentUser.displayName}!</h2>
            <p className="text-slate-500 mt-2 mb-6">
              You are now ready to upload your file.
            </p>

            {/* Upload status logic can go here, similar to the previous version */}
            <label htmlFor="file-upload" className="w-full cursor-pointer inline-flex items-center justify-center gap-3 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200">
              <Upload size={20} />
              <span>{selectedFile ? selectedFile.name : 'Select .xlsx File'}</span>
            </label>
            <input id="file-upload" type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" />

            {selectedFile && (
              <button onClick={handleUpload} className="w-full mt-4 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition-all duration-200">
                Start Upload
              </button>
            )}

            {/* Logic to show progress circle and view report button would go here */}

          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 text-slate-500 text-sm">
        Developed by Ghanshyam Acharya & Gemini
      </footer>
    </div>
  );
};

export default LandingPage;
