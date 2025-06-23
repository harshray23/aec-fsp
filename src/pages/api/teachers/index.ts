
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import type { Teacher } from '@/lib/types';
import type { UserApprovalStatus } from '@/lib/types';
import type { Query } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!db) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }

  if (req.method === 'GET') {
    try {
      const { status } = req.query;
      let query: Query = db.collection('teachers');

      if (status && typeof status === 'string') {
        if (!["active", "pending_approval", "rejected"].includes(status)) {
          return res.status(400).json({ message: 'Invalid status filter value.' });
        }
        query = query.where('status', '==', status as UserApprovalStatus);
      }
      // If no status query param, it fetches all teachers.

      const teachersSnapshot = await query.get();
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
