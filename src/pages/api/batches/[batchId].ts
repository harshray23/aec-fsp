
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import type { Batch } from '@/lib/types';
import { Timestamp } // Import Timestamp
from 'firebase-admin/firestore';


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
            // Ensure startDate is ISO string if stored as Timestamp
            startDate: data?.startDate instanceof Timestamp ? data.startDate.toDate().toISOString() : data?.startDate,
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

        const updateData = req.body;
        // Ensure studentIds is an array, even if it's empty or not provided in updateData
        if (updateData.studentIds && !Array.isArray(updateData.studentIds)) {
            return res.status(400).json({ message: 'studentIds must be an array.' });
        }

        // Handle student assignments/unassignments if studentIds are changing
        const oldStudentIds = (currentDoc.data()?.studentIds || []) as string[];
        const newStudentIds = (updateData.studentIds || []) as string[];

        const studentsToUnassign = oldStudentIds.filter(id => !newStudentIds.includes(id));
        const studentsToAssign = newStudentIds.filter(id => !oldStudentIds.includes(id));
        
        const batchWrite = db.batch();

        // Unassign students
        for (const studentDocId of studentsToUnassign) {
          // Assuming studentDocId is the Firestore document ID of the student
          const studentRef = db.collection('students').doc(studentDocId);
          batchWrite.update(studentRef, { batchId: null }); // or FieldValue.delete()
        }

        // Assign new students
        for (const studentDocId of studentsToAssign) {
           const studentRef = db.collection('students').doc(studentDocId);
           batchWrite.update(studentRef, { batchId: batchId });
        }
        
        // Perform the batch update for student assignments
        if (studentsToUnassign.length > 0 || studentsToAssign.length > 0) {
            await batchWrite.commit();
        }
        
        // Update the batch document itself
        // Make sure not to overwrite studentIds if it's not part of updateData but handled separately
        const batchUpdatePayload = { ...updateData };
        // If studentIds was handled above, ensure the batch document reflects the final state.
        // If updateData.studentIds is the source of truth for the PUT, this is fine.
        // If not, you might need to merge `currentDoc.data().studentIds` with `newStudentIds` logic.
        // For simplicity, this example assumes updateData.studentIds is the new desired state.
        
        await batchRef.update(batchUpdatePayload);
        
        res.status(200).json({ message: `Batch ${batchId} updated successfully.`, batch: { id: batchId, ...batchUpdatePayload } });
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
        const studentsToUpdateSnapshot = await db.collection('students').where('batchId', '==', batchId).get();
        if (!studentsToUpdateSnapshot.empty) {
          const studentBatchWrite = db.batch();
          studentsToUpdateSnapshot.docs.forEach(studentDoc => {
            studentBatchWrite.update(studentDoc.ref, { batchId: null }); // or FieldValue.delete()
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
