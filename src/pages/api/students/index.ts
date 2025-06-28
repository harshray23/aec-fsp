
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
      
      let students: Student[] = [];

      if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim().length > 0) {
        const term = searchTerm.trim();
        const studentsMap = new Map<string, Student>();

        // Because Firestore doesn't support OR queries on different fields,
        // we run multiple queries and merge the results.
        const nameQuery = db.collection('students').where('name', '>=', term).where('name', '<=', term + '\uf8ff');
        const rollNumberQuery = db.collection('students').where('rollNumber', '>=', term).where('rollNumber', '<=', term + '\uf8ff');
        const studentIdQuery = db.collection('students').where('studentId', '>=', term).where('studentId', '<=', term + '\uf8ff');
        const emailQuery = db.collection('students').where('email', '>=', term).where('email', '<=', term + '\uf8ff');
        
        const [nameSnap, rollSnap, idSnap, emailSnap] = await Promise.all([
            nameQuery.get(),
            rollNumberQuery.get(),
            studentIdQuery.get(),
            emailQuery.get(),
        ]);

        const addToMap = (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
            if (!studentsMap.has(doc.id)) {
                studentsMap.set(doc.id, { id: doc.id, ...doc.data() } as Student);
            }
        };

        nameSnap.docs.forEach(addToMap);
        rollSnap.docs.forEach(addToMap);
        idSnap.docs.forEach(addToMap);
        emailSnap.docs.forEach(addToMap);
        
        students = Array.from(studentsMap.values());

      } else {
        const studentsSnapshot = await db.collection('students').get();
        students = studentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Student));
      }
      
      // Apply department filter after fetching and merging search results
      if (department && department !== 'all' && typeof department === 'string') {
        students = students.filter(student => student.department === department);
      }

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
