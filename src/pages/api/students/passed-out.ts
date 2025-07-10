
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, auth as adminAuth } from '@/lib/firebaseAdmin';
import type { Student } from '@/lib/types';

const BATCH_SIZE = 500; // Firebase batch writes are limited to 500 operations

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!db || !adminAuth) {
    return res.status(500).json({ message: 'Database not initialized' });
  }

  try {
    const passedOutQuery = db.collection('students').where('status', '==', 'passed_out');
    const snapshot = await passedOutQuery.get();

    if (snapshot.empty) {
      return res.status(200).json({ message: 'No passed-out students to delete.' });
    }

    const studentsToDelete = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
    const uidsToDelete = studentsToDelete.map(s => s.uid).filter(Boolean) as string[];

    // Delete Firestore documents in batches
    const firestoreBatches = [];
    for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = snapshot.docs.slice(i, i + BATCH_SIZE);
        chunk.forEach(doc => batch.delete(doc.ref));
        firestoreBatches.push(batch.commit());
    }
    await Promise.all(firestoreBatches);
    
    // Delete Firebase Auth users in batches
    if (uidsToDelete.length > 0) {
      const authBatches = [];
      for (let i = 0; i < uidsToDelete.length; i += 1000) { // Max 1000 UIDs per call
          const chunk = uidsToDelete.slice(i, i + 1000);
          authBatches.push(adminAuth.deleteUsers(chunk));
      }
      const results = await Promise.all(authBatches);
      results.forEach(result => {
          if (result.failureCount > 0) {
              console.warn(`Failed to delete ${result.failureCount} auth users. See logs for details.`);
              result.errors.forEach(err => console.error(err.error));
          }
      });
    }

    return res.status(200).json({ message: `Successfully deleted ${snapshot.size} passed-out student records.` });

  } catch (error) {
    console.error('Error deleting passed-out students:', error);
    res.status(500).json({ message: 'Internal server error while deleting students.' });
  }
}
