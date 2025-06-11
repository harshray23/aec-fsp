
import * as admin from 'firebase-admin';

// Define db and auth with explicit types, allowing them to be potentially undefined if init fails
let db: admin.firestore.Firestore | undefined;
let auth: admin.auth.Auth | undefined;

if (!admin.apps.length) {
  try {
    console.log("Attempting to initialize Firebase Admin SDK...");
    // Check for service account credentials explicitly
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_CONFIG) {
        console.warn("WARNING: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set, and no FIREBASE_CONFIG found. Firebase Admin SDK might not initialize correctly unless in a fully managed Firebase environment (like Cloud Functions or App Hosting with proper service account permissions). For local development, ensure GOOGLE_APPLICATION_CREDENTIALS points to your service account key file.");
    }
    
    admin.initializeApp(); // This will use GOOGLE_APPLICATION_CREDENTIALS or auto-config in Firebase env
    
    db = admin.firestore();
    auth = admin.auth();
    console.log("Firebase Admin SDK initialized successfully. Firestore and Auth are available.");
  } catch (error: any) {
    console.error("CRITICAL: Firebase Admin SDK initialization error:", error.message);
    console.error("Firebase Admin SDK could not be initialized. Firestore and Auth will NOT be available. API calls requiring Firebase will likely fail. Check your service account credentials and environment setup.");
    // db and auth will remain undefined
  }
} else {
  // App already initialized, get instances
  db = admin.firestore(); // Get the default app's firestore instance
  auth = admin.auth();    // Get the default app's auth instance
  console.log("Firebase Admin SDK already initialized. Re-using existing instances for Firestore and Auth.");
}

export { db, auth, admin };
