
import type { NextApiRequest, NextApiResponse } from 'next';
import { students, teachers, admins, hosts } from '@/lib/mockData'; // Assuming these are mutable for mock
import { USER_ROLES, type UserRole } from '@/lib/constants';

const MOCK_OTP_VALID = "123456"; // The mock OTP we expect

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
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

  let userArray: any[] = [];
  switch (role) {
    case USER_ROLES.STUDENT: userArray = students; break;
    case USER_ROLES.TEACHER: userArray = teachers; break;
    case USER_ROLES.ADMIN: userArray = admins; break;
    case USER_ROLES.HOST: userArray = hosts; break;
    default:
      return res.status(400).json({ message: 'Invalid user role specified.' });
  }

  const userIndex = userArray.findIndex(u => u.email === email);

  if (userIndex === -1) {
    return res.status(404).json({ message: `User with email ${email} not found for role ${role}.` });
  }
  
  // In a real application, you would:
  // 1. Verify the token against a stored, hashed token in the database, checking its expiry.
  // 2. If valid, hash the new `password`.
  // 3. Update the user's `password_hash` in the database.
  // 4. Invalidate the used token.

  // For this mock:
  console.log(`MOCK: Password for ${email} (role: ${role}) would be updated to "${password}". Actual password storage/hashing is not implemented in mock.`);
  // If you were storing passwords (even mock plain text for a prototype, which is NOT recommended):
  // userArray[userIndex].password = password; // Don't do this in real apps!

  return res.status(200).json({ message: 'Password has been reset successfully.' });
}
