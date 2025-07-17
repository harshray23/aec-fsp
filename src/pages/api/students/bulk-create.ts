
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, auth as adminAuth } from '@/lib/firebaseAdmin';
import type { Student } from '@/lib/types';
import { USER_ROLES } from '@/lib/constants';

const DEFAULT_PASSWORD = "Password@123";

// Helper function to find a value in an object with case-insensitive and variant keys
function findValue(obj: any, keys: string[]): any {
    for (const key of keys) {
        if (obj[key] !== undefined) {
            return obj[key];
        }
    }
    // Fallback to case-insensitive and character-agnostic search
    const lowerCaseKeys = keys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
    for (const objKey in obj) {
        const lowerObjKey = objKey.toLowerCase().replace(/[^a-z0-9]/g, '');
        const index = lowerCaseKeys.indexOf(lowerObjKey);
        if (index !== -1) {
            return obj[objKey];
        }
    }
    return undefined;
}


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
    // Robustly find values by checking for multiple possible header variations
    const studentData = {
      name: findValue(row, ["Student Name"]),
      studentId: findValue(row, ["Student ID"]),
      rollNumber: findValue(row, ["University Roll No.", "University Roll No"]),
      registrationNumber: findValue(row, ["University Registration No.", "University Registration No"]),
      department: findValue(row, ["Department"]),
      admissionYear: findValue(row, ["Admission Year"]),
      currentYear: findValue(row, ["Current Academic Year"]),
      email: findValue(row, ["Email"]), // Prioritize "Email"
      whatsappNumber: findValue(row, ["WhatsApp No.", "WhatsApp No"]),
      phoneNumber: findValue(row, ["Phone No.", "Phone No"]),
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
