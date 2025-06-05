
import type { NextApiRequest, NextApiResponse } from 'next';
import { students as mockStudents } from '@/lib/mockData';
import type { Student } from '@/lib/types';

// IMPORTANT: This is a MOCK login. Passwords are NOT hashed or securely checked.
// DO NOT USE THIS IN PRODUCTION.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Student ID/Email and password are required' });
  }

  const student = mockStudents.find(
    (s) => s.studentId === identifier || s.email === identifier
  );

  if (!student) {
    return res.status(404).json({ message: 'Student not found with this ID or Email.' });
  }

  // Mock password check - in a real app, compare hashed passwords
  // For this prototype, let's assume a generic password for all mock students if needed
  // or check a specific password if one was associated (it isn't in mockData).
  const MOCK_STUDENT_PASSWORD = "Password@123"; // Example, not secure
  if (password !== MOCK_STUDENT_PASSWORD) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  if (!student.isEmailVerified || !student.isPhoneVerified) {
    return res.status(403).json({ message: 'Account not fully verified. Please complete email and phone verification.' });
  }
  
  // Return a subset of student data, omitting sensitive fields like stored passwords (if any)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ...userDataToSend } = student;
  return res.status(200).json({ message: 'Student login successful', user: userDataToSend });
}
