// -- RMK: Final version with complete UX flow and all functionality. Version 9.0
// -- FILE: frontend/src/pages/LandingPage.js

import React, { useState, useEffect } from 'react';
import { Upload, Eye, CheckCircle, Loader, Download, LogOut } from 'lucide-react';
import { auth, db, storage, doc, setDoc, serverTimestamp, addDoc, collection, onSnapshot, ref, uploadBytesResumable, GoogleAuthProvider, signInWithPopup, signOut } from '../services/firebase.js';

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
    .btn-secondary { background-color: #38bdf8; color: white; }
    .btn-secondary:hover { background-color: #0ea5e9; }
    .file-label { border: 2px dashed #e2e8f0; padding: 2rem 1rem; border-radius: 0.75rem; cursor: pointer; color: #64748b; }
    .file-label:hover { border-color: #4f46e5; color: #4f46e5; }
    .hidden-input { display: none; }
    .footer { position: absolute; bottom: 1.5rem; font-size: 0.875rem; color: #94a3b8; }
    .signout-btn { position: absolute; top: 1rem; right: 1rem; padding: 0.5rem; border-radius: 99px; background-color: #e2e8f0; color: #64748b; border: none; cursor: pointer; }
    .signout-btn:hover { background-color: #cbd5e1; }
  `}</style>
);

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
    } else {
      setSelectedFile(null);
      if (file) alert('Invalid file type. Please upload a .xlsx file.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !auth.currentUser) return;
    setUploadStatus('uploading');
    setProcessingStatus('initial');

    const storageRef = ref(storage, `raw-data-uploads/${selectedFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const docRef = await addDoc(collection(userDocRef, 'uploads'), {
      fileName: selectedFile.name,
      status: 'uploading',
      createdAt: serverTimestamp(),
    });

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Upload failed", error);
        setUploadStatus('error');
      },
      () => {
        setUploadStatus('completed');
        setProcessingStatus('processing');
        setDoc(doc(db, 'processed_files', docRef.id), {
          status: 'processing',
          gcsPath: `gs://${storageRef.bucket}/${storageRef.fullPath}`,
        }, { merge: true });
      }
    );
  };
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setSelectedFile(null);
      setUploadStatus('initial');
      setProcessingStatus('initial');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const renderProgressCircle = () => {
    const circumference = 2 * Math.PI * 30; // smaller radius
    const offset = circumference - (uploadProgress / 100) * circumference;
    return (
      <div style={{width: '72px', height: '72px', position: 'relative'}}>
        <svg style={{width: '100%', height: '100%', transform: 'rotate(-90deg)'}}>
          <circle style={{color: '#e2e8f0'}} strokeWidth="8" stroke="currentColor" fill="transparent" r="30" cx="36" cy="36" />
          <circle style={{color: '#4f46e5', transition: 'stroke-dashoffset 0.3s'}} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r="30" cx="36" cy="36" />
        </svg>
        <span style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '600', color: '#1e293b'}}>
          {Math.round(uploadProgress)}%
        </span>
      </div>
    );
  };

  const renderAuthenticatedView = () => {
    if (uploadStatus === 'uploading') {
      return (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'}}>
          <p style={{color: '#475569', fontSize: '1.125rem', fontWeight: '600'}}>Uploading file...</p>
          {renderProgressCircle()}
        </div>
      );
    }

    if (uploadStatus === 'completed' && processingStatus === 'processing') {
      return (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center'}}>
            <CheckCircle size={40} style={{color: '#10b981'}} />
            <h3 className="card-title">Upload Complete!</h3>
            <p style={{color: '#475569'}}>Normalization in process...</p>
            <Loader size={28} style={{animation: 'spin 1s linear infinite', color: '#4f46e5'}} />
        </div>
      );
    }
    
    if (processingStatus === 'completed') {
        return (
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center'}}>
                <CheckCircle size={40} style={{color: '#10b981'}} />
                <h3 className="card-title">Normalization Complete!</h3>
                <p className="card-subtitle">Your data is ready for analysis.</p>
                <div style={{width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                    <button onClick={() => alert("Download placeholder")} className="btn btn-secondary">
                        <Download size={20} />
                        Download CSV
                    </button>
                    <button onClick={onNavigateToDashboard} className="btn btn-primary">
                        <Eye size={20} />
                        View Report
                    </button>
                </div>
            </div>
        );
    }

    return (
      <div style={{textAlign: 'center'}}>
        <h2 className="card-title">Welcome, {auth.currentUser.displayName}!</h2>
        <p className="card-subtitle">Please select your Excel sales report to begin.</p>
        
        <label htmlFor="file-upload" className="file-label flex flex-col items-center justify-center gap-2 w-full">
          <Upload size={24} />
          <span>{selectedFile ? selectedFile.name : 'Select .xlsx File'}</span>
        </label>
        <input id="file-upload" type="file" accept=".xlsx" onChange={handleFileChange} className="hidden-input" />

        {selectedFile && (
          <button onClick={handleUpload} className="btn btn-primary" style={{marginTop: '1rem'}}>
            Upload and Process
          </button>
        )}
      </div>
    );
  };


  return (
    <div className="page-container">
      <PageStyles />
      
      <div className="header-container">
        <h1 className="main-title">SAL Data Analysis</h1>
        <p className="subtitle">Managing Aviation Data</p>
      </div>

      <div className="card">
        {authState.isAuthenticated && (
            <button onClick={handleSignOut} title="Sign Out" className="signout-btn">
                <LogOut size={20} />
            </button>
        )}

        {!authState.isAuthenticated ? (
          <div>
            <h2 className="card-title">Login</h2>
            <p className="card-subtitle">Use your Google account to continue.</p>
            <button onClick={handleGoogleSignIn} className="btn btn-google">
              <svg width="20" height="20" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google
            </button>
          </div>
        ) : (
          renderAuthenticatedView()
        )}
      </div>

      <footer className="footer">
        Developed by Ghanshyam Acharya & Gemini
      </footer>
    </div>
  );
};

export default LandingPage;
