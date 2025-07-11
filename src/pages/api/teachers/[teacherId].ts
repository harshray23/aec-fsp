
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, auth as adminAuth } from '@/lib/firebaseAdmin';
import type { Teacher } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { teacherId } = req.query; // Can be doc ID or UID

  if (!db || !adminAuth) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }
  if (typeof teacherId !== 'string') {
    return res.status(400).json({ message: 'Teacher ID must be a string.' });
  }

  // Helper to find the teacher document by UID or Doc ID
  async function getTeacherDocRef(id: string) {
    const querySnapshot = await db.collection('teachers').where('uid', '==', id).limit(1).get();
    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].ref;
    }
    const docRef = db.collection('teachers').doc(id);
    const doc = await docRef.get();
    if (doc.exists) return docRef;
    
    return null;
  }

  const teacherRef = await getTeacherDocRef(teacherId);

  if (!teacherRef) {
    return res.status(404).json({ message: `Teacher with identifier ${teacherId} not found.` });
  }
  
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
        const { name, department, email, phoneNumber, whatsappNumber, status, username } = req.body;
        const updateData: Partial<Teacher> = {};

        if (name !== undefined) updateData.name = name;
        if (department !== undefined) updateData.department = department;
        if (email !== undefined) updateData.email = email;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
        if (status !== undefined) updateData.status = status;
        if (username !== undefined) updateData.username = username;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No fields provided for update.' });
        }

        await teacherRef.update(updateData);
        const updatedDoc = await teacherRef.get();
        res.status(200).json({ message: `Teacher ${teacherId} updated successfully.`, teacher: { id: teacherRef.id, ...updatedDoc.data() } });
      } catch (error) {
        console.error(`Error updating teacher ${teacherId}:`, error);
        res.status(500).json({ message: 'Internal server error while updating teacher.' });
      }
      break;

    case 'DELETE':
      try {
        const doc = await teacherRef.get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Teacher not found.' });
        }
        const teacherData = doc.data() as Teacher;
        const uid = teacherData.uid;

        const batchWrite = db.batch();
        
        // Find all batches the teacher is assigned to and remove them
        const batchesAssignedQuery = db.collection('batches').where('teacherIds', 'array-contains', teacherRef.id);
        const batchesSnapshot = await batchesAssignedQuery.get();
        batchesSnapshot.forEach(batchDoc => {
          batchWrite.update(batchDoc.ref, { teacherIds: FieldValue.arrayRemove(teacherRef.id) });
        });
        
        batchWrite.delete(teacherRef);
        await batchWrite.commit();
        
        if (uid) {
            try {
                 await adminAuth.deleteUser(uid); 
            } catch (authError: any) {
                 if (authError.code !== 'auth/user-not-found') {
                    console.error(`Failed to delete Firebase Auth user ${uid}, but Firestore document was deleted. Manual cleanup may be required. Error: ${authError.message}`);
                }
            }
        }
        
        res.status(200).json({ message: `Teacher ${teacherId} deleted successfully.` });
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
