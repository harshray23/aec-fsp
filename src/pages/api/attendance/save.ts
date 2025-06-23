
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  if (!db) {
    return res.status(500).json({ message: 'Database not initialized' });
  }

  const { records, batchId, date, subject } = req.body;
  // `records` is expected to be an object like: { studentId1: 'present', studentId2: 'absent' }

  if (!records || typeof records !== 'object' || !batchId || !date || !subject) {
    return res.status(400).json({ message: 'Missing required fields: records, batchId, date, subject' });
  }

  try {
    const attendanceCollection = db.collection('attendanceRecords');

    // Fetch all existing records for this day and batch in one query
    const q = attendanceCollection.where('batchId', '==', batchId).where('date', '==', date);
    const existingDocsSnap = await q.get();
    
    const existingRecordsMap = new Map<string, {docId: string, status: string}>();
    existingDocsSnap.forEach(doc => {
      existingRecordsMap.set(doc.data().studentId, { docId: doc.id, status: doc.data().status });
    });

    const writeBatch = db.batch();

    for (const studentId in records) {
        if (Object.prototype.hasOwnProperty.call(records, studentId)) {
            const newStatus = records[studentId];
            const existingRecord = existingRecordsMap.get(studentId);

            if (existingRecord) {
                // Update if status is different
                if (existingRecord.status !== newStatus) {
                const docRef = attendanceCollection.doc(existingRecord.docId);
                writeBatch.update(docRef, { status: newStatus });
                }
            } else {
                // Create new record
                const newDocRef = attendanceCollection.doc(); // Auto-generate ID
                writeBatch.set(newDocRef, {
                    studentId,
                    batchId,
                    date, // Storing as YYYY-MM-DD string
                    subject,
                    status: newStatus,
                });
            }
        }
    }

    await writeBatch.commit();
    res.status(200).json({ message: 'Attendance saved successfully.' });

  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ message: 'Internal server error while saving attendance.' });
  }
}
