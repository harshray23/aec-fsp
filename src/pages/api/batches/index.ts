
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, Timestamp } from '@/lib/firebaseAdmin';
import type { Batch } from '@/lib/types';

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
        const batchPayload: Omit<Batch, 'id'> = req.body;

        if (!batchPayload.name || !batchPayload.topic || !batchPayload.teacherIds) {
          return res.status(400).json({ message: 'Missing required fields for batch creation.' });
        }
        
        // Ensure studentIds is an empty array if not provided
        if (!batchPayload.studentIds) {
          batchPayload.studentIds = [];
        }

        const batchRef = await db.collection('batches').add(batchPayload);
        const newBatchId = batchRef.id;

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
