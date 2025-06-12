
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
    uid, // Firebase Auth UID
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
  if (!uid) {
    // uid should now be provided after Firebase Auth user creation on client
    return res.status(400).json({ message: 'Firebase User ID (uid) is required.' });
  }


  try {
    const studentsRef = db.collection('students');

    // Server-side check for duplicates (studentId and email)
    // UID should be unique by nature from Firebase Auth
    const existingByIdQuery = await studentsRef.where('studentId', '==', studentId).limit(1).get();
    if (!existingByIdQuery.empty) {
      return res.status(409).json({ message: `Student ID ${studentId} already exists.` });
    }
    const existingByEmailQuery = await studentsRef.where('email', '==', email).limit(1).get();
    if (!existingByEmailQuery.empty && existingByEmailQuery.docs[0].data().uid !== uid) { // Allow if same user re-registering somehow (should not happen)
      return res.status(409).json({ message: `Email ${email} already registered to a different user.` });
    }
     const existingByUidQuery = await studentsRef.where('uid', '==', uid).limit(1).get();
    if (!existingByUidQuery.empty) {
      return res.status(409).json({ message: `Firebase UID ${uid} already linked to a student profile.` });
    }


    const newStudentData: Omit<Student, 'id'> = { // Firestore will generate the document ID
      uid,
      studentId,
      name,
      email,
      role: USER_ROLES.STUDENT,
      rollNumber,
      registrationNumber,
      department,
      phoneNumber,
      whatsappNumber: whatsappNumber || undefined,
      isEmailVerified: true, // This now refers to Firebase Auth email verification status potentially
      isPhoneVerified: true, // This now refers to Firebase Auth phone verification status potentially
      // batchId will be assigned later
    };

    // We can choose to use the Firebase UID as the Firestore document ID
    // or let Firestore auto-generate one and store UID as a field.
    // Storing UID as a field is often more flexible.
    // If using UID as document ID: await studentsRef.doc(uid).set(newStudentData);
    // Let's stick to auto-generated ID and store uid as a field.
    const docRef = await studentsRef.add(newStudentData);
    const createdStudent = { id: docRef.id, ...newStudentData };

    return res.status(201).json({ message: 'Student registered successfully', student: createdStudent });

  } catch (error) {
    console.error('Error during student registration:', error);
    return res.status(500).json({ message: 'Internal server error during registration.' });
  }
}
