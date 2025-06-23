
import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getFirestore, Firestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let db: Firestore | undefined;
let auth: Auth | undefined;

if (!getApps().length) {
  try {
    console.log("Attempting to initialize Firebase Admin SDK...");
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_CONFIG) {
        console.warn("WARNING: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set, and no FIREBASE_CONFIG found. Firebase Admin SDK might not initialize correctly unless in a fully managed Firebase environment. For local development, ensure GOOGLE_APPLICATION_CREDENTIALS points to your service account key file.");
    }
    
    initializeApp();
    
    db = getFirestore();
    auth = getAuth();
    console.log("Firebase Admin SDK initialized successfully. Firestore and Auth are available.");
  } catch (error: any) {
    console.error("CRITICAL: Firebase Admin SDK initialization error:", error.message);
    console.error("Firebase Admin SDK could not be initialized. Firestore and Auth will NOT be available. API calls requiring Firebase will likely fail. Check your service account credentials and environment setup.");
  }
} else {
  const app = getApp();
  db = getFirestore(app);
  auth = getAuth(app);
  console.log("Firebase Admin SDK already initialized. Re-using existing instances for Firestore and Auth.");
}

export { db, auth, Timestamp };
