// src/pages/api/announcements/[announcementId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { announcementId } = req.query;

  if (!db) {
    return res.status(500).json({ message: 'Database not initialized.' });
  }
  if (typeof announcementId !== 'string') {
    return res.status(400).json({ message: 'Announcement ID must be a string.' });
  }

  const announcementRef = db.collection('announcements').doc(announcementId);

  switch (req.method) {
    case 'PUT':
      try {
        const { message } = req.body;
        if (!message) {
          return res.status(400).json({ message: 'Message is required for update.' });
        }
        await announcementRef.update({ message });
        res.status(200).json({ message: 'Announcement updated successfully.' });
      } catch (error) {
        console.error(`Error updating announcement ${announcementId}:`, error);
        res.status(500).json({ message: 'Internal server error while updating announcement.' });
      }
      break;

    case 'DELETE':
      try {
        await announcementRef.delete();
        res.status(200).json({ message: 'Announcement deleted successfully.' });
      } catch (error) {
        console.error(`Error deleting announcement ${announcementId}:`, error);
        res.status(500).json({ message: 'Internal server error while deleting announcement.' });
      }
      break;

    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
