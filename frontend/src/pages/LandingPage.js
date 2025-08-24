// -- RMK: Final version with correct export. Version 10.1
// -- FILE: frontend/src/pages/LandingPage.js

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

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { name: user.displayName, email: user.email, lastSignIn: serverTimestamp() }, { merge: true });
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
    const docId = selectedFile.name.replace('.xlsx', '');
    setUploadStatus('uploading');
    setProcessingStatus('initial');

    const storageRef = ref(storage, `raw-data-uploads/${selectedFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);
    
    await setDoc(doc(db, 'processed_files', docId), {
        status: 'uploading',
        fileName: selectedFile.name,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
    });

    uploadTask.on('state_changed',
      (snapshot) => { setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100); },
      (error) => { console.error("Upload failed", error); setUploadStatus('error'); },
      async () => {
        setUploadStatus('completed');
        setProcessingStatus('processing');
        await setDoc(doc(db, 'processed_files', docId), { status: 'processing' }, { merge: true });
      }
    );
  };
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setSelectedFile(null);
      setUploadStatus('initial');
      setProcessingStatus('initial');
    } catch (error) { console.error("Error signing out:", error); }
  };
  
  const handleDownload = () => { alert("Download function placeholder."); };

  const renderProgressCircle = () => {
    const circumference = 2 * Math.PI * 30;
    const offset = circumference - (uploadProgress / 100) * circumference;
    return (
      <div className="relative w-16 h-16">
        <svg className="w-full h-full transform -rotate-90">
          <circle className="text-slate-200" strokeWidth="8" stroke="currentColor" fill="transparent" r="30" cx="32" cy="32" />
          <circle className="text-indigo-600 transition-all duration-300 ease-in-out" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r="30" cx="32" cy="32" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-700">
          {Math.round(uploadProgress)}%
        </span>
      </div>
    );
  };

  const renderAuthenticatedView = () => {
    if (uploadStatus === 'uploading') {
      return ( <div className="flex flex-col items-center gap-4"> <p className="text-slate-600 text-lg font-semibold">Uploading file...</p> {renderProgressCircle()} </div> );
    }
    if (uploadStatus === 'completed' && processingStatus === 'processing') {
      return ( <div className="flex flex-col items-center gap-4 text-center"> <CheckCircle size={40} className="text-emerald-500" /> <h3 className="text-xl font-semibold text-slate-800">Upload Complete!</h3> <p className="text-slate-500">Normalization in process...</p> <Loader size={28} className="animate-spin text-indigo-600" /> </div> );
    }
    if (processingStatus === 'completed') {
        return ( <div className="flex flex-col items-center gap-4 text-center"> <CheckCircle size={40} className="text-emerald-500" /> <h3 className="text-xl font-semibold text-slate-800">Normalization Complete!</h3> <p className="text-slate-500">Your data is ready for analysis.</p> <div className="w-full flex flex-col sm:flex-row gap-3 mt-4"> <button onClick={handleDownload} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 transition-all duration-200"> <Download size={18} /> Download CSV </button> <button onClick={onNavigateToDashboard} className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200"> <Eye size={18} /> View Report </button> </div> </div> );
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
                <svg className="w-5 h-5" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.9 1.62-3.03 0-5.49-2.3-5.49-5.09s2.46-5.09 5.49-5.09c1.5 0 2.73.45 3.57 1.2l-2.06 2.06c-.68-.62-1.56-1.02-2.8-1.02-2.28 0-4.11 1.77-4.11 4.1s1.83 4.1 4.11 4.1c2.61 0 3.74-1.92 3.87-2.88h-3.87v-3.28h7.84z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path></svg>
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

export default LandingPage; // This line was missing.
