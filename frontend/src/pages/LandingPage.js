// -- RMK: The main landing page with Google Sign-in and Upload functionality. Version 3.0
// -- FILE: frontend/src/pages/LandingPage.js

import React, { useState, useEffect } from 'react';
import { Upload, Download, Eye, CheckCircle, Loader } from 'lucide-react';
import { auth, db, storage, doc, setDoc, serverTimestamp, addDoc, collection, onSnapshot, ref, uploadBytesResumable, GoogleAuthProvider, signInWithPopup } from '../services/firebase.js';

const LandingPage = ({ onNavigateToDashboard, authState }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('initial'); // 'initial', 'uploading', 'completed'
  const [processingStatus, setProcessingStatus] = useState('initial'); // 'initial', 'processing', 'completed'
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-gray-200 flex flex-col items-center">
        {!authState.isAuthenticated ? (
          <>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-2 text-center">
              Welcome to the SAL Data Analysis Platform
            </h1>
            <p className="text-gray-600 mb-8 text-center">
              Please sign in with your Google account to continue.
            </p>
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-3" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Google</title><path fill="white" d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.9 1.62-3.03 0-5.49-2.3-5.49-5.09s2.46-5.09 5.49-5.09c1.5 0 2.73.45 3.57 1.2l-2.06 2.06c-.68-.62-1.56-1.02-2.8-1.02-2.28 0-4.11 1.77-4.11 4.1s1.83 4.1 4.11 4.1c2.61 0 3.74-1.92 3.87-2.88h-3.87v-3.28h7.84z"/></svg>
              Sign in with Google
            </button>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-center mb-6">
              Welcome, {auth.currentUser.displayName}!
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

            {processingStatus === 'completed' && (
              <div className="flex flex-col items-center">
                <p className="text-emerald-600 font-semibold text-2xl mb-4">
                  <CheckCircle size={32} className="inline-block mr-2" /> Normalization Complete!
                </p>
                <button onClick={onNavigateToDashboard} className="flex-1 flex items-center justify-center px-6 py-3 bg-purple-500 text-white rounded-full shadow-lg hover:bg-purple-600 transition-all duration-200 transform hover:-translate-y-1">
                  <Eye size={20} className="mr-3" />
                  <span className="text-base font-semibold">View Report</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
