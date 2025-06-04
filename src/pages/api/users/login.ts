
import type { NextApiRequest, NextApiResponse } from 'next';
import { admins, teachers, hosts } from '@/lib/mockData'; // Import hosts
import { USER_ROLES } from '@/lib/constants';
import type { User, Admin, Teacher } from '@/lib/types';

// IMPORTANT: This is a MOCK login. Passwords are NOT hashed or securely checked.
// DO NOT USE THIS IN PRODUCTION.

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Email, password, and role are required' });
  }

  let user: User | Admin | Teacher | undefined;

  switch (role) {
    case USER_ROLES.ADMIN:
      user = admins.find(a => a.email === email);
      // Mock password check for admin - in a real app, compare hashed passwords
      if (user && email === "harshray2007@gmail.com" && password === "Password@123") { // Example fixed password for mock admin
        // Ensure status is active
        if ((user as Admin).status !== "active") {
             return res.status(403).json({ message: 'Your account is not active. Please contact support.' });
        }
        // Return a subset of user data, omitting sensitive fields like stored passwords
        const { ...userDataToSend } = user as Admin;
        return res.status(200).json({ message: 'Admin login successful', user: userDataToSend });
      }
      break;
    case USER_ROLES.TEACHER:
      user = teachers.find(t => t.email === email);
      // Mock password check for teacher
      if (user && password === "Teacher@123") { // Example fixed password for mock teachers
         // Ensure status is active
        if ((user as Teacher).status !== "active") {
             return res.status(403).json({ message: 'Your account is not active or pending approval. Please contact support or management.' });
        }
        const { ...userDataToSend } = user as Teacher;
        return res.status(200).json({ message: 'Teacher login successful', user: userDataToSend });
      }
      break;
    case USER_ROLES.HOST:
      user = hosts.find(h => h.email === email);
      // Specific credential check for host/management
      if (user && email === "management@aec.edu.in" && password === "AecManagement@123") {
        const { ...userDataToSend } = user; // No sensitive fields to omit for this basic User type
        return res.status(200).json({ message: 'Management login successful', user: userDataToSend });
      }
      break;
    default:
      return res.status(400).json({ message: 'Invalid role specified' });
  }

  if (!user) {
    return res.status(401).json({ message: 'User not found with this email for the specified role.' });
  }
  
  // If user was found but password didn't match for Admin/Teacher/Host with specific checks
  return res.status(401).json({ message: 'Invalid credentials. Please check your email and password.' });
}

