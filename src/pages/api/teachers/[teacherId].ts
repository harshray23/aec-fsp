
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import type { Teacher } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teacherId } = req.query;

  if (!db) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }

  if (typeof teacherId !== 'string') {
    return res.status(400).json({ message: 'Teacher ID must be a string.' });
  }

  const teacherRef = db.collection('teachers').doc(teacherId);

  switch (req.method) {
    case 'GET':
      try {
        const doc = await teacherRef.get();
        if (!doc.exists) {
          return res.status(404).json({ message: 'Teacher not found.' });
        }
        res.status(200).json({ id: doc.id, ...doc.data() } as Teacher);
      } catch (error) {
        console.error(`Error fetching teacher ${teacherId}:`, error);
        res.status(500).json({ message: 'Internal server error while fetching teacher.' });
      }
      break;

    case 'PUT':
      try {
        const currentDoc = await teacherRef.get();
        if (!currentDoc.exists) {
          return res.status(404).json({ message: 'Teacher not found to update.' });
        }
        // Only allow updating certain fields from a general PUT,
        // Host approval flow might have more specific logic for status/username.
        const { name, department, email, phoneNumber, whatsappNumber, status, username } = req.body;
        const updateData: Partial<Teacher> = {};

        if (name !== undefined) updateData.name = name;
        if (department !== undefined) updateData.department = department;
        if (email !== undefined) updateData.email = email; // Be careful if email is used as a unique login identifier
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
        if (status !== undefined) updateData.status = status;
        if (username !== undefined) updateData.username = username;


        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No fields provided for update.' });
        }

        await teacherRef.update(updateData);
        res.status(200).json({ message: `Teacher ${teacherId} updated successfully.`, teacher: { id: teacherId, ...updateData } });
      } catch (error) {
        console.error(`Error updating teacher ${teacherId}:`, error);
        res.status(500).json({ message: 'Internal server error while updating teacher.' });
      }
      break;

    case 'DELETE':
      try {
        const doc = await teacherRef.get();
        if (!doc.exists) {
          return res.status(404).json({ message: 'Teacher not found to delete.' });
        }

        const batchWrite = db.batch();

        // Find batches assigned to this teacher and unassign them
        const batchesAssignedQuery = db.collection('batches').where('teacherId', '==', teacherId);
        const batchesSnapshot = await batchesAssignedQuery.get();
        batchesSnapshot.forEach(batchDoc => {
          batchWrite.update(batchDoc.ref, { teacherId: null }); // or a placeholder like 'UNASSIGNED'
        });
        
        // Delete the teacher document
        batchWrite.delete(teacherRef);
        
        await batchWrite.commit();
        
        res.status(200).json({ message: `Teacher ${teacherId} deleted successfully and unassigned from batches.` });
      } catch (error) {
        console.error(`Error deleting teacher ${teacherId}:`, error);
        res.status(500).json({ message: 'Internal server error while deleting teacher.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
