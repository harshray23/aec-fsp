
import * as admin from 'firebase-admin';

// Ensure Firebase Admin is initialized only once
if (!admin.apps.length) {
  try {
    // If GOOGLE_APPLICATION_CREDENTIALS environment variable is set (e.g., locally),
    // it will use that service account JSON file.
    // In Firebase managed environments (Cloud Functions, App Hosting),
    // it can often infer credentials automatically if the service account has permissions.
    admin.initializeApp();
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error.message);
    // Depending on your application's needs, you might want to throw an error here
    // or allow the app to continue (knowing Firestore calls will fail).
    // For now, it logs the error and continues.
  }
}

const db = admin.firestore();
const auth = admin.auth(); // Export auth if needed for other operations

export { db, auth, admin };
