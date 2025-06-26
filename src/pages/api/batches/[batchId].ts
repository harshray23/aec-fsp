
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, Timestamp } from '@/lib/firebaseAdmin';
import type { Batch } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { batchId } = req.query;

  if (!db) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }

  if (typeof batchId !== 'string') {
    return res.status(400).json({ message: 'Batch ID must be a string.' });
  }

  const batchRef = db.collection('batches').doc(batchId);

  switch (req.method) {
    case 'GET':
      try {
        const doc = await batchRef.get();
        if (!doc.exists) {
          return res.status(404).json({ message: 'Batch not found.' });
        }
        const data = doc.data();
        const batch = { 
            id: doc.id, 
            ...data,
            // Ensure startDate is ISO string if stored as Timestamp
            startDate: data?.startDate instanceof Timestamp ? data.startDate.toDate().toISOString() : data?.startDate,
        } as Batch;
        res.status(200).json(batch);
      } catch (error) {
        console.error(`Error fetching batch ${batchId}:`, error);
        res.status(500).json({ message: 'Internal server error while fetching batch.' });
      }
      break;

    case 'PUT':
      try {
        const currentDoc = await batchRef.get();
        if (!currentDoc.exists) {
          return res.status(404).json({ message: 'Batch not found to update.' });
        }

        const { studentIds, ...updateData } = req.body;
        
        // This endpoint no longer manages student assignments directly.
        // It only updates the batch's own properties.
        // The studentIds are managed via the /enroll API.
        
        await batchRef.update(updateData);
        
        res.status(200).json({ message: `Batch ${batchId} updated successfully.`, batch: { id: batchId, ...updateData } });
      } catch (error) {
        console.error(`Error updating batch ${batchId}:`, error);
        res.status(500).json({ message: 'Internal server error while updating batch.' });
      }
      break;

    case 'DELETE':
      try {
        const doc = await batchRef.get();
        if (!doc.exists) {
          return res.status(404).json({ message: 'Batch not found to delete.' });
        }

        // Unassign students from this batch
        const studentsToUpdateSnapshot = await db.collection('students').where('batchId', '==', batchId).get();
        if (!studentsToUpdateSnapshot.empty) {
          const studentBatchWrite = db.batch();
          studentsToUpdateSnapshot.docs.forEach(studentDoc => {
            studentBatchWrite.update(studentDoc.ref, { batchId: null });
          });
          await studentBatchWrite.commit();
        }
        
        await batchRef.delete();
        res.status(200).json({ message: `Batch ${batchId} deleted successfully.` });
      } catch (error) {
        console.error(`Error deleting batch ${batchId}:`, error);
        res.status(500).json({ message: 'Internal server error while deleting batch.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
