
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
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
    phoneNumber,
    whatsappNumber,
    // password is intentionally not captured here for Firestore storage
  } = req.body as Partial<Student & { password?: string }>;

  if (!studentId || !name || !email || !rollNumber || !registrationNumber || !department || !phoneNumber) {
    return res.status(400).json({ message: 'Missing required student registration fields.' });
  }

  try {
    const studentsRef = db.collection('students');

    // Server-side check for duplicates
    const existingByIdQuery = await studentsRef.where('studentId', '==', studentId).limit(1).get();
    if (!existingByIdQuery.empty) {
      return res.status(409).json({ message: `Student ID ${studentId} already exists.` });
    }
    const existingByEmailQuery = await studentsRef.where('email', '==', email).limit(1).get();
    if (!existingByEmailQuery.empty) {
      return res.status(409).json({ message: `Email ${email} already registered.` });
    }

    const newStudentData: Omit<Student, 'id'> = { // Firestore will generate the document ID
      studentId,
      name,
      email,
      role: USER_ROLES.STUDENT,
      rollNumber,
      registrationNumber,
      department,
      phoneNumber,
      whatsappNumber: whatsappNumber || undefined,
      isEmailVerified: true, // Assumed verified after client-side steps
      isPhoneVerified: true, // Assumed verified after client-side steps
      // batchId will be assigned later
    };

    const docRef = await studentsRef.add(newStudentData);
    const createdStudent = { id: docRef.id, ...newStudentData };

    return res.status(201).json({ message: 'Student registered successfully', student: createdStudent });

  } catch (error) {
    console.error('Error during student registration:', error);
    return res.status(500).json({ message: 'Internal server error during registration.' });
  }
}
