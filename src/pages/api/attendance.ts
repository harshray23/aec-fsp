
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, Timestamp } from '@/lib/firebaseAdmin';
import type { Query } from 'firebase-admin/firestore';
import type { AttendanceRecord } from '@/lib/types';
import { format, startOfDay, endOfDay } from 'date-fns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  if (!db) {
    return res.status(500).json({ message: 'Database not initialized.' });
  }

  const { studentId, batchId, date } = req.query;

  try {
    let query: Query = db.collection('attendanceRecords');

    if (studentId && typeof studentId === 'string') {
      query = query.where('studentId', '==', studentId);
    }
    if (batchId && typeof batchId === 'string') {
      query = query.where('batchId', '==', batchId);
    }
    if (date && typeof date === 'string') {
      // Query for a specific day. Firestore date queries require a range.
      // We store date as 'YYYY-MM-DD' string to make this an exact match query.
      query = query.where('date', '==', date);
    }

    const snapshot = await query.get();
    const records: AttendanceRecord[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as AttendanceRecord;
    });

    res.status(200).json(records);

  } catch (error) {
    console.error("Error fetching attendance records:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
