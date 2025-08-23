// src/pages/api/announcements/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, Timestamp } from '@/lib/firebaseAdmin';
import type { Announcement } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!db) {
    return res.status(500).json({ message: 'Database not initialized.' });
  }

  // Set Cache-Control headers to prevent caching on the client-side.
  // This ensures users always get the latest announcements.
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');


  switch (req.method) {
    case 'GET':
      try {
        const announcementsSnapshot = await db.collection('announcements').orderBy('timestamp', 'desc').limit(10).get();
        const announcements: Announcement[] = announcementsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: (data.timestamp as Timestamp).toMillis(),
          } as Announcement;
        });
        res.status(200).json(announcements);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ message: 'Internal server error while fetching announcements.' });
      }
      break;

    case 'POST':
      try {
        const { message, sender } = req.body;
        if (!message || !sender) {
          return res.status(400).json({ message: 'Message and sender are required.' });
        }

        const newAnnouncement: Omit<Announcement, 'id'> = {
          message,
          sender,
          timestamp: Timestamp.now().toMillis(),
        };

        const docRef = await db.collection('announcements').add({
            ...newAnnouncement,
            timestamp: Timestamp.fromMillis(newAnnouncement.timestamp),
        });

        res.status(201).json({ id: docRef.id, ...newAnnouncement });
      } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ message: 'Internal server error while creating announcement.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
