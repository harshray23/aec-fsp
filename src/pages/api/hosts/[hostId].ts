
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import type { Host } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { hostId } = req.query;

  if (!db) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }

  if (typeof hostId !== 'string') {
    return res.status(400).json({ message: 'Host ID must be a string.' });
  }
  
  const hostRef = db.collection('hosts').doc(hostId);

  switch (req.method) {
    case 'GET':
      try {
        const doc = await hostRef.get();
        if (!doc.exists) {
          return res.status(404).json({ message: 'Host not found.' });
        }
        res.status(200).json({ id: doc.id, ...doc.data() } as Host);
      } catch (error) {
        console.error(`Error fetching host ${hostId}:`, error);
        res.status(500).json({ message: 'Internal server error while fetching host.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
