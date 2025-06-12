
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin'; 
import type { Student } from '@/lib/types';
import type { FirebaseError } from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { studentId: studentIdentifier } = req.query;

  if (!studentIdentifier || typeof studentIdentifier !== 'string') {
    return res.status(400).json({ message: 'Student ID or UID is required as a query parameter.' });
  }

  if (!db) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }

  try {
    const studentsRef = db.collection('students');
    let studentDocSnapshot: admin.firestore.DocumentSnapshot | undefined;

    // Attempt to find by student 'uid' field first (Firebase Auth ID)
    const uidQuerySnapshot = await studentsRef.where('uid', '==', studentIdentifier).limit(1).get();

    if (!uidQuerySnapshot.empty) {
      studentDocSnapshot = uidQuerySnapshot.docs[0];
    } else {
      // If not found by uid, try by 'studentId' field (custom business key)
      const studentIdFieldQuerySnapshot = await studentsRef.where('studentId', '==', studentIdentifier).limit(1).get();
      if (!studentIdFieldQuerySnapshot.empty) {
        studentDocSnapshot = studentIdFieldQuerySnapshot.docs[0];
      } else {
        // If not found by either, try to get by document ID (if studentIdentifier is a Firestore doc ID)
        try {
          const doc = await studentsRef.doc(studentIdentifier).get();
          if (doc.exists) {
            studentDocSnapshot = doc;
          }
        } catch (docIdError) {
           console.warn(`Attempt to fetch by document ID '${studentIdentifier}' failed or was not valid. Error: ${ (docIdError as FirebaseError).message }`);
        }
      }
    }

    if (!studentDocSnapshot || !studentDocSnapshot.exists) {
      return res.status(404).json({ message: `Student with identifier '${studentIdentifier}' not found.` });
    }

    const studentData = { id: studentDocSnapshot.id, ...studentDocSnapshot.data() } as Student;

    return res.status(200).json(studentData);

  } catch (error: any) {
    console.error('Firestore error fetching student profile:', error);
    let errorMessage = 'Internal server error while fetching student profile.';
    if (error.code) { 
        errorMessage = `Firestore error (${error.code}): ${error.message}`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return res.status(500).json({ message: errorMessage });
  }
}
