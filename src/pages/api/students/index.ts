
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
      const { department, searchTerm, limit = '20', startAfter, status } = req.query;
      const parsedLimit = parseInt(limit as string, 10);
      
      // If a search term is provided, handle search separately.
      // Note: A robust, scalable search usually requires a dedicated search service like Algolia or Typesense.
      // This implementation performs multiple queries and merges them, which does not support pagination easily.
      if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim().length > 0) {
        const term = searchTerm.trim();
        const studentsMap = new Map<string, Student>();

        const queries = [
          db.collection('students').where('name', '>=', term).where('name', '<=', term + '\uf8ff'),
          db.collection('students').where('rollNumber', '>=', term).where('rollNumber', '<=', term + '\uf8ff'),
          db.collection('students').where('studentId', '>=', term).where('studentId', '<=', term + '\uf8ff'),
          db.collection('students').where('email', '>=', term).where('email', '<=', term + '\uf8ff'),
        ];
        
        const snapshots = await Promise.all(queries.map(q => q.get()));
        
        snapshots.forEach(snapshot => {
            snapshot.docs.forEach(doc => {
                if (!studentsMap.has(doc.id)) {
                    studentsMap.set(doc.id, { id: doc.id, ...doc.data() } as Student);
                }
            });
        });
        
        let students = Array.from(studentsMap.values());

        // Apply department filter after merging search results
        if (department && department !== 'all' && typeof department === 'string') {
          students = students.filter(student => student.department === department);
        }
        
        // Pagination is disabled for search results due to complexity of merging multiple queries.
        return res.status(200).json({ students, lastVisibleId: null });
      }

      // Default path: Paginated list without search term.
      let query: Query = db.collection('students').orderBy('studentId');

      if (department && department !== 'all' && typeof department === 'string') {
        query = query.where('department', '==', department);
      }
      
      if (status && typeof status === 'string') {
        query = query.where('status', '==', status);
      }

      if (startAfter && typeof startAfter === 'string') {
        const lastVisibleDoc = await db.collection('students').doc(startAfter).get();
        if (lastVisibleDoc.exists) {
          query = query.startAfter(lastVisibleDoc);
        }
      }

      const finalQuery = query.limit(parsedLimit);

      const studentsSnapshot = await finalQuery.get();
      const students: Student[] = studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
      } as Student));

      const lastVisibleId = studentsSnapshot.docs.length > 0 ? studentsSnapshot.docs[studentsSnapshot.docs.length - 1].id : null;

      res.status(200).json({ students, lastVisibleId });

    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: 'Internal server error while fetching students.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
