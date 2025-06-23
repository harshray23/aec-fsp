
import admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

let db: admin.firestore.Firestore | undefined;
let auth: admin.auth.Auth | undefined;

try {
  if (!admin.apps.length) {
    console.log("Initializing Firebase Admin SDK...");

    // This checks if the required environment variables are set.
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error("Firebase Admin SDK credentials are not set in .env.local");
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The key must have newline characters correctly formatted.
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });

    console.log("Firebase Admin SDK initialized successfully.");
  } else {
    console.log("Re-using existing Firebase Admin SDK instance.");
  }

  db = admin.firestore();
  auth = admin.auth();

} catch (error: any) {
  console.error("CRITICAL: Firebase Admin SDK setup failed:", error.message);
  // Set to undefined so API routes can gracefully fail.
  db = undefined;
  auth = undefined;
}

export { db, auth, Timestamp };
