
import type { NextApiRequest, NextApiResponse } from 'next';
import { students as mockStudents } from '@/lib/mockData';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { studentId, email } = req.body;

  if (!studentId && !email) {
    return res.status(400).json({ message: 'Student ID or Email is required for check.' });
  }

  const existingStudent = mockStudents.find(
    (s) => (studentId && s.studentId === studentId) || (email && s.email === email)
  );

  if (existingStudent) {
    let message = 'Conflict: ';
    if (studentId && existingStudent.studentId === studentId) {
      message += `Student ID ${studentId} already exists.`;
    } else if (email && existingStudent.email === email) {
      message += `Email ${email} already registered.`;
    }
    return res.status(409).json({ message });
  }

  return res.status(200).json({ message: 'Student ID and Email are available.' });
}
