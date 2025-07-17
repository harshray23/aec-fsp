
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, auth as adminAuth } from '@/lib/firebaseAdmin';
import type { Student } from '@/lib/types';
import { USER_ROLES } from '@/lib/constants';

const DEFAULT_PASSWORD = "Password@123";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!db || !adminAuth) {
    return res.status(500).json({ message: 'Firebase Admin SDK not initialized.' });
  }

  const { students } = req.body;

  if (!Array.isArray(students)) {
    return res.status(400).json({ message: 'Request body must contain a "students" array.' });
  }

  const results = {
    successCount: 0,
    errorCount: 0,
    errors: [] as string[],
  };
  
  const existingStudents = await db.collection('students').get();
  const existingRollNumbers = new Set(existingStudents.docs.map(doc => doc.data().rollNumber));
  const existingEmails = new Set(existingStudents.docs.map(doc => doc.data().email));

  for (const row of students) {
    // Exact mapping from user's Excel file columns
    // The library automatically removes periods from headers, so "University Roll No." becomes "University Roll No"
    const studentData = {
      name: row["Student Name"],
      studentId: row["Student ID"],
      rollNumber: row["University Roll No"], // Corrected: Removed the period.
      registrationNumber: row["University Registration No"], // Corrected: Removed the period.
      department: row["Department"],
      admissionYear: row["Admission Year"],
      currentYear: row["Current Academic Year"],
      email: row["Email"],
      whatsappNumber: row["WhatsApp No"], // Corrected: Removed the period.
      phoneNumber: row["Phone No"], // Corrected: Removed the period.
    };

    const {
      studentId, name, email, rollNumber, registrationNumber, department: rawDepartment,
      admissionYear, currentYear, phoneNumber, whatsappNumber
    } = studentData;

    const department = rawDepartment ? String(rawDepartment).trim().toLowerCase() : undefined;

    if (!studentId || !name || !email || !rollNumber || !registrationNumber || !department || !admissionYear || !currentYear || !phoneNumber) {
      results.errorCount++;
      results.errors.push(`Skipped row (missing required data): Name: ${name || 'N/A'}, Roll: ${rollNumber || 'N/A'}`);
      continue;
    }
    if (existingRollNumbers.has(rollNumber)) {
      results.errorCount++;
      results.errors.push(`Skipped (Roll number already exists): ${rollNumber}`);
      continue;
    }
     if (existingEmails.has(email)) {
      results.errorCount++;
      results.errors.push(`Skipped (Email already exists): ${email}`);
      continue;
    }

    try {
      const userRecord = await adminAuth.createUser({
        email: email,
        password: DEFAULT_PASSWORD,
        displayName: name,
        emailVerified: true,
      });

      const newStudentData: Omit<Student, 'id'> = {
        uid: userRecord.uid,
        studentId,
        name,
        email,
        role: USER_ROLES.STUDENT,
        rollNumber,
        registrationNumber,
        department,
        admissionYear: parseInt(admissionYear, 10),
        currentYear: parseInt(currentYear, 10),
        phoneNumber: String(phoneNumber),
        whatsappNumber: String(whatsappNumber || ''),
        isEmailVerified: true,
        isPhoneVerified: false,
        status: 'active',
        batchIds: [],
      };
      
      await db.collection('students').doc(userRecord.uid).set(newStudentData);

      existingRollNumbers.add(rollNumber);
      existingEmails.add(email);

      results.successCount++;

    } catch (error: any) {
      results.errorCount++;
      let errorMessage = `Failed for ${name} (${rollNumber}): ${error.message}`;
      if (error.code === 'auth/email-already-exists') {
        errorMessage = `Skipped (Email already exists in Auth): ${email}`;
      }
      results.errors.push(errorMessage);
      console.error(`Failed to process student ${name} (${rollNumber}):`, error);
    }
  }

  return res.status(200).json(results);
}
