
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

  const { identifier, password, role } = req.body;

  if (!identifier || !password || !role) {
    return res.status(400).json({ message: 'Identifier (Email/Username), password, and role are required' });
  }

  let collectionName: string;
  let expectedPassword: string;

  switch (role) {
    case USER_ROLES.ADMIN:
      collectionName = 'admins';
      expectedPassword = "Password@123"; // Default password for admin (Harsh Ray)
      break;
    case USER_ROLES.TEACHER:
      collectionName = 'teachers';
      expectedPassword = "Teacher@123"; // Default password for teachers
      break;
    case USER_ROLES.HOST:
      collectionName = 'hosts';
      expectedPassword = "AecManagement@123"; // Default password for host
      break;
    default:
      return res.status(400).json({ message: 'Invalid role specified for this login endpoint.' });
  }

  try {
    const userRef = db.collection(collectionName);
    // Query for either email or username matching the identifier
    const emailSnapshot = await userRef.where('email', '==', identifier).limit(1).get();
    let userDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined = undefined;

    if (!emailSnapshot.empty) {
      userDoc = emailSnapshot.docs[0];
    } else {
      // If not found by email, try by username (if the collection supports username field)
      // Not all collections (like 'hosts' initially) might have a username field.
      // Add a check if the collection is expected to have usernames.
      if (role === USER_ROLES.ADMIN || role === USER_ROLES.TEACHER) {
        const usernameSnapshot = await userRef.where('username', '==', identifier).limit(1).get();
        if (!usernameSnapshot.empty) {
          userDoc = usernameSnapshot.docs[0];
        }
      }
    }

    if (!userDoc) {
      return res.status(401).json({ message: 'User not found with this Email or Username for the specified role.' });
    }

    const user = { id: userDoc.id, ...userDoc.data() } as User | Admin | Teacher;

    if (password !== expectedPassword) {
      return res.status(401).json({ message: 'Invalid credentials. Please check your identifier and password.' });
    }

    if ((role === USER_ROLES.ADMIN || role === USER_ROLES.TEACHER) && (user as Admin | Teacher).status !== "active") {
        return res.status(403).json({ message: 'Your account is not active or pending approval. Please contact support or management.' });
    }
    
    const { ...userDataToSend } = user;
    return res.status(200).json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} login successful`, user: userDataToSend });

  } catch (error: any) {
    console.error(`Error during ${role} login:`, error);
    return res.status(500).json({ message: `Internal server error during ${role} login. Details: ${error.message}` });
  }
}

