
import type { NextApiRequest, NextApiResponse } from 'next';
import { students as mockStudents } from '@/lib/mockData';
import type { Student } from '@/lib/types';
import { USER_ROLES } from '@/lib/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const {
    studentId,
    name,
    email,
    rollNumber,
    registrationNumber,
    department,
    // section, // Section removed
    phoneNumber,
    whatsappNumber,
    // password is intentionally not used for storage in mock data
  } = req.body as Partial<Student & { password?: string }>; // Cast to include password for receiving

  // Basic validation
  if (!studentId || !name || !email || !rollNumber || !registrationNumber || !department || !phoneNumber) {
    return res.status(400).json({ message: 'Missing required student registration fields.' });
  }

  // Server-side check for duplicates, even if client-side check was done
  const existingStudentById = mockStudents.find((s) => s.studentId === studentId);
  if (existingStudentById) {
    return res.status(409).json({ message: `Student ID ${studentId} already exists.` });
  }
  const existingStudentByEmail = mockStudents.find((s) => s.email === email);
  if (existingStudentByEmail) {
    return res.status(409).json({ message: `Email ${email} already registered.` });
  }

  const newStudent: Student = {
    id: `STUD_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, // More unique ID
    studentId,
    name,
    email,
    role: USER_ROLES.STUDENT, // Default role for this registration
    rollNumber,
    registrationNumber,
    department,
    // section, // Section removed
    phoneNumber,
    whatsappNumber: whatsappNumber || undefined, // Handle optional field
    isEmailVerified: true, // Assumed verified after client-side steps
    isPhoneVerified: true, // Assumed verified after client-side steps
    // batchId will be assigned later
  };

  mockStudents.push(newStudent);

  // Exclude password from the response
  const { ...studentDataToSend } = newStudent;

  return res.status(201).json({ message: 'Student registered successfully', student: studentDataToSend });
}
