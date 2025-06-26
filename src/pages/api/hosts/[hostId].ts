
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import type { Host } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { hostId } = req.query;

  if (!db) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }

  if (typeof hostId !== 'string') {
    return res.status(400).json({ message: 'Host ID must be a string.' });
  }
  
  // A more robust lookup function, similar to other user type endpoints
  async function getHostDocRef(id: string) {
    // Prefer querying by the UID field, as it's the most stable identifier from Auth.
    const query = db.collection('hosts').where('uid', '==', id).limit(1);
    const snapshot = await query.get();
    if (!snapshot.empty) {
        return snapshot.docs[0].ref;
    }
    
    // As a fallback, try treating the ID as a document ID.
    // This is useful if the seeder correctly aligns UID and Doc ID.
    const docRef = db.collection('hosts').doc(id);
    const doc = await docRef.get();
    if (doc.exists) {
        return docRef;
    }

    return null; // Not found by any method
  }


  switch (req.method) {
    case 'GET':
      try {
        const hostRef = await getHostDocRef(hostId);

        if (!hostRef) {
             return res.status(404).json({ message: 'Host not found.' });
        }

        const doc = await hostRef.get();
        // This check is slightly redundant because getHostDocRef ensures it, but it's safe.
        if (!doc.exists) {
          return res.status(404).json({ message: 'Host not found.' });
        }
        res.status(200).json({ id: doc.id, ...doc.data() } as Host);
      } catch (error) {
        console.error(`Error fetching host ${hostId}:`, error);
        res.status(500).json({ message: 'Internal server error while fetching host.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
