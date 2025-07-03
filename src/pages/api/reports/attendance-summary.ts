
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import type { Batch, AttendanceRecord } from '@/lib/types';

interface BatchAttendanceSummary {
  batchId: string;
  batchName: string;
  department: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  totalMarks: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!db) {
    return res.status(500).json({ message: 'Database not initialized.' });
  }

  try {
    const batchesSnapshot = await db.collection('batches').get();
    const allBatches: Batch[] = batchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Batch));

    const attendanceSnapshot = await db.collection('attendanceRecords').get();
    const allAttendanceRecords: AttendanceRecord[] = attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));

    const batchDataMap = new Map<string, BatchAttendanceSummary>();

    allBatches.forEach(batch => {
      batchDataMap.set(batch.id, {
        batchId: batch.id,
        batchName: batch.name,
        department: batch.department,
        totalStudents: batch.studentIds?.length || 0,
        present: 0,
        absent: 0,
        late: 0,
        totalMarks: 0,
      });
    });

    allAttendanceRecords.forEach(record => {
      const batchStats = batchDataMap.get(record.batchId);
      if (batchStats) {
        batchStats.totalMarks++;
        if (record.status === 'present') batchStats.present++;
        if (record.status === 'absent') batchStats.absent++;
        if (record.status === 'late') batchStats.late++;
      }
    });

    const summaryData = Array.from(batchDataMap.values());
    
    res.status(200).json(summaryData);

  } catch (error) {
    console.error('Error generating attendance summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
