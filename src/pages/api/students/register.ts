
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import type { Student } from '@/lib/types';
import { USER_ROLES } from '@/lib/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  if (!db) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }

  const {
    uid, // Firebase Auth UID
    studentId,
    name,
    email,
    rollNumber,
    registrationNumber,
    department,
    phoneNumber,
    whatsappNumber,
  } = req.body as Partial<Student & { password?: string }>;

  if (!studentId || !name || !email || !rollNumber || !registrationNumber || !department || !phoneNumber) {
    return res.status(400).json({ message: 'Missing required student registration fields.' });
  }
  if (!uid) {
    return res.status(400).json({ message: 'Firebase User ID (uid) is required.' });
  }


  try {
    const studentsRef = db.collection('students');

    const existingByIdQuery = await studentsRef.where('studentId', '==', studentId).limit(1).get();
    if (!existingByIdQuery.empty) {
      return res.status(409).json({ message: `Student ID ${studentId} already exists.` });
    }
    const existingByEmailQuery = await studentsRef.where('email', '==', email).limit(1).get();
    if (!existingByEmailQuery.empty && existingByEmailQuery.docs[0].id !== uid) {
      return res.status(409).json({ message: `Email ${email} already registered to a different user.` });
    }
    const existingDoc = await studentsRef.doc(uid).get();
    if (existingDoc.exists) {
        return res.status(409).json({ message: `A user profile with UID ${uid} already exists.` });
    }


    const newStudentData: Omit<Student, 'id'> = {
      uid,
      studentId,
      name,
      email,
      role: USER_ROLES.STUDENT,
      rollNumber,
      registrationNumber,
      department,
      phoneNumber,
      isEmailVerified: true, 
      isPhoneVerified: true, 
    };
    
    if (whatsappNumber) {
        newStudentData.whatsappNumber = whatsappNumber;
    }


    await studentsRef.doc(uid).set(newStudentData);
    
    const createdStudent = { id: uid, ...newStudentData };

    return res.status(201).json({ message: 'Student registered successfully', student: createdStudent });

  } catch (error) {
    console.error('Error during student registration:', error);
    return res.status(500).json({ message: 'Internal server error during registration.' });
  }
}
