
import admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Define these as potentially undefined so we can export them
// regardless of whether the initialization succeeds.
let db: admin.firestore.Firestore | undefined;
let auth: admin.auth.Auth | undefined;

try {
  // Check if the app is already initialized to prevent errors in hot-reloading environments
  if (!admin.apps.length) {
    console.log("Initializing Firebase Admin SDK...");
    // In a managed environment like Firebase App Hosting or Cloud Run,
    // initializeApp() without arguments will use the application's default credentials.
    admin.initializeApp();
    console.log("Firebase Admin SDK initialized successfully.");
  } else {
    console.log("Re-using existing Firebase Admin SDK instance.");
  }

  // Now that we're sure an app instance exists (or initialization was attempted),
  // we can get the services.
  db = admin.firestore();
  auth = admin.auth();

} catch (error: any) {
  // If ANY of the above fails (initializeApp, firestore, or auth),
  // we log the error and db/auth will remain undefined.
  console.error("CRITICAL: Firebase Admin SDK setup failed:", error.message);
}

// Export the (potentially undefined) services and Timestamp.
// The API routes are responsible for checking if they are defined before use.
export { db, auth, Timestamp };
