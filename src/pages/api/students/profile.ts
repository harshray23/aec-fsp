
import type { NextApiRequest, NextApiResponse } from 'next';
import { students as mockStudents } from '@/lib/mockData';
import type { Student } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { studentId } = req.query;

  if (!studentId || typeof studentId !== 'string') {
    return res.status(400).json({ message: 'Student ID is required as a query parameter.' });
  }

  const student = mockStudents.find((s) => s.id === studentId || s.studentId === studentId);

  if (!student) {
    return res.status(404).json({ message: `Student with ID '${studentId}' not found.` });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { ...studentDataToSend } = student; 
  return res.status(200).json(studentDataToSend);
}
