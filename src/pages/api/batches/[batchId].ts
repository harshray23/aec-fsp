
import type { NextApiRequest, NextApiResponse } from 'next';
import { batches as mockBatches, students as mockStudents } from '@/lib/mockData';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { batchId } = req.query;

  if (typeof batchId !== 'string') {
    return res.status(400).json({ message: 'Batch ID must be a string.' });
  }

  if (req.method === 'DELETE') {
    const batchIndex = mockBatches.findIndex(b => b.id === batchId);

    if (batchIndex === -1) {
      return res.status(404).json({ message: 'Batch not found.' });
    }

    // Remove the batch
    mockBatches.splice(batchIndex, 1);

    // Unassign students from this batch
    mockStudents.forEach(student => {
      if (student.batchId === batchId) {
        student.batchId = undefined; 
      }
    });

    return res.status(200).json({ message: `Batch ${batchId} deleted successfully.` });
  } else {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
