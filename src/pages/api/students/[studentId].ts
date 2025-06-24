
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, auth as adminAuth } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Student } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { studentId } = req.query;

  if (!db || !adminAuth) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }

  if (typeof studentId !== 'string') {
    return res.status(400).json({ message: 'Student ID must be a string.' });
  }

  // The studentId from the path is the Firestore Document ID.
  const studentRef = db.collection('students').doc(studentId);

  switch (req.method) {
    case 'DELETE':
      try {
        const studentDoc = await studentRef.get();
        if (!studentDoc.exists) {
          return res.status(404).json({ message: 'Student not found to delete.' });
        }

        const studentData = studentDoc.data() as Student;
        const uid = studentData.uid;
        const batchId = studentData.batchId;

        const writeBatch = db.batch();

        // 1. Remove student from their batch if they are in one
        if (batchId) {
          const batchRef = db.collection('batches').doc(batchId);
          writeBatch.update(batchRef, {
            studentIds: FieldValue.arrayRemove(studentId)
          });
        }

        // 2. Delete the student's Firestore document
        writeBatch.delete(studentRef);
        
        // Commit Firestore changes
        await writeBatch.commit();
        
        // 3. Delete the student from Firebase Authentication
        // This should happen after we are sure the Firestore data is handled.
        if (uid) {
            try {
                await adminAuth.deleteUser(uid);
            } catch (authError: any) {
                // If the user is already deleted from auth, we can ignore the error.
                // Otherwise, it's a problem. We should log it but the primary deletion (from our DB) is done.
                if (authError.code !== 'auth/user-not-found') {
                    console.error(`Failed to delete Firebase Auth user ${uid}, but Firestore document ${studentId} was deleted. Manual cleanup may be required.`, authError);
                }
            }
        }

        res.status(200).json({ message: `Student ${studentData.name} deleted successfully.` });

      } catch (error) {
        console.error(`Error deleting student ${studentId}:`, error);
        res.status(500).json({ message: 'Internal server error while deleting student.' });
      }
      break;

    default:
      res.setHeader('Allow', ['DELETE']);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
