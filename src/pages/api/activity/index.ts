
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, Timestamp } from '@/lib/firebaseAdmin';
import type { ActivityLog } from '@/lib/types';
import { subDays, startOfDay } from 'date-fns';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!db) {
    return res.status(500).json({ message: 'Database not initialized.' });
  }

  if (req.method === 'GET') {
    try {
      const thirtyDaysAgo = subDays(new Date(), 30);
      const startOfPeriod = Timestamp.fromDate(startOfDay(thirtyDaysAgo));

      const activitySnapshot = await db.collection('activityLogs')
                                    .where('timestamp', '>=', startOfPeriod)
                                    .orderBy('timestamp', 'desc')
                                    .limit(200) // Limit to a reasonable number for display
                                    .get();
      
      const activities: ActivityLog[] = activitySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp).toDate().toISOString(),
        } as ActivityLog;
      });

      res.status(200).json(activities);

    } catch (error) {
      console.error('Error fetching activity logs:', error);
      res.status(500).json({ message: 'Internal server error while fetching logs.' });
    }
  } else if (req.method === 'POST') {
    try {
        const { user, role, action, details } = req.body;

        if (!user || !role || !action || !details) {
            return res.status(400).json({ message: 'Missing required fields for activity log.' });
        }
        
        const newLog: Omit<ActivityLog, 'id'> = {
            user,
            role,
            action,
            details,
            timestamp: Timestamp.now().toDate().toISOString(),
        };
        
        // Firestore timestamps should be created on the server
        const firestoreLog = {
            ...newLog,
            timestamp: Timestamp.now()
        };

        const docRef = await db.collection('activityLogs').add(firestoreLog);
        
        res.status(201).json({ id: docRef.id, ...newLog });

    } catch (error) {
        console.error('Error creating activity log:', error);
        res.status(500).json({ message: 'Internal server error while creating log.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
