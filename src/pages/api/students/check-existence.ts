
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!db) {
    return res.status(500).json({ message: 'Database service not available.' });
  }

  const { studentId, email } = req.body;

  if (!studentId && !email) {
    return res.status(400).json({ message: 'Student ID or Email is required for check.' });
  }

  try {
    const studentsRef = db.collection('students');
    
    if (studentId) {
      const idSnapshot = await studentsRef.where('studentId', '==', studentId).limit(1).get();
      if (!idSnapshot.empty) {
        return res.status(409).json({ message: `Student ID ${studentId} already exists.` });
      }
    }

    if (email) {
      const emailSnapshot = await studentsRef.where('email', '==', email).limit(1).get();
      if (!emailSnapshot.empty) {
        return res.status(409).json({ message: `Email ${email} already registered.` });
      }
    }

    return res.status(200).json({ message: 'Student ID and Email are available.' });

  } catch (error) {
    console.error('Error checking student existence:', error);
    return res.status(500).json({ message: 'Internal server error while checking student existence.' });
  }
}
