
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import type { Student } from '@/lib/types';
import type { Query } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!db) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }

  if (req.method === 'GET') {
    try {
      const { department, searchTerm } = req.query;
      let query: Query = db.collection('students');

      if (department && department !== 'all' && typeof department === 'string') {
        query = query.where('department', '==', department);
      }

      if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim().length > 0) {
        const term = searchTerm.trim();
        // This performs a "starts-with" search. It's case-sensitive.
        // For case-insensitivity, a common pattern is to store a lowercase version of the name.
        query = query.where('name', '>=', term)
                     .where('name', '<=', term + '\uf8ff');
      }

      const studentsSnapshot = await query.get();
      const students: Student[] = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Student));
      
      res.status(200).json(students);

    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: 'Internal server error while fetching students.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
