
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import type { Host } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!db) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }

  if (req.method === 'GET') {
    try {
      const hostsSnapshot = await db.collection('hosts').get();
      const hosts: Host[] = hostsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Host));
      res.status(200).json(hosts);
    } catch (error) {
      console.error('Error fetching hosts:', error);
      res.status(500).json({ message: 'Internal server error while fetching hosts.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
