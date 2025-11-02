// src/pages/api/auth/verify-session.ts
import { verifySession } from '@/lib/auth';
import { db } from '@/lib/firebaseAdmin';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') { // Allow POST for some flexibility
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const decodedClaims = await verifySession(req);

    if (!decodedClaims) {
      return res.status(401).json({ message: 'Unauthorized: No valid session found.' });
    }

    // After verifying the session cookie, we fetch the full user profile from Firestore
    // to get the most up-to-date role and other details.
    let userProfile = null;
    const collections = ['students', 'teachers', 'admins', 'hosts'];
    for (const collection of collections) {
      const docRef = db.collection(collection).doc(decodedClaims.uid);
      const doc = await docRef.get();
      if (doc.exists) {
        userProfile = { id: doc.id, ...doc.data() };
        break;
      }
    }

    if (!userProfile) {
        return res.status(404).json({ message: `User profile not found in database for UID: ${decodedClaims.uid}`});
    }

    // Return the combined, up-to-date user profile.
    return res.status(200).json({ user: userProfile });

  } catch (error) {
    console.error('Session verification API error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
