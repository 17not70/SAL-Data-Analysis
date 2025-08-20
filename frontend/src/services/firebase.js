// -- RMK: Centralized Firebase configuration and services. Version 1.0
// -- FILE: frontend/src/services/firebase.js

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// -- REMARK: Firebase configuration. This will be automatically provided by the environment.
const firebaseConfig = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG);
// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Export Firebase functions to be used in other files
export {
  signInWithCustomToken,
  onAuthStateChanged,
  collection,
  doc,
  onSnapshot,
  addDoc,
  serverTimestamp,
  setDoc,
  ref,
  uploadBytesResumable,
  getDownloadURL
};
