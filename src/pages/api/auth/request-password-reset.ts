
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import { USER_ROLES, type UserRole } from '@/lib/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  if (!db) {
    return res.status(500).json({ message: 'Database not initialized.' });
  }

  const { email, role } = req.body as { email?: string; role?: UserRole };

  if (!email || !role) {
    return res.status(400).json({ message: 'Email and role are required.' });
  }

  try {
    let collectionName: string;
    switch (role) {
      case USER_ROLES.STUDENT: collectionName = 'students'; break;
      case USER_ROLES.TEACHER: collectionName = 'teachers'; break;
      case USER_ROLES.ADMIN: collectionName = 'admins'; break;
      case USER_ROLES.HOST: 
        collectionName = 'hosts';
        break;
      default:
        return res.status(400).json({ message: 'Invalid user role specified.' });
    }

    const query = db.collection(collectionName).where('email', '==', email).limit(1);
    const snapshot = await query.get();

    if (snapshot.empty) {
      return res.status(404).json({ message: `No active user found with email ${email} for the role ${role}.` });
    }

    // Check status for roles that have it (Teacher, Admin)
    // Host users do not have a status field and are considered active by default.
    if (role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN) {
        const user = snapshot.docs[0].data();
        if (user.status !== 'active') {
             return res.status(403).json({ message: `User account is not active.` });
        }
    }
    
    // If user exists and is active, proceed. The client handles the password reset logic.
    return res.status(200).json({ message: 'User verified successfully.' });

  } catch (error) {
    console.error("Error in password reset request:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}
