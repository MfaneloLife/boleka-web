// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "bolekaweb.firebaseapp.com",
  projectId: "bolekaweb",
  storageBucket: "bolekaweb.appspot.com",
  messagingSenderId: "930497779587",
  appId: "1:930497779587:web:a1b2c3d4e5f6g7h8i9j0",
  measurementId: "G-503791275"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;
