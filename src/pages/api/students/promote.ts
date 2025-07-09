
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!db) {
    return res.status(500).json({ message: 'Database not initialized' });
  }

  const { studentIds, targetYear, action } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0 || !action) {
    return res.status(400).json({ message: 'Missing required fields: studentIds (array) and action.' });
  }

  try {
    const writeBatch = db.batch();

    if (action === 'pass_out') {
      studentIds.forEach(studentId => {
        if (typeof studentId === 'string') {
          const studentRef = db.collection('students').doc(studentId);
          writeBatch.update(studentRef, { status: 'passed_out' });
        }
      });
      await writeBatch.commit();
      return res.status(200).json({ message: `${studentIds.length} student(s) successfully marked as passed out.` });

    } else if (action === 'promote') {
      if (!targetYear) {
        return res.status(400).json({ message: 'Target year is required for promotion.' });
      }
      const parsedTargetYear = parseInt(targetYear, 10);
      if (isNaN(parsedTargetYear) || parsedTargetYear <= 1 || parsedTargetYear > 4) {
        return res.status(400).json({ message: 'Invalid target year. Must be 2, 3, or 4.' });
      }

      studentIds.forEach(studentId => {
        if (typeof studentId === 'string') {
          const studentRef = db.collection('students').doc(studentId);
          writeBatch.update(studentRef, { currentYear: parsedTargetYear });
        }
      });
      await writeBatch.commit();
      return res.status(200).json({ message: `${studentIds.length} student(s) successfully promoted to year ${parsedTargetYear}.` });
    } else {
        return res.status(400).json({ message: 'Invalid action specified.' });
    }

  } catch (error) {
    console.error('Error processing student promotion/status change:', error);
    res.status(500).json({ message: 'Internal server error while processing request.' });
  }
}
