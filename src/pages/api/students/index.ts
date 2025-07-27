
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import type { Student } from '@/lib/types';
import type { Query, DocumentSnapshot } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!db) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
  
  try {
    const { department, searchTerm, limit = '20', startAfter, status } = req.query;
    const parsedLimit = parseInt(limit as string, 10);
    
    // If a search term is provided, handle search separately as it's a special case.
    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim().length > 0) {
      const term = searchTerm.trim().toLowerCase();
      const studentsMap = new Map<string, Student>();

      // This is a simplified search. A real-world app would use a search service like Algolia/Elasticsearch.
      const nameQuery = db.collection('students').orderBy('name').startAt(term).endAt(term + '\uf8ff').get();
      const emailQuery = db.collection('students').orderBy('email').startAt(term).endAt(term + '\uf8ff').get();
      const rollNumberQuery = db.collection('students').orderBy('rollNumber').startAt(term).endAt(term + '\uf8ff').get();

      const [nameSnapshot, emailSnapshot, rollNumberSnapshot] = await Promise.all([nameQuery, emailQuery, rollNumberQuery]);
      
      const processSnapshot = (snapshot: FirebaseFirestore.QuerySnapshot) => {
          snapshot.docs.forEach(doc => {
              if (!studentsMap.has(doc.id)) {
                  studentsMap.set(doc.id, { id: doc.id, ...doc.data() } as Student);
              }
          });
      };

      processSnapshot(nameSnapshot);
      processSnapshot(emailSnapshot);
      processSnapshot(rollNumberSnapshot);
      
      let students = Array.from(studentsMap.values());

      if (department && department !== 'all' && typeof department === 'string') {
        students = students.filter(student => student.department === department);
      }
      
      return res.status(200).json({ students: students.slice(0, parsedLimit), lastVisibleId: null });
    }

    // Default path: Paginated list without search term.
    let query: Query = db.collection('students');

    if (status && typeof status === 'string') {
      query = query.where('status', '==', status);
    }
    
    // IMPORTANT: This was the source of the error. A compound query requires a composite index.
    // By filtering on department first and then ordering, we simplify the query.
    if (department && department !== 'all' && typeof department === 'string') {
      query = query.where('department', '==', department);
    }
    
    query = query.orderBy('studentId');

    if (startAfter && typeof startAfter === 'string') {
      const lastVisibleDoc = await db.collection('students').doc(startAfter).get();
      if (lastVisibleDoc.exists) {
        query = query.startAfter(lastVisibleDoc);
      } else {
        console.warn(`startAfter document with ID ${startAfter} does not exist.`);
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

  } catch (error: any) {
    console.error('Error fetching students:', error);
    // Provide a more descriptive error message if available from Firestore
    const errorMessage = error.details || error.message || 'Internal server error while fetching students.';
    res.status(500).json({ message: errorMessage });
  }
}
