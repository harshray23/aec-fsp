
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, Timestamp } from '@/lib/firebaseAdmin';
import type { Batch } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!db) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const batchesSnapshot = await db.collection('batches').get();
        const batches: Batch[] = batchesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Ensure startDate is ISO string if stored as Timestamp
            startDate: data.startDate instanceof Timestamp ? data.startDate.toDate().toISOString() : data.startDate,
            endDate: data.endDate instanceof Timestamp ? data.endDate.toDate().toISOString() : data.endDate,
          } as Batch;
        });
        res.status(200).json(batches);
      } catch (error) {
        console.error('Error fetching batches:', error);
        res.status(500).json({ message: 'Internal server error while fetching batches.' });
      }
      break;

    case 'POST':
      try {
        const { ...batchPayload }: Omit<Batch, 'id'> = req.body;

        if (!batchPayload.name || !batchPayload.topic || !batchPayload.teacherIds) {
          return res.status(400).json({ message: 'Missing required fields for batch creation.' });
        }
        
        const studentIds = batchPayload.studentIds || [];
        batchPayload.studentIds = studentIds;

        const batchRef = db.collection('batches').doc(); // Create ref with ID first
        const newBatchId = batchRef.id;

        const writeBatch = db.batch();

        // 1. Create the batch document
        writeBatch.set(batchRef, batchPayload);

        // 2. Update all assigned students to add the new batchId
        if (studentIds.length > 0) {
            studentIds.forEach((studentId: string) => {
                const studentRef = db.collection('students').doc(studentId);
                // Note: This assumes the student document exists. A more robust implementation
                // might check for existence first, but we trust the client for now.
                writeBatch.update(studentRef, { batchIds: FieldValue.arrayUnion(newBatchId) });
            });
        }
        
        await writeBatch.commit();

        res.status(201).json({ message: 'Batch created successfully', batch: { id: newBatchId, ...batchPayload } });
      } catch (error) {
        console.error('Error creating batch:', error);
        res.status(500).json({ message: 'Internal server error while creating batch.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
