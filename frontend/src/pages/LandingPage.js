// -- RMK: Final version with corrected spinner animation. Version 9.1
// -- FILE: frontend/src/pages/LandingPage.js

import React, { useState, useEffect } from 'react';
import { Upload, Eye, CheckCircle, Loader, Download, LogOut } from 'lucide-react';
import { auth, db, storage, doc, setDoc, serverTimestamp, addDoc, collection, onSnapshot, ref, uploadBytesResumable, GoogleAuthProvider, signInWithPopup, signOut } from '../services/firebase.js';

const PageStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    /* ADDED KEYFRAMES FOR SPINNER */
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .spinner {
      animation: spin 1s linear infinite;
    }
    /* END OF ADDED CODE */

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
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .header-container { text-align: center; margin-bottom: 2rem; }
    .main-title { font-size: 2.5rem; font-weight: 800; color: #1e293b; letter-spacing: -0.025em; }
    .subtitle { font-size: 1.125rem; color: #64748b; margin-top: 0.5rem; }
    .card { width: 100%; max-width: 28rem; background-color: white; padding: 2rem; border-radius: 1.5rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); text-align: center; position: relative; }
    .card-title { font-size: 1.5rem; font-weight: 600; color: #1e293b; }
    .card-subtitle { color: #64748b; margin-top: 0.5rem; margin-bottom: 1.5rem; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.75rem; width: 100%; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 600; font-size: 1rem; border: 1px solid transparent; cursor: pointer; transition: all 0.2s ease-in-out; }
    .btn-google { background-color: white; color: #334155; border-color: #cbd5e1; }
    .btn-google:hover { background-color: #f8fafc; }
    .btn-primary { background-color: #4f46e5; color: white; }
    .btn-primary:hover { background-color: #4338ca; }
    .btn-secondary { background-color: #0ea5e9; color: white; }
    .btn-secondary:hover { background-color: #0284c7; }
    .file-label { border: 2px dashed #e2e8f0; padding: 2rem 1rem; border-radius: 0.75rem; cursor: pointer; color: #64748b; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem;}
    .file-label:hover { border-color: #4f46e5; color: #4f46e5; }
    .hidden-input { display: none; }
    .footer { position: absolute; bottom: 1.5rem; font-size: 0.875rem; color: #94a3b8; }
    .signout-btn { position: absolute; top: 1rem; right: 1rem; padding: 0.5rem; border-radius: 99px; background-color: #e2e8f0; color: #64748b; border: none; cursor: pointer; line-height: 0; }
    .signout-btn:hover { background-color: #cbd5e1; }
  `}</style>
);

const LandingPage = ({ onNavigateToDashboard, authState }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('initial');
  const [processingStatus, setProcessingStatus] = useState('initial');
  const [uploadProgress, setUploadProgress] = useState(0);

  // This effect listens for the backend to finish processing
  useEffect(() => {
    if (uploadStatus === 'completed' && authState.isAuthenticated && auth.currentUser) {
        // Find the latest upload document for this user that is "processing"
        const userUploadsRef = collection(db, 'users', auth.currentUser.uid, 'uploads');
        const q = query(userUploadsRef, orderBy('createdAt', 'desc'), limit(1));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const latestUpload = snapshot.docs[0].data();
                if (latestUpload.status === 'completed' || latestUpload.status === 'error') {
                    // Assuming the backend updates the user's upload record
                    setProcessingStatus(latestUpload.status);
                }
            }
        });
        return () => unsubscribe(); // Cleanup listener
    }
  }, [uploadStatus, authState.isAuthenticated]);
  
  const handleGoogleSignIn = async () => { /* Logic unchanged */ };
  const handleFileChange = (e) => { /* Logic unchanged */ };
  const handleUpload = async () => { /* Logic unchanged */ };
  const handleSignOut = async () => { /* Logic unchanged */ };

  const renderAuthenticatedView = () => {
    if (uploadStatus === 'uploading') { /* JSX unchanged */ }

    // State 2: After Upload, During Processing
    if (uploadStatus === 'completed' && processingStatus === 'processing') {
      return (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center'}}>
            <CheckCircle size={40} style={{color: '#10b981'}} />
            <h3 className="card-title">Upload Complete!</h3>
            <p style={{color: '#475569'}}>Normalization in process...</p>
            {/* CORRECTED SPINNER */}
            <Loader size={28} className="spinner" style={{color: '#4f46e5'}} />
        </div>
      );
    }
    
    if (processingStatus === 'completed') { /* JSX unchanged */ }

    // Default State JSX is unchanged
    return (
      <div style={{textAlign: 'center'}}>
        { /* ... */ }
      </div>
    );
  };

  // The main return with the full JSX structure is unchanged...
  return (
    <div className="page-container">
      { /* ... */ }
    </div>
  );
};

export default LandingPage;
