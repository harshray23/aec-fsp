
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, Timestamp } from '@/lib/firebaseAdmin';
import type { Batch } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { batchId } = req.query;

  if (!db) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }

  if (typeof batchId !== 'string') {
    return res.status(400).json({ message: 'Batch ID must be a string.' });
  }

  const batchRef = db.collection('batches').doc(batchId);

  switch (req.method) {
    case 'GET':
      try {
        const doc = await batchRef.get();
        if (!doc.exists) {
          return res.status(404).json({ message: 'Batch not found.' });
        }
        const data = doc.data();
        const batch = { 
            id: doc.id, 
            ...data,
            startDate: data?.startDate instanceof Timestamp ? data.startDate.toDate().toISOString() : data?.startDate,
            endDate: data?.endDate instanceof Timestamp ? data.endDate.toDate().toISOString() : data?.endDate,
        } as Batch;
        res.status(200).json(batch);
      } catch (error) {
        console.error(`Error fetching batch ${batchId}:`, error);
        res.status(500).json({ message: 'Internal server error while fetching batch.' });
      }
      break;

    case 'PUT':
      try {
        const currentDoc = await batchRef.get();
        if (!currentDoc.exists) {
          return res.status(404).json({ message: 'Batch not found to update.' });
        }
        
        const oldBatchData = currentDoc.data() as Batch;
        const oldStudentIds = oldBatchData.studentIds || [];
        
        const { studentIds: newStudentIds, ...updateData } = req.body;
        
        const finalUpdateData = { ...updateData, studentIds: newStudentIds || [] };

        const addedStudents = (newStudentIds || []).filter((id: string) => !oldStudentIds.includes(id));
        const removedStudents = oldStudentIds.filter((id: string) => !(newStudentIds || []).includes(id));
        
        const transaction = db.runTransaction(async t => {
            // 1. Update the batch document itself
            t.update(batchRef, finalUpdateData);

            // 2. Add batchId to newly assigned students
            addedStudents.forEach((studentId: string) => {
                const studentRef = db.collection('students').doc(studentId);
                t.update(studentRef, { batchIds: FieldValue.arrayUnion(batchId) });
            });

            // 3. Remove batchId from unassigned students
            removedStudents.forEach((studentId: string) => {
                const studentRef = db.collection('students').doc(studentId);
                t.update(studentRef, { batchIds: FieldValue.arrayRemove(batchId) });
            });
        });

        await transaction;
        
        const updatedDoc = await batchRef.get();
        const batchWithId = { id: batchId, ...updatedDoc.data() };
        
        res.status(200).json({ message: `Batch ${batchId} updated successfully.`, batch: batchWithId });

      } catch (error) {
        console.error(`Error updating batch ${batchId}:`, error);
        res.status(500).json({ message: 'Internal server error while updating batch.' });
      }
      break;

    case 'DELETE':
      try {
        const doc = await batchRef.get();
        if (!doc.exists) {
          return res.status(404).json({ message: 'Batch not found to delete.' });
        }

        // Unassign students from this batch
        const studentsToUpdateSnapshot = await db.collection('students').where('batchIds', 'array-contains', batchId).get();
        if (!studentsToUpdateSnapshot.empty) {
          const studentBatchWrite = db.batch();
          studentsToUpdateSnapshot.docs.forEach(studentDoc => {
            studentBatchWrite.update(studentDoc.ref, { batchIds: FieldValue.arrayRemove(batchId) });
          });
          await studentBatchWrite.commit();
        }
        
        await batchRef.delete();
        res.status(200).json({ message: `Batch ${batchId} deleted successfully.` });
      } catch (error) {
        console.error(`Error deleting batch ${batchId}:`, error);
        res.status(500).json({ message: 'Internal server error while deleting batch.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
