
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import type { Admin } from '@/lib/types';
import type { UserApprovalStatus } from '@/lib/types';
import type { Query } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!db) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }

  if (req.method === 'GET') {
    try {
      const { status } = req.query;
      let query: Query = db.collection('admins');

      if (status && typeof status === 'string') {
        if (!["active", "pending_approval", "rejected"].includes(status)) {
          return res.status(400).json({ message: 'Invalid status filter value.' });
        }
        query = query.where('status', '==', status as UserApprovalStatus);
      }

      const adminsSnapshot = await query.get();
      const admins: Admin[] = adminsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Admin));
      res.status(200).json(admins);
    } catch (error) {
      console.error('Error fetching admins:', error);
      res.status(500).json({ message: 'Internal server error while fetching admins.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
