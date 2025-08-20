// -- RMK: The main landing page for user sign-in and file upload. Version 1.0
// -- FILE: frontend/src/pages/LandingPage.js

import React, { useState, useEffect } from 'react';
import { Upload, Download, Eye, CheckCircle, Loader } from 'lucide-react';
import { auth, db, storage, signInWithCustomToken, doc, setDoc, serverTimestamp, addDoc, collection, onSnapshot, ref, uploadBytesResumable } from '../services/firebase.js';

const LandingPage = ({ onNavigateToDashboard, authState }) => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [greeting, setGreeting] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('initial'); // 'initial', 'uploading', 'completed'
  const [processingStatus, setProcessingStatus] = useState('initial'); // 'initial', 'processing', 'completed'
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  const handleNameChange = (e) => setUserName(e.target.value);
  const handleEmailChange = (e) => setUserEmail(e.target.value);

  const handleUserSignIn = async (e) => {
    e.preventDefault();
    if (userName && userEmail) {
      try {
        // We need to get the initialAuthToken from the global scope, as it's provided by the environment
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        if (!initialAuthToken) throw new Error("Authentication token not found.");

        await signInWithCustomToken(auth, initialAuthToken);
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userDocRef, {
          name: userName,
          email: userEmail,
          lastSignIn: serverTimestamp(),
        }, { merge: true });
        // This state update is handled in App.js by onAuthStateChanged,
        // so we don't strictly need to call it here.
        // authState.setIsAuthenticated(true); 
      } catch (error) {
        console.error("Error signing in or storing user data:", error);
        alert("Sign-in failed. Please try again.");
      }
    } else {
      alert("Please enter your name and email.");
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

  useEffect(() => {
    if (processingStatus === 'processing' && authState.isAuthenticated && auth.currentUser) {
      const q = collection(db, 'users', auth.currentUser.uid, 'uploads');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "modified") {
            const docData = change.doc.data();
            if (docData.status === 'completed') {
              setProcessingStatus('completed');
            } else if (docData.status === 'error') {
              setProcessingStatus('error');
            }
          }
        });
      });
      return () => unsubscribe();
    }
  }, [processingStatus, authState.isAuthenticated]);
  
  const handleDownload = () => {
    alert('Placeholder: Initiating download of normalized data.');
  };

  const handleViewReport = () => {
    if (onNavigateToDashboard) {
      onNavigateToDashboard();
    }
  };

  const renderProgressCircle = () => {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (uploadProgress / 100) * circumference;

    return (
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle className="text-gray-300" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50%" cy="50%" />
          <circle className="text-emerald-500 transition-all duration-300 ease-in-out" strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r="45" cx="50%" cy="50%" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-800">
          {Math.round(uploadProgress)}%
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans p-4 flex flex-col items-center justify-center text-gray-800">
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md p-4 mb-8">
        <h1 className="text-3xl font-extrabold text-center">
          SAL Data Analysis Platform
        </h1>
      </div>

      <div className="w-full max-w-lg bg-gray-50 p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-200 flex flex-col items-center mt-20">
        {!authState.isAuthenticated ? (
          <form onSubmit={handleUserSignIn} className="w-full">
            <h2 className="text-xl font-semibold mb-6 text-center">Please sign in to continue</h2>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" id="name" value={userName} onChange={handleNameChange} placeholder="Enter your name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" required />
            </div>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" id="email" value={userEmail} onChange={handleEmailChange} placeholder="Enter your email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" required />
            </div>
            <button type="submit" className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
              Sign In
            </button>
          </form>
        ) : (
          <>
            <p className="text-2xl font-bold text-center mb-6">
              {greeting}, {userName}!
            </p>
            {uploadStatus === 'initial' && processingStatus === 'initial' && (
              <>
                <p className="text-gray-600 mb-6 text-center">
                  Please upload your Excel sales report (.xlsx) to begin data analysis.
                </p>
                <label htmlFor="file-upload" className="cursor-pointer w-full">
                  <div className="flex items-center justify-center px-8 py-4 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all duration-200 transform hover:-translate-y-1">
                    <Upload size={24} className="mr-3" />
                    <span className="text-lg font-semibold">
                      {selectedFile ? selectedFile.name : 'Select File'}
                    </span>
                  </div>
                  <input id="file-upload" type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" />
                </label>
                {selectedFile && (
                  <button onClick={handleUpload} className="mt-6 w-full flex items-center justify-center px-8 py-4 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-all duration-200 transform hover:-translate-y-1">
                    <span className="text-lg font-semibold">Start Upload</span>
                  </button>
                )}
              </>
            )}

            {uploadStatus === 'uploading' && (
              <div className="flex flex-col items-center">
                <p className="text-gray-700 mb-6 text-lg font-semibold">Uploading file...</p>
                {renderProgressCircle()}
              </div>
            )}

            {uploadStatus === 'completed' && processingStatus === 'processing' && (
              <div className="flex flex-col items-center">
                <p className="text-emerald-600 font-semibold text-2xl mb-4">
                  <CheckCircle size={32} className="inline-block mr-2" /> Upload Complete!
                </p>
                <p className="text-gray-700 mb-6 text-lg font-semibold">
                  Processing file...
                </p>
                <Loader size={64} className="animate-spin text-indigo-500" />
              </div>
            )}

            {processingStatus === 'completed' && (
              <>
                <p className="text-emerald-600 font-semibold text-2xl mb-4">
                  <CheckCircle size={32} className="inline-block mr-2" /> Normalization Complete!
                </p>
                <p className="text-gray-700 mb-6 text-center">
                  Your data is ready for download or analysis.
                </p>
                <div className="w-full flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-4">
                  <button onClick={handleDownload} className="flex-1 flex items-center justify-center px-6 py-3 bg-sky-500 text-white rounded-full shadow-lg hover:bg-sky-600 transition-all duration-200 transform hover:-translate-y-1">
                    <Download size={20} className="mr-3" />
                    <span className="text-base font-semibold">Download Normalized Data</span>
                  </button>
                  <button onClick={handleViewReport} className="flex-1 flex items-center justify-center px-6 py-3 bg-purple-500 text-white rounded-full shadow-lg hover:bg-purple-600 transition-all duration-200 transform hover:-translate-y-1">
                    <Eye size={20} className="mr-3" />
                    <span className="text-base font-semibold">View Report</span>
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <footer className="mt-12 text-gray-500 text-sm text-center">
        Developed by Ghanshyam Acharya & Gemini
      </footer>
    </div>
  );
};

export default LandingPage;
