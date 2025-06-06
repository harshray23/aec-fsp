
import type { NextApiRequest, NextApiResponse } from 'next';
import { students, teachers, admins, hosts } from '@/lib/mockData';
import { USER_ROLES, type UserRole } from '@/lib/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, role } = req.body as { email?: string; role?: UserRole };

  if (!email || !role) {
    return res.status(400).json({ message: 'Email and role are required.' });
  }

  let userExists = false;
  switch (role) {
    case USER_ROLES.STUDENT:
      userExists = students.some(u => u.email === email);
      break;
    case USER_ROLES.TEACHER:
      userExists = teachers.some(u => u.email === email && u.status === 'active');
      break;
    case USER_ROLES.ADMIN:
      userExists = admins.some(u => u.email === email && u.status === 'active');
      break;
    case USER_ROLES.HOST:
      userExists = hosts.some(u => u.email === email);
      break;
    default:
      return res.status(400).json({ message: 'Invalid user role specified.' });
  }

  if (!userExists) {
    return res.status(404).json({ message: `No active user found with email ${email} for the role ${role}.` });
  }

  // In a real application, you would:
  // 1. Generate a secure, unique OTP/token.
  // 2. Store the hashed token in the database with an expiry, associated with the user.
  // 3. Send the actual OTP/token to the user's email address.
  
  // For this mock, we just confirm the user exists. The client will handle the "mock OTP".
  return res.status(200).json({ message: 'If an account with this email exists, a (mock) password reset OTP has been sent.' });
}
