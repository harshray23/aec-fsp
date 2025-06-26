
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, auth as adminAuth } from '@/lib/firebaseAdmin';
import { USER_ROLES } from '@/lib/constants';
import type { Admin, Teacher } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!db || !adminAuth) {
    return res.status(500).json({ message: 'Firebase Admin SDK not initialized.' });
  }

  const { name, email, role, department, password, bypassApproval } = req.body;

  if (!name || !email || !role || !password) {
    return res.status(400).json({ message: 'Missing required fields: name, email, role, password.' });
  }
  if (role === USER_ROLES.TEACHER && !department) {
    return res.status(400).json({ message: 'Department is required for teacher role.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    // Step 1: Check if a user with this email already exists in Firestore or Auth
    const teacherQuery = await db.collection('teachers').where('email', '==', email).limit(1).get();
    const adminQuery = await db.collection('admins').where('email', '==', email).limit(1).get();
    if (!teacherQuery.empty || !adminQuery.empty) {
      return res.status(409).json({ message: `A user with email ${email} already exists.` });
    }
    
    try {
        await adminAuth.getUserByEmail(email);
        return res.status(409).json({ message: `A user with email ${email} already exists in the authentication system.` });
    } catch (error: any) {
        if (error.code !== 'auth/user-not-found') {
            throw error;
        }
    }

    // Step 2: If bypassing approval, generate and check username uniqueness
    let username: string | undefined;
    if (bypassApproval) {
      const baseUsername = email.split('@')[0].replace(/[.\+]/g, '_').toLowerCase();
      let finalUsername = baseUsername;
      let isUsernameTaken = true;
      let attempts = 0;
      
      while (isUsernameTaken && attempts < 10) {
        const teacherUsernameQuery = await db.collection('teachers').where('username', '==', finalUsername).limit(1).get();
        const adminUsernameQuery = await db.collection('admins').where('username', '==', finalUsername).limit(1).get();
        if (teacherUsernameQuery.empty && adminUsernameQuery.empty) {
          isUsernameTaken = false;
        } else {
          attempts++;
          finalUsername = `${baseUsername}_${attempts}`;
        }
      }
      
      if (isUsernameTaken) {
        return res.status(409).json({ message: `Could not generate a unique username for ${email}. Please try registering without bypassing approval.` });
      }
      username = finalUsername;
    }

    // Step 3: Create user in Firebase Authentication
    const userRecord = await adminAuth.createUser({
      email: email,
      password: password,
      displayName: name,
      emailVerified: true,
    });
    
    const uid = userRecord.uid;

    // Step 4: Create user profile in Firestore
    let collectionName: string;
    let userData: Omit<Admin, 'id'> | Omit<Teacher, 'id'>;

    if (role === USER_ROLES.TEACHER) {
      collectionName = 'teachers';
      const teacherData: Omit<Teacher, 'id'> = {
        uid,
        name,
        email,
        role: USER_ROLES.TEACHER,
        department,
        status: bypassApproval ? "active" : "pending_approval",
      };
      if (bypassApproval && username) {
        teacherData.username = username;
      }
      userData = teacherData;

    } else if (role === USER_ROLES.ADMIN) {
      collectionName = 'admins';
       const adminData: Omit<Admin, 'id'> = {
        uid,
        name,
        email,
        role: USER_ROLES.ADMIN,
        status: bypassApproval ? "active" : "pending_approval",
      };
      if (bypassApproval && username) {
        adminData.username = username;
      }
      userData = adminData;

    } else {
      await adminAuth.deleteUser(uid);
      return res.status(400).json({ message: 'Invalid user role specified.' });
    }

    await db.collection(collectionName).doc(uid).set(userData);
    
    const createdUser = { id: uid, ...userData };

    const message = bypassApproval 
      ? `${role} registered and activated successfully.`
      : `${role} registered successfully and awaiting approval.`;
      
    return res.status(201).json({ message, user: createdUser });

  } catch (error: any) {
    console.error('Error during user registration by admin:', error);
    return res.status(500).json({ message: error.message || 'Internal server error during registration.' });
  }
}
