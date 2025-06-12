
// API route to get all teachers (e.g., for selection in forms)
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import type { Teacher } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!db) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }

  if (req.method === 'GET') {
    try {
      const teachersSnapshot = await db.collection('teachers').where('status', '==', 'active').get(); // Only active teachers
      const teachers: Teacher[] = teachersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Teacher));
      res.status(200).json(teachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      res.status(500).json({ message: 'Internal server error while fetching teachers.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
