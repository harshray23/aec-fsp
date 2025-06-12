
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import type { Batch, Student } from '@/lib/types';
import { Timestamp } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!db) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const batchesSnapshot = await db.collection('batches').get();
        const batches: Batch[] = batchesSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Ensure startDate is ISO string if stored as Timestamp
            startDate: data.startDate instanceof Timestamp ? data.startDate.toDate().toISOString() : data.startDate,
          } as Batch;
        });
        res.status(200).json(batches);
      } catch (error) {
        console.error('Error fetching batches:', error);
        res.status(500).json({ message: 'Internal server error while fetching batches.' });
      }
      break;

    case 'POST':
      try {
        const { name, department, topic, teacherId, startDate, daysOfWeek, startTime, endTime, roomNumber, selectedStudentIds, status = "Scheduled" } = req.body;

        if (!name || !department || !topic || !teacherId || !startDate || !daysOfWeek || !startTime || !endTime) {
          return res.status(400).json({ message: 'Missing required batch fields.' });
        }
        
        const newBatchData: Omit<Batch, 'id'> = {
          name,
          department,
          topic,
          teacherId,
          startDate, // Assuming it's already an ISO string from client
          daysOfWeek,
          startTime,
          endTime,
          roomNumber: roomNumber || null,
          studentIds: selectedStudentIds || [],
          status,
        };

        const batchRef = await db.collection('batches').add(newBatchData);
        const newBatchId = batchRef.id;

        // Update assigned students in a batch write
        if (selectedStudentIds && selectedStudentIds.length > 0) {
          const batchWrite = db.batch();
          const studentsRef = db.collection('students');
          
          // First, unassign students from any old batches if they were in one
          // This logic might be complex if students can be in multiple batches or if this is a true "move"
          // For simplicity, this create operation just assigns. Re-assignment logic is better in an "update student" or "assign student to batch" dedicated API.
          // However, if a student is ALREADY in a batch, we should ideally handle that.
          // For now, we will overwrite. A more robust system might prevent assigning a student already in another active batch.

          for (const studentId of selectedStudentIds) {
            // Find student document by 'studentId' field, not Firestore ID.
            // This assumes 'studentId' is a unique field on your student documents.
            // If studentId in selectedStudentIds refers to Firestore document ID, then use studentsRef.doc(studentId)
            const studentQuerySnapshot = await studentsRef.where('studentId', '==', studentId).limit(1).get();
            if (!studentQuerySnapshot.empty) {
                const studentDocRef = studentQuerySnapshot.docs[0].ref;
                batchWrite.update(studentDocRef, { batchId: newBatchId });
            } else {
                // If selectedStudentIds are Firestore document IDs:
                // const studentDocRef = studentsRef.doc(studentId);
                // batchWrite.update(studentDocRef, { batchId: newBatchId });
                console.warn(`Student with ID (field) ${studentId} not found, cannot assign to batch ${newBatchId}. If these are document IDs, adjust query.`);
            }
          }
          await batchWrite.commit();
        }

        res.status(201).json({ message: 'Batch created successfully', batch: { id: newBatchId, ...newBatchData } });
      } catch (error) {
        console.error('Error creating batch:', error);
        res.status(500).json({ message: 'Internal server error while creating batch.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
