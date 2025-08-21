// -- RMK: Centralized Firebase configuration and services. Version 1.2
// -- FILE: frontend/src/services/firebase.js

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'; // Added signOut
import { getFirestore, collection, doc, onSnapshot, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const firebaseConfig = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG);

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

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
  getDownloadURL,
  GoogleAuthProvider,
  signInWithPopup,
  signOut // Export new sign-out method
};
