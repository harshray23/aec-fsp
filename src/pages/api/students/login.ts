
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin'; // Updated import
import type { Student } from '@/lib/types';

// IMPORTANT: This is a MOCK password check. Passwords should be handled by Firebase Auth in a real app.
// DO NOT USE THIS IN PRODUCTION.
const MOCK_STUDENT_PASSWORD = "Password@123";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!db) {
    console.error("Login API Error: Firestore is not available. Firebase Admin SDK might not have initialized properly.");
    return res.status(500).json({ message: 'Internal Server Error: Database service not available. Please check server logs for Firebase Admin SDK initialization issues.' });
  }

  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Student ID/Email and password are required' });
  }

  try {
    const studentsRef = db.collection('students');
    let studentQuery;

    // Check if identifier is likely an email or a studentId
    if (identifier.includes('@')) {
      studentQuery = studentsRef.where('email', '==', identifier).limit(1).get();
    } else {
      studentQuery = studentsRef.where('studentId', '==', identifier).limit(1).get();
    }

    const snapshot = await studentQuery;

    if (snapshot.empty) {
      return res.status(404).json({ message: 'Student not found with this ID or Email.' });
    }

    const studentDoc = snapshot.docs[0];
    const student = { id: studentDoc.id, ...studentDoc.data() } as Student;

    // Mock password check
    if (password !== MOCK_STUDENT_PASSWORD) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!student.isEmailVerified || !student.isPhoneVerified) {
      return res.status(403).json({ message: 'Account not fully verified. Please complete email and phone verification.' });
    }
    
    // Omit password if it were ever stored (it shouldn't be for this mock approach)
    const { ...userDataToSend } = student; // This is a bit redundant if student doesn't have password, but good practice
    return res.status(200).json({ message: 'Student login successful', user: userDataToSend });

  } catch (error: any) {
    console.error('Error during student login:', error);
    // Log the actual error to the server console for debugging
    return res.status(500).json({ message: `Internal server error during login. Details: ${error.message}` });
  }
}
