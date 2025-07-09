import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!db) {
    return res.status(500).json({ message: 'Database not initialized' });
  }

  const { studentIds, targetYear } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0 || !targetYear) {
    return res.status(400).json({ message: 'Missing required fields: studentIds (array) and targetYear.' });
  }
  
  const parsedTargetYear = parseInt(targetYear, 10);
  if (isNaN(parsedTargetYear) || parsedTargetYear <= 1 || parsedTargetYear > 4) {
      return res.status(400).json({ message: 'Invalid target year. Must be 2, 3, or 4.' });
  }

  try {
    const writeBatch = db.batch();
    
    studentIds.forEach(studentId => {
      if (typeof studentId === 'string') {
        const studentRef = db.collection('students').doc(studentId);
        writeBatch.update(studentRef, { currentYear: parsedTargetYear });
      }
    });

    await writeBatch.commit();
    
    res.status(200).json({ message: `${studentIds.length} student(s) successfully promoted to year ${parsedTargetYear}.` });

  } catch (error) {
    console.error('Error promoting students:', error);
    res.status(500).json({ message: 'Internal server error while promoting students.' });
  }
}
