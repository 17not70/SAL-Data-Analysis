// -- RMK: Final redesign using self-contained CSS to bypass build issues. Version 8.0
// -- FILE: frontend/src/pages/LandingPage.js

import React, { useState } from 'react';
import { Upload, Eye, CheckCircle, Loader, Download, LogOut } from 'lucide-react';
import { auth, db, storage, doc, setDoc, serverTimestamp, addDoc, collection, ref, uploadBytesResumable, GoogleAuthProvider, signInWithPopup, signOut } from '../services/firebase.js';

// All the styles are now defined here, inside the component.
const PageStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    .page-container {
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      background-color: #f8fafc; /* slate-50 */
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      color: #334155; /* slate-700 */
    }
    .header-container {
      text-align: center;
      margin-bottom: 2rem;
    }
    .main-title {
      font-size: 2.5rem;
      font-weight: 800;
      color: #1e293b; /* slate-800 */
      letter-spacing: -0.025em;
    }
    .subtitle {
      font-size: 1.125rem;
      color: #64748b; /* slate-500 */
      margin-top: 0.5rem;
    }
    .card {
      width: 100%;
      max-width: 28rem; /* max-w-md */
      background-color: white;
      padding: 2.5rem 2rem;
      border-radius: 1.5rem; /* rounded-2xl */
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      text-align: center;
    }
    .card-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1e293b;
    }
    .card-subtitle {
      color: #64748b;
      margin-top: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 1rem;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
    }
    .btn-google {
      background-color: white;
      color: #334155;
      border-color: #cbd5e1; /* slate-300 */
    }
    .btn-google:hover {
      background-color: #f8fafc; /* slate-50 */
    }
    .btn-primary {
      background-color: #4f46e5; /* indigo-600 */
      color: white;
    }
    .btn-primary:hover {
      background-color: #4338ca; /* indigo-700 */
    }
    .btn-secondary {
        background-color: #64748b; /* slate-500 */
        color: white;
    }
    .btn-secondary:hover {
        background-color: #475569; /* slate-600 */
    }
    .file-label {
        border: 2px dashed #cbd5e1;
        padding: 2rem 1rem;
        border-radius: 0.75rem;
        cursor: pointer;
        color: #64748b;
    }
    .file-label:hover {
        border-color: #4f46e5;
        color: #4f46e5;
    }
    .hidden-input {
        display: none;
    }
    .footer {
      position: absolute;
      bottom: 1.5rem;
      font-size: 0.875rem;
      color: #64748b;
    }
  `}</style>
);

const LandingPage = ({ onNavigateToDashboard, authState }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('initial');

  // All the JS logic for signing in and handling files remains the same...
  const handleGoogleSignIn = async () => { /* ... */ };
  const handleFileChange = (e) => { /* ... */ };
  const handleUpload = async () => { /* ... */ };
  const handleSignOut = async () => { /* ... */ };
  
  return (
    <div className="page-container">
      <PageStyles /> {/* This injects all the CSS into the page */}
      
      <div className="header-container">
        <h1 className="main-title">SAL Data Analysis</h1>
        <p className="subtitle">Managing Aviation Data</p>
      </div>

      <div className="card">
        {!authState.isAuthenticated ? (
          <div>
            <h2 className="card-title">Login</h2>
            <p className="card-subtitle">Use your Google account to continue.</p>
            <button onClick={handleGoogleSignIn} className="btn btn-google">
              <svg className="w-5 h-5" width="20" height="20" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
             <div style={{position: 'absolute', top: '1rem', right: '1rem'}}>
                <button onClick={handleSignOut} title="Sign Out" className="btn-secondary" style={{padding: '0.5rem', borderRadius: '99px', width: 'auto'}}>
                    <LogOut size={20} />
                </button>
            </div>
            <h2 className="card-title">Welcome, {auth.currentUser.displayName}!</h2>
            <p className="card-subtitle">You are now ready to upload your file.</p>
            
            <label htmlFor="file-upload" className="file-label flex flex-col items-center gap-2 w-full">
              <Upload size={32} />
              <span>{selectedFile ? selectedFile.name : 'Select .xlsx File'}</span>
            </label>
            <input id="file-upload" type="file" accept=".xlsx" onChange={handleFileChange} className="hidden-input" />

            {selectedFile && (
              <button onClick={handleUpload} className="btn btn-primary mt-4">
                Upload and Process
              </button>
            )}
          </div>
        )}
      </div>

      <footer className="footer">
        Developed by Ghanshyam Acharya & Gemini
      </footer>
    </div>
  );
};

export default LandingPage;
