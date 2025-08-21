// -- RMK: The main landing page with a complete, multi-stage upload flow. Version 5.1 (Corrected)
// -- FILE: frontend/src/pages/LandingPage.js

import React, { useState } from 'react';
import { Upload, Eye, CheckCircle, Loader, Download } from 'lucide-react';
import { auth, db, storage, doc, setDoc, serverTimestamp, addDoc, collection, onSnapshot, ref, uploadBytesResumable, GoogleAuthProvider, signInWithPopup } from '../services/firebase.js';

const LandingPage = ({ onNavigateToDashboard, authState }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('initial'); // 'initial', 'uploading', 'completed', 'error'
  const [processingStatus, setProcessingStatus] = useState('initial'); // 'initial', 'processing', 'completed', 'error'
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
          processedFileName: '',
        }, { merge: true });
      }
    );
  };
  
  const handleDownload = () => {
    alert("Placeholder: Download CSV function.");
  };

  const renderProgressCircle = () => {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (uploadProgress / 100) * circumference;
    return (
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle className="text-slate-300" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50%" cy="50%" />
          <circle className="text-blue-600 transition-all duration-300 ease-in-out" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r="45" cx="50%" cy="50%" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-slate-700">
          {Math.round(uploadProgress)}%
        </span>
      </div>
    );
  };

  const renderAuthenticatedView = () => {
    if (uploadStatus === 'uploading') {
      return (
        <div className="flex flex-col items-center gap-4">
          <p className="text-slate-600 text-lg font-semibold">Uploading file...</p>
          {renderProgressCircle()}
        </div>
      );
    }

    if (uploadStatus === 'completed' && processingStatus === 'processing') {
      return (
        <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle size={48} className="text-emerald-500" />
            <h3 className="text-xl font-semibold text-slate-700">Upload Complete!</h3>
            <p className="text-slate-600 text-lg">Normalization in process...</p>
            <Loader size={32} className="animate-spin text-blue-600" />
        </div>
      );
    }
    
    if (processingStatus === 'completed') {
        return (
            <div className="flex flex-col items-center gap-4 text-center">
                <CheckCircle size={48} className="text-emerald-500" />
                <h3 className="text-xl font-semibold text-slate-700">Normalization Complete!</h3>
                <p className="text-slate-500">Your data is ready for analysis.</p>
                <div className="w-full flex flex-col sm:flex-row gap-4 mt-4">
                    <button onClick={handleDownload} className="w-full flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 transition-all duration-200">
                        <Download size={20} />
                        Download CSV
                    </button>
                    <button onClick={onNavigateToDashboard} className="w-full flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200">
                        <Eye size={20} />
                        View Report
                    </button>
                </div>
            </div>
        );
    }

    return (
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-slate-700">Welcome, {auth.currentUser.displayName}!</h2>
        <p className="text-slate-500 mt-2 mb-6">
          Please select your Excel sales report to begin.
        </p>
        
        <label htmlFor="file-upload" className={`w-full cursor-pointer inline-flex items-center justify-center gap-3 px-6 py-3 border text-base font-medium rounded-md transition-all duration-200 ${selectedFile ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>
          <Upload size={20} />
          <span>{selectedFile ? selectedFile.name : 'Select .xlsx File'}</span>
        </label>
        <input id="file-upload" type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" />

        {selectedFile && (
          <button onClick={handleUpload} className="w-full mt-4 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200">
            Upload and Process
          </button>
        )}
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-800">
          SAL Data Analysis
        </h1>
        <p className="text-slate-600 mt-2 text-lg">
          Managing Aviation Data
        </p>
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        {!authState.isAuthenticated ? (
          <div>
            <h2 className="text-2xl font-semibold text-center text-slate-700">Login</h2>
            <p className="text-slate-500 text-center mt-2 mb-6">
              Use your Google account to access the dashboard.
            </p>
            <button onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-slate-300 text-base font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-all duration-200">
              <svg className="w-5 h-5" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google
            </button>
          </div>
        ) : (
          renderAuthenticatedView()
        )}
      </div>

      <footer className="absolute bottom-4 text-slate-500 text-sm">
        Developed by Ghanshyam Acharya & Gemini
      </footer>
    </div>
  );
};

export default LandingPage;
