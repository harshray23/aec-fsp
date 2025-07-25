
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, auth as adminAuth } from '@/lib/firebaseAdmin';
import type { Admin } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { adminId } = req.query; // This can be the Firestore Doc ID or the Firebase UID

  if (!db || !adminAuth) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }

  if (typeof adminId !== 'string') {
    return res.status(400).json({ message: 'Admin ID must be a string.' });
  }
  
  // A helper function to get the document reference, whether by UID or Doc ID
  async function getAdminDocRef(id: string) {
    // Prefer querying by the UID field, as it's the most stable identifier from Auth.
    const querySnapshot = await db.collection('admins').where('uid', '==', id).limit(1).get();
    if (!querySnapshot.empty) {
        return querySnapshot.docs[0].ref;
    }
    
    // As a fallback, try treating the ID as a document ID.
    const docRef = db.collection('admins').doc(id);
    const doc = await docRef.get();
    if (doc.exists) {
        return docRef;
    }

    return null; // Not found by any method
  }

  const adminRef = await getAdminDocRef(adminId);
  
  if (!adminRef) {
      return res.status(404).json({ message: `Admin with identifier ${adminId} not found.` });
  }


  switch (req.method) {
    case 'GET':
      try {
        const doc = await adminRef.get();
        if (!doc.exists) {
          // This case should be covered by getAdminDocRef, but as a safeguard:
          return res.status(404).json({ message: 'Admin not found.' });
        }
        res.status(200).json({ id: doc.id, ...doc.data() } as Admin);
      } catch (error) {
        console.error(`Error fetching admin ${adminId}:`, error);
        res.status(500).json({ message: 'Internal server error while fetching admin.' });
      }
      break;

    case 'PUT':
      try {
        const { name, email, phoneNumber, whatsappNumber, status, username } = req.body;
        const updateData: Partial<Admin> = {};

        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
        if (status !== undefined) updateData.status = status;
        if (username !== undefined) updateData.username = username;


        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No fields provided for update.' });
        }
        
        await adminRef.update(updateData);
        const updatedDoc = await adminRef.get();
        res.status(200).json({ message: `Admin ${adminId} updated successfully.`, admin: { id: adminRef.id, ...updatedDoc.data() } });
      } catch (error) {
        console.error(`Error updating admin ${adminId}:`, error);
        res.status(500).json({ message: 'Internal server error while updating admin.' });
      }
      break;

    case 'DELETE':
      try {
        const doc = await adminRef.get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Admin not found.' });
        }
        const adminData = doc.data() as Admin;
        const uid = adminData.uid;

        await adminRef.delete();
        
        if (uid) {
            try {
                await adminAuth.deleteUser(uid);
            } catch (authError: any) {
                if (authError.code !== 'auth/user-not-found') {
                    console.error(`Failed to delete Firebase Auth user ${uid}, but Firestore document was deleted. Manual cleanup may be required. Error: ${authError.message}`);
                }
            }
        }
        
        res.status(200).json({ message: `Admin ${adminId} deleted successfully.` });
      } catch (error) {
        console.error(`Error deleting admin ${adminId}:`, error);
        res.status(500).json({ message: 'Internal server error while deleting admin.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
