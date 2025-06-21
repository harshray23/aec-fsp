
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDyqnjYWu8dnHAzLYcqyjpLDWZNlA_txN0",
  authDomain: "aec-fsp-portal.firebaseapp.com",
  databaseURL: "https://aec-fsp-portal-default-rtdb.firebaseio.com",
  projectId: "aec-fsp-portal",
  storageBucket: "aec-fsp-portal.firebasestorage.app",
  messagingSenderId: "73106802126",
  appId: "1:73106802126:web:78af2c0b38f9c81657179f"
};

// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Export the initialized app and db for use in other client-side components
export { app, db };
