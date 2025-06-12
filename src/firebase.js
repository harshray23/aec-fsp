// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the initialized app if you need to use it elsewhere in your client-side code
export { app };
