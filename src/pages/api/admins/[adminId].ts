
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import type { Admin } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { adminId } = req.query;

  if (!db) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }

  if (typeof adminId !== 'string') {
    return res.status(400).json({ message: 'Admin ID must be a string.' });
  }

  const adminRef = db.collection('admins').doc(adminId);

  switch (req.method) {
    case 'GET':
      try {
        const doc = await adminRef.get();
        if (!doc.exists) {
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
        const currentDoc = await adminRef.get();
        if (!currentDoc.exists) {
          return res.status(404).json({ message: 'Admin not found to update.' });
        }
        
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
        res.status(200).json({ message: `Admin ${adminId} updated successfully.`, admin: { id: adminId, ...updateData } });
      } catch (error) {
        console.error(`Error updating admin ${adminId}:`, error);
        res.status(500).json({ message: 'Internal server error while updating admin.' });
      }
      break;

    case 'DELETE':
      try {
        const doc = await adminRef.get();
        if (!doc.exists) {
          return res.status(404).json({ message: 'Admin not found to delete.' });
        }
        
        // Before deleting an admin, consider implications:
        // - Are they the last admin?
        // - Are there any system resources exclusively owned/managed by this admin?
        // For this example, we'll proceed with a simple delete.
        // In a real app, you might want to prevent deletion of the primary admin or transfer ownership.
        
        await adminRef.delete();
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
