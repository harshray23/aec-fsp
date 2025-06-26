
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, auth as adminAuth } from '@/lib/firebaseAdmin';
import type { Host } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { hostId } = req.query;

  if (!db || !adminAuth) {
    return res.status(500).json({ message: 'Database connection not initialized.' });
  }

  if (typeof hostId !== 'string') {
    return res.status(400).json({ message: 'Host ID must be a string.' });
  }
  
  async function getHostDocRef(id: string) {
    const query = db.collection('hosts').where('uid', '==', id).limit(1);
    const snapshot = await query.get();
    if (!snapshot.empty) {
        return snapshot.docs[0].ref;
    }
    
    const docRef = db.collection('hosts').doc(id);
    const doc = await docRef.get();
    if (doc.exists) {
        return docRef;
    }

    return null;
  }
  
  const hostRef = await getHostDocRef(hostId);

  switch (req.method) {
    case 'GET':
      try {
        if (!hostRef) {
             return res.status(404).json({ message: 'Host not found.' });
        }

        const doc = await hostRef.get();
        if (!doc.exists) {
          return res.status(404).json({ message: 'Host not found.' });
        }
        res.status(200).json({ id: doc.id, ...doc.data() } as Host);
      } catch (error) {
        console.error(`Error fetching host ${hostId}:`, error);
        res.status(500).json({ message: 'Internal server error while fetching host.' });
      }
      break;

    case 'DELETE':
      try {
        if (!hostRef) {
          return res.status(404).json({ message: 'Host not found.' });
        }
        const doc = await hostRef.get();
        if (!doc.exists) {
          return res.status(404).json({ message: 'Host not found.' });
        }
        const hostData = doc.data() as Host;
        const uid = hostData.uid;

        await hostRef.delete();

        if (uid) {
            try {
                await adminAuth.deleteUser(uid);
            } catch (authError: any) {
                if (authError.code !== 'auth/user-not-found') {
                    console.error(`Failed to delete Firebase Auth user ${uid} for host, but Firestore document was deleted. Manual cleanup may be required. Error: ${authError.message}`);
                }
            }
        }
        
        res.status(200).json({ message: `Host ${hostId} deleted successfully.` });
      } catch (error) {
        console.error(`Error deleting host ${hostId}:`, error);
        res.status(500).json({ message: 'Internal server error while deleting host.' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'DELETE']);
      res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
