
import type { NextApiRequest, NextApiResponse } from 'next';
import { auth as adminAuth } from '@/lib/firebaseAdmin';
import type { UserRole } from '@/lib/constants';

const MOCK_OTP_VALID = "123456"; // The mock OTP we expect

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!adminAuth) {
    return res.status(500).json({ message: 'Auth service not initialized.' });
  }

  const { email, role, token, password } = req.body as { 
    email?: string; 
    role?: UserRole; 
    token?: string; 
    password?: string 
  };

  if (!email || !role || !token || !password) {
    return res.status(400).json({ message: 'Email, role, token (OTP), and new password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }
  
  // Mock OTP verification
  if (token !== MOCK_OTP_VALID) {
    return res.status(400).json({ message: 'Invalid or expired OTP. Please try again.' });
  }

  try {
    // 1. Find the user in Firebase Authentication by their email
    const userRecord = await adminAuth.getUserByEmail(email);
    const uid = userRecord.uid;

    // 2. Update the user's password in Firebase Authentication
    await adminAuth.updateUser(uid, {
      password: password,
    });
    
    return res.status(200).json({ message: 'Password has been reset successfully.' });

  } catch (error: any) {
    console.error(`Error resetting password for ${email}:`, error);
    if (error.code === 'auth/user-not-found') {
      return res.status(404).json({ message: `User with email ${email} not found.` });
    }
    return res.status(500).json({ message: 'An unexpected error occurred while resetting the password.' });
  }
}
