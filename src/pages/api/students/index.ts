
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
    const { department, searchTerm, limit = '20', startAfter, status, simple } = req.query;
    const parsedLimit = parseInt(limit as string, 10);

    // Special case for passed_out students: fetch all without pagination
    if (status === 'passed_out') {
      const passedOutSnapshot = await db.collection('students').where('status', '==', 'passed_out').get();
      const students: Student[] = passedOutSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Student));
      return res.status(200).json({ students, lastVisibleDoc: null });
    }
    
    // Special case for dashboard simple count
    if (simple === 'true') {
        const snapshot = await db.collection('students').where('status', '!=', 'passed_out').get();
        const students: Student[] = snapshot.docs.map(doc => {
            const data = doc.data();
            // Only return the fields necessary for the dashboard count to be efficient
            return {
                id: doc.id,
                academics: data.academics || {},
            } as Partial<Student> as Student;
        });
        return res.status(200).json({ students, lastVisibleDoc: null });
    }

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
      
      // Post-filter the search results
      students = students.filter(student => student.status !== 'passed_out');
      if (department && department !== 'all' && typeof department === 'string') {
        students = students.filter(student => student.department === department);
      }
      
      return res.status(200).json({ students: students.slice(0, parsedLimit), lastVisibleDoc: null });
    }

    // Default path: Paginated list without search term.
    let query: Query = db.collection('students');
    
    // Apply department filter if present.
    if (department && department !== 'all' && typeof department === 'string') {
      query = query.where('department', '==', department);
    }
    
    // IMPORTANT FIX: Only apply orderBy if no department filter is active.
    // Firestore requires a composite index for where() + orderBy() on different fields.
    // By removing the orderBy, we avoid the error. We can sort on the client if needed.
    if (!department || department === 'all') {
        query = query.orderBy('studentId');
    }

    if (startAfter && typeof startAfter === 'string') {
        const lastVisibleDocData = JSON.parse(startAfter);
        const docRef = db.collection('students').doc(lastVisibleDocData.id);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            query = query.startAfter(docSnap);
        }
    }

    const finalQuery = query.limit(parsedLimit * 2); // Fetch more to account for client-side filtering
    const studentsSnapshot = await finalQuery.get();
    
    // Filter out passed_out students on the backend before sending
    let students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as Student)).filter(s => s.status !== 'passed_out');

    // If we couldn't sort by the DB, sort results now.
    if (department && department !== 'all') {
      students.sort((a, b) => (a.studentId || '').localeCompare(b.studentId || ''));
    }

    const limitedStudents = students.slice(0, parsedLimit);

    let lastVisibleDoc = null;
    if (studentsSnapshot.docs.length > parsedLimit && limitedStudents.length > 0) {
        const lastDocInPage = limitedStudents[limitedStudents.length - 1];
        lastVisibleDoc = { id: lastDocInPage.id, studentId: lastDocInPage.studentId };
    }

    res.status(200).json({ students: limitedStudents, lastVisibleDoc });

  } catch (error: any) {
    console.error('Error fetching students:', error);
    const errorMessage = error.details || error.message || 'Internal server error while fetching students.';
    res.status(500).json({ message: errorMessage });
  }
}
