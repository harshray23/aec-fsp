
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import type { Batch, Teacher, Student, AttendanceRecord } from '@/lib/types';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

interface AttendanceSummary {
    batchId: string;
    batchName: string;
    topic: string;
    teacherNames: string[];
    studentCount: number;
    totalPossibleSessions: number; // Not easily calculable here without business logic for holidays etc.
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    attendancePercentage: number;
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    if (!db) {
        return res.status(500).json({ message: 'Database not initialized.' });
    }

    const { from, to } = req.query;

    if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
        return res.status(400).json({ message: 'A "from" and "to" date range is required.' });
    }

    try {
        const [batchesSnapshot, teachersSnapshot, studentsSnapshot, attendanceSnapshot] = await Promise.all([
            db.collection('batches').get(),
            db.collection('teachers').get(),
            db.collection('students').get(),
            db.collection('attendanceRecords').where('date', '>=', from).where('date', '<=', to).get()
        ]);

        const allBatches: Batch[] = batchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Batch));
        const teachersMap = new Map(teachersSnapshot.docs.map(doc => [doc.id, doc.data() as Teacher]));
        const studentsMap = new Map(studentsSnapshot.docs.map(doc => [doc.id, doc.data() as Student]));
        const allAttendanceRecords: AttendanceRecord[] = attendanceSnapshot.docs.map(doc => doc.data() as AttendanceRecord);
        
        const summaryMap = new Map<string, AttendanceSummary>();

        // Initialize map with all batches
        allBatches.forEach(batch => {
            summaryMap.set(batch.id, {
                batchId: batch.id,
                batchName: batch.name,
                topic: batch.topic,
                teacherNames: batch.teacherIds.map(id => teachersMap.get(id)?.name).filter(Boolean) as string[],
                studentCount: batch.studentIds?.length || 0,
                totalPossibleSessions: 0,
                totalPresent: 0,
                totalAbsent: 0,
                totalLate: 0,
                attendancePercentage: 0,
            });
        });

        // Process attendance records
        allAttendanceRecords.forEach(record => {
            const summary = summaryMap.get(record.batchId);
            if (summary) {
                switch (record.status) {
                    case 'present':
                        summary.totalPresent++;
                        break;
                    case 'absent':
                        summary.totalAbsent++;
                        break;
                    case 'late':
                        summary.totalLate++;
                        break;
                }
            }
        });
        
        // Final calculation
        const finalSummaries = Array.from(summaryMap.values()).map(summary => {
            const totalMarked = summary.totalPresent + summary.totalAbsent + summary.totalLate;
            const percentage = totalMarked > 0 ? ((summary.totalPresent + summary.totalLate) / totalMarked) * 100 : 0;
            return {
                ...summary,
                attendancePercentage: percentage
            };
        });

        res.status(200).json(finalSummaries);

    } catch (error) {
        console.error('Error generating attendance summary:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

    