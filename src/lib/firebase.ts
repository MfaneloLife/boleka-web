"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBn3tVcJVv6TVeElo3pjap__plXPllYoOE",
  authDomain: "bolekaweb.firebaseapp.com",
  projectId: "bolekaweb",
  storageBucket: "bolekaweb.firebasestorage.app",
  messagingSenderId: "930497779587",
  appId: "1:930497779587:web:3a57bd7a5a77a7a90608b6",
  measurementId: "G-CHPM9YS2RG"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Initialize analytics in browser environment only
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.error('Analytics initialization error:', error);
  }
}

// Initialize providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export { auth, googleProvider, facebookProvider, analytics };
