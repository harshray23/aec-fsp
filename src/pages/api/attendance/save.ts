
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

  const { records, remarks, batchId, date, subject } = req.body;
  // `records` is expected to be an object like: { studentId1: 'present', studentId2: 'absent' }
  // `remarks` is expected to be an object like: { studentId1: 'Good work', studentId2: 'Missed quiz' }

  if (!records || typeof records !== 'object' || !batchId || !date || !subject) {
    return res.status(400).json({ message: 'Missing required fields: records, batchId, date, subject' });
  }

  try {
    const attendanceCollection = db.collection('attendanceRecords');

    // Fetch all existing records for this day and batch in one query
    const q = attendanceCollection.where('batchId', '==', batchId).where('date', '==', date);
    const existingDocsSnap = await q.get();
    
    const existingRecordsMap = new Map<string, {docId: string, status: string, remarks?: string}>();
    existingDocsSnap.forEach(doc => {
      existingRecordsMap.set(doc.data().studentId, { 
          docId: doc.id, 
          status: doc.data().status,
          remarks: doc.data().remarks
      });
    });

    const writeBatch = db.batch();

    for (const studentId in records) {
        if (Object.prototype.hasOwnProperty.call(records, studentId)) {
            const newStatus = records[studentId];
            const newRemark = remarks ? remarks[studentId] : undefined;
            const existingRecord = existingRecordsMap.get(studentId);

            if (existingRecord) {
                // Update if status or remark is different
                const updatePayload: { status: string; remarks?: string } = { status: newStatus };
                if (newRemark !== undefined) {
                    updatePayload.remarks = newRemark;
                }
                
                if (existingRecord.status !== newStatus || (newRemark !== undefined && existingRecord.remarks !== newRemark)) {
                    const docRef = attendanceCollection.doc(existingRecord.docId);
                    writeBatch.update(docRef, updatePayload);
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
                    remarks: newRemark || "",
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
