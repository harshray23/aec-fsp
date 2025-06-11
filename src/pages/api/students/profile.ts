
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin'; // Import the initialized Firestore instance
import type { Student } from '@/lib/types';
import type { FirebaseError } from 'firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { studentId: studentIdentifier } = req.query;

  if (!studentIdentifier || typeof studentIdentifier !== 'string') {
    return res.status(400).json({ message: 'Student ID or unique identifier is required as a query parameter.' });
  }

  try {
    const studentsRef = db.collection('students');
    let studentDocSnapshot: admin.firestore.DocumentSnapshot | null = null;

    // Attempt to find by studentId field first (common business key)
    const querySnapshot = await studentsRef.where('studentId', '==', studentIdentifier).limit(1).get();

    if (!querySnapshot.empty) {
      studentDocSnapshot = querySnapshot.docs[0];
    } else {
      // If not found by studentId field, try to get by document ID (assuming studentIdentifier could also be this)
      // This is useful if your Firestore document IDs are the same as `student.id` from mockData
      try {
        const doc = await studentsRef.doc(studentIdentifier).get();
        if (doc.exists) {
          studentDocSnapshot = doc;
        }
      } catch (docIdError) {
         // If studentIdentifier is not a valid document ID format, .doc() might throw.
         // We can ignore this error if the previous query by field also yielded no results.
         console.warn(`Attempt to fetch by document ID '${studentIdentifier}' failed or was not valid, continuing. Error: ${ (docIdError as FirebaseError).message }`);
      }
    }

    if (!studentDocSnapshot || !studentDocSnapshot.exists) {
      return res.status(404).json({ message: `Student with identifier '${studentIdentifier}' not found.` });
    }

    const studentData = studentDocSnapshot.data() as Student;

    // Firestore Timestamps are automatically handled by the SDK when converting to JSON for HTTP response.
    // Boolean fields from Firestore are typically already booleans.

    return res.status(200).json(studentData);

  } catch (error: any) {
    console.error('Firestore error fetching student profile:', error);
    let errorMessage = 'Internal server error while fetching student profile.';
    if (error.code) { // Firebase errors often have a code
        errorMessage = `Firestore error (${error.code}): ${error.message}`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    return res.status(500).json({ message: errorMessage });
  }
}
