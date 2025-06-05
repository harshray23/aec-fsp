
import type { NextApiRequest, NextApiResponse } from 'next';
import { attendanceRecords as mockAttendanceRecords } from '@/lib/mockData';
import type { AttendanceRecord } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { studentId, batchId } = req.query;

  if (!studentId || typeof studentId !== 'string') {
    return res.status(400).json({ message: 'Student ID is required.' });
  }

  let filteredRecords = mockAttendanceRecords.filter(
    (record) => record.studentId === studentId
  );

  if (batchId && typeof batchId === 'string') {
    filteredRecords = filteredRecords.filter(
      (record) => record.batchId === batchId
    );
  }

  // No need to return 404 if no records found, an empty array is a valid response.
  return res.status(200).json(filteredRecords);
}
