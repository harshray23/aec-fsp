
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebaseAdmin';
import type { Student } from '@/lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!db) {
    return res.status(500).json({ message: 'Database not initialized' });
  }

  const { studentIds, action } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0 || !action) {
    return res.status(400).json({ message: 'Missing required fields: studentIds (array) and action.' });
  }

  if (action !== 'promote' && action !== 'pass_out') {
    return res.status(400).json({ message: 'Invalid action. Must be "promote" or "pass_out".' });
  }

  try {
    const writeBatch = db.batch();
    const studentRefs = studentIds.map(id => db.collection('students').doc(id));
    const studentDocs = await db.getAll(...studentRefs);

    let promotedCount = 0;
    let passedOutCount = 0;

    for (const studentDoc of studentDocs) {
      if (!studentDoc.exists) {
        console.warn(`Student with ID ${studentDoc.id} not found, skipping.`);
        continue;
      }
      
      const studentData = studentDoc.data() as Student;
      const studentRef = studentDoc.ref;

      if (action === 'promote') {
        if (studentData.currentYear && studentData.currentYear < 4) {
          writeBatch.update(studentRef, { currentYear: studentData.currentYear + 1 });
          promotedCount++;
        } else if (studentData.currentYear === 4) {
          // If a 4th year student was included in a 'promote' batch, mark them as passed out
          writeBatch.update(studentRef, { status: 'passed_out' });
          passedOutCount++;
        }
      } else if (action === 'pass_out') {
        writeBatch.update(studentRef, { status: 'passed_out' });
        passedOutCount++;
      }
    }
    
    await writeBatch.commit();
    
    let message = 'Promotion process complete.';
    if (promotedCount > 0) message += ` ${promotedCount} student(s) promoted.`;
    if (passedOutCount > 0) message += ` ${passedOutCount} student(s) marked as passed out.`;

    return res.status(200).json({ message });

  } catch (error) {
    console.error('Error processing student promotion/status change:', error);
    res.status(500).json({ message: 'Internal server error while processing request.' });
  }
}
