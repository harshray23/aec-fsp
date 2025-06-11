
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import { USER_ROLES } from '@/lib/constants';
import type { Admin, Teacher } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, email, role, department, password } = req.body;

  if (!name || !email || !role || !password) {
    return res.status(400).json({ message: 'Missing required fields: name, email, role, password.' });
  }

  if (role === USER_ROLES.TEACHER && !department) {
    return res.status(400).json({ message: 'Department is required for teacher role.' });
  }

  // It's good practice to validate password strength here as well, though client-side handles min length
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }


  try {
    let collectionName: string;
    let userData: Omit<Admin, 'id'> | Omit<Teacher, 'id'>;

    if (role === USER_ROLES.TEACHER) {
      collectionName = 'teachers';
      const existingTeacherQuery = await db.collection(collectionName).where('email', '==', email).limit(1).get();
      if (!existingTeacherQuery.empty) {
        return res.status(409).json({ message: `A teacher with email ${email} already exists.` });
      }
      userData = {
        name,
        email,
        role: USER_ROLES.TEACHER,
        department,
        status: "pending_approval",
        // username will be assigned by host upon approval
      };
    } else if (role === USER_ROLES.ADMIN) {
      collectionName = 'admins';
      const existingAdminQuery = await db.collection(collectionName).where('email', '==', email).limit(1).get();
      if (!existingAdminQuery.empty) {
        return res.status(409).json({ message: `An admin with email ${email} already exists.` });
      }
      userData = {
        name,
        email,
        role: USER_ROLES.ADMIN,
        status: "pending_approval",
        // username will be assigned by host upon approval
        // phoneNumber and whatsappNumber can be added/updated by admin later in their profile
      };
    } else {
      return res.status(400).json({ message: 'Invalid user role specified.' });
    }
    
    // Password is NOT stored in Firestore document directly.
    // Authentication should be handled by Firebase Auth in a real app.
    // For this mock setup, we are not creating Firebase Auth users, just Firestore documents.

    const docRef = await db.collection(collectionName).add(userData);
    const createdUser = { id: docRef.id, ...userData };

    return res.status(201).json({ message: `${role} registered successfully and awaiting approval.`, user: createdUser });

  } catch (error) {
    console.error('Error during user registration by admin:', error);
    return res.status(500).json({ message: 'Internal server error during registration.' });
  }
}
