import React, { useState, useEffect } from 'react';
import { Upload, Eye, CheckCircle, Loader, Download, LogOut } from 'lucide-react';
import { auth, db, storage, doc, setDoc, serverTimestamp, addDoc, collection, onSnapshot, ref, uploadBytesResumable, GoogleAuthProvider, signInWithPopup, signOut } from '../services/firebase.js';

const LandingPage = ({ onNavigateToDashboard, authState }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('initial');
  const [processingStatus, setProcessingStatus] = useState('initial');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!auth.currentUser || uploadStatus !== 'completed' || !selectedFile) return;
    const docId = selectedFile.name.replace('.xlsx', '');
    const docRef = doc(db, 'processed_files', docId);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'completed' || data.status === 'error') {
          setProcessingStatus(data.status);
        }
      }
    });
    return () => unsubscribe();
  }, [uploadStatus, authState.isAuthenticated, selectedFile]);

  const handleGoogleSignIn = async () => { /* ... (Unchanged) ... */ };
  const handleFileChange = (e) => { /* ... (Unchanged) ... */ };
  const handleUpload = async () => { /* ... (Unchanged) ... */ };
  const handleSignOut = async () => { /* ... (Unchanged) ... */ };
  const handleDownload = () => { alert("Download function placeholder."); };
  const renderProgressCircle = () => { /* ... (Unchanged) ... */ };

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
          <CheckCircle size={40} className="text-emerald-500" />
          <h3 className="text-xl font-semibold text-slate-800">Upload Complete!</h3>
          <p className="text-slate-500">Normalization in process...</p>
          <Loader size={28} className="animate-spin text-indigo-600" />
        </div>
      );
    }
    if (processingStatus === 'completed') {
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle size={40} className="text-emerald-500" />
          <h3 className="text-xl font-semibold text-slate-800">Normalization Complete!</h3>
          <p className="text-slate-500">Your data is ready for analysis.</p>
          <div className="w-full flex flex-col sm:flex-row gap-3 mt-4">
            <button onClick={handleDownload} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 transition-all duration-200">
              <Download size={18} /> Download CSV
            </button>
            <button onClick={onNavigateToDashboard} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200">
              <Eye size={18} /> View Report
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="w-full text-center">
        <h2 className="text-xl font-semibold text-slate-800">Welcome, {auth.currentUser?.displayName}!</h2>
        <p className="text-slate-500 mt-2 mb-6">Please select your Excel sales report to begin.</p>
        <label htmlFor="file-upload" className={`w-full cursor-pointer flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-lg transition-all duration-200 ${selectedFile ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 text-slate-500 hover:border-indigo-500 hover:text-indigo-500'}`}>
          <Upload size={32} />
          <span>{selectedFile ? selectedFile.name : 'Select .xlsx File'}</span>
        </label>
        <input id="file-upload" type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" />
        {selectedFile && (
          <button onClick={handleUpload} className="w-full mt-4 flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200">
            Upload and Process
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col items-center justify-center p-4 antialiased">
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">SAL Data Analysis</h1>
          <p className="text-slate-600 mt-2 text-lg">Managing Aviation Data</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-lg relative">
          {authState.isAuthenticated && (
            <button onClick={handleSignOut} title="Sign Out" className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
              <LogOut size={20} />
            </button>
          )}
          {!authState.isAuthenticated ? (
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-slate-800">Login</h2>
              <p className="text-slate-500 mt-2 mb-6">Use your Google account to continue.</p>
              <button onClick={handleGoogleSignIn} className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-slate-300 text-base font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-all duration-200">
                <svg className="w-5 h-5" /* SVG content */ ></svg>
                Sign in with Google
              </button>
            </div>
          ) : (
            renderAuthenticatedView()
          )}
        </div>
      </div>
      <footer className="absolute bottom-6 text-slate-500 text-sm">
        Developed by Ghanshyam Acharya & Gemini
      </footer>
    </div>
  );
};
