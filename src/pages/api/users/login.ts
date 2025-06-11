
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin'; // Updated import
import { USER_ROLES } from '@/lib/constants';
import type { User, Admin, Teacher } from '@/lib/types';

// IMPORTANT: This is a MOCK password check. Passwords should be handled by Firebase Auth in a real app.
// DO NOT USE THIS IN PRODUCTION.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!db) {
    console.error("Login API Error: Firestore is not available. Firebase Admin SDK might not have initialized properly.");
    return res.status(500).json({ message: 'Internal Server Error: Database service not available. Please check server logs for Firebase Admin SDK initialization issues.' });
  }

  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password, and role are required' });
  }

  let collectionName: string;
  let expectedPassword: string;

  switch (role) {
    case USER_ROLES.ADMIN:
      collectionName = 'admins';
      expectedPassword = "Password@123"; // Harsh Ray's specific password
      break;
    case USER_ROLES.TEACHER:
      collectionName = 'teachers';
      expectedPassword = "Teacher@123";
      break;
    case USER_ROLES.HOST:
      collectionName = 'hosts';
      expectedPassword = "AecManagement@123";
      break;
    default:
      return res.status(400).json({ message: 'Invalid role specified' });
  }

  try {
    const userRef = db.collection(collectionName);
    const snapshot = await userRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return res.status(401).json({ message: 'User not found with this email for the specified role.' });
    }

    const userDoc = snapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() } as User | Admin | Teacher;

    if (password !== expectedPassword) {
      return res.status(401).json({ message: 'Invalid credentials. Please check your email and password.' });
    }

    if ((role === USER_ROLES.ADMIN || role === USER_ROLES.TEACHER) && (user as Admin | Teacher).status !== "active") {
        return res.status(403).json({ message: 'Your account is not active or pending approval. Please contact support or management.' });
    }
    
    // Ensure no sensitive data like a password field (if it existed on the user object) is sent back.
    // For this example, we assume the user object is already clean.
    const { ...userDataToSend } = user;
    return res.status(200).json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} login successful`, user: userDataToSend });

  } catch (error: any) {
    console.error(`Error during ${role} login:`, error);
    return res.status(500).json({ message: `Internal server error during ${role} login. Details: ${error.message}` });
  }
}
