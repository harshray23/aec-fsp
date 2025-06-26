
import admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

let db: admin.firestore.Firestore | undefined;
let auth: admin.auth.Auth | undefined;

try {
  if (!admin.apps.length) {
    console.log("Initializing Firebase Admin SDK...");

    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Firebase Admin SDK credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are not set in .env.local. The app cannot connect to the database.");
    }
    
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });

    console.log(`Firebase Admin SDK initialized successfully for project: ${projectId}`);
  } else {
    console.log("Re-using existing Firebase Admin SDK instance.");
  }

  db = admin.firestore();
  auth = admin.auth();

} catch (error: any) {
  console.error("CRITICAL: Firebase Admin SDK setup failed:", error.message);
  db = undefined;
  auth = undefined;
}

export { db, auth, Timestamp };
