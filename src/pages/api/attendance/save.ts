
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

  const { records, remarks, batchId, date, subject, batchHalf } = req.body;
  // `records` is expected to be an object like: { studentId1: 'present', studentId2: 'absent' }
  // `remarks` is expected to be an object like: { studentId1: 'Good work', studentId2: 'Missed quiz' }

  if (!records || typeof records !== 'object' || !batchId || !date || !subject || !batchHalf) {
    return res.status(400).json({ message: 'Missing required fields: records, batchId, date, subject, batchHalf' });
  }

  try {
    const attendanceCollection = db.collection('attendanceRecords');

    // Fetch all existing records for this day, batch, and half in one query
    const q = attendanceCollection.where('batchId', '==', batchId).where('date', '==', date).where('batchHalf', '==', batchHalf);
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
                const updatePayload: { [key: string]: any } = {};
                
                if (existingRecord.status !== newStatus) {
                  updatePayload.status = newStatus;
                }
                if (newRemark !== undefined && existingRecord.remarks !== newRemark) {
                  updatePayload.remarks = newRemark;
                }

                if (Object.keys(updatePayload).length > 0) {
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
                    batchHalf: batchHalf,
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
