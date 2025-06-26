
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, auth as adminAuth } from '@/lib/firebaseAdmin';
import { USER_ROLES } from '@/lib/constants';
import type { Host } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!db || !adminAuth) {
    return res.status(500).json({ message: 'Firebase Admin SDK not initialized.' });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields: name, email, password.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    // Check if user already exists in auth
    try {
        await adminAuth.getUserByEmail(email);
        return res.status(409).json({ message: `A user with email ${email} already exists in the authentication system.` });
    } catch (error: any) {
        if (error.code !== 'auth/user-not-found') {
            throw error; // Rethrow other auth errors
        }
        // If user not found, continue.
    }

    // Create user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: name,
      emailVerified: true, // Auto-verify hosts
    });
    
    const uid = userRecord.uid;

    // Create host profile in Firestore
    const hostData: Omit<Host, 'id'> = {
      uid,
      name,
      email,
      role: USER_ROLES.HOST,
    };
    
    // Use the UID as the document ID for consistency
    await db.collection('hosts').doc(uid).set(hostData);
    
    const createdUser = { id: uid, ...hostData };

    return res.status(201).json({ message: 'Host user created successfully.', user: createdUser });

  } catch (error: any) {
    console.error('Error creating host user:', error);
    // If we created an auth user but failed to create the DB record, we should ideally delete the auth user.
    // For simplicity here, we'll just return the error.
    return res.status(500).json({ message: error.message || 'Internal server error during host creation.' });
  }
}
