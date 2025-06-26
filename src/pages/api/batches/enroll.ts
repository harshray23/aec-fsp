
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!db) {
    return res.status(500).json({ message: 'Database service is not available.' });
  }

  const { batchId, studentId } = req.body;

  if (!batchId || !studentId) {
    return res.status(400).json({ message: 'Batch ID and Student ID are required.' });
  }

  const studentRef = db.collection('students').doc(studentId);
  const batchRef = db.collection('batches').doc(batchId);

  try {
    const enrollmentSuccessful = await db.runTransaction(async (transaction) => {
      const studentDoc = await transaction.get(studentRef);
      const batchDoc = await transaction.get(batchRef);

      if (!studentDoc.exists) {
        throw new Error('Student not found.');
      }
      if (!batchDoc.exists) {
        throw new Error('Batch not found.');
      }
      
      const studentData = studentDoc.data();
      if (studentData?.batchId) {
        throw new Error('Student is already enrolled in a batch.');
      }

      // Perform the updates
      transaction.update(studentRef, { batchId: batchId });
      transaction.update(batchRef, { studentIds: FieldValue.arrayUnion(studentId) });
      
      return true;
    });
    
    if (enrollmentSuccessful) {
        return res.status(200).json({ message: 'Successfully enrolled in the batch.' });
    } else {
        // This case should not be reached if transaction throws error, but as a safeguard.
        throw new Error('Transaction failed without an explicit error.');
    }

  } catch (error: any) {
    console.error('Enrollment transaction failed:', error);
    return res.status(400).json({ message: error.message || 'Failed to enroll in the batch.' });
  }
}
