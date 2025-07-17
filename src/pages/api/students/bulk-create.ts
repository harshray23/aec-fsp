
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, auth as adminAuth } from '@/lib/firebaseAdmin';
import type { Student } from '@/lib/types';
import { USER_ROLES } from '@/lib/constants';

const DEFAULT_PASSWORD = "Password@123";

// This maps the user-facing column names from the Excel file to the internal database field names.
const COLUMN_MAP: { [key: string]: keyof Student | string } = {
  "Timestamp": "timestamp",
  "Student Name": "name",
  "Student ID": "studentId",
  "University Roll No.": "rollNumber",
  "University Registration No.": "registrationNumber",
  "Department": "department",
  "Admission Year": "admissionYear",
  "Current Academic Year": "currentYear",
  "Email": "email",
  "Email Address": "email",
  "WhatsApp No.": "whatsappNumber",
  "Phone No.": "phoneNumber",
};


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
  
  // Pre-fetch all existing roll numbers and emails to check for duplicates in one go.
  const existingStudents = await db.collection('students').get();
  const existingRollNumbers = new Set(existingStudents.docs.map(doc => doc.data().rollNumber));
  const existingEmails = new Set(existingStudents.docs.map(doc => doc.data().email));

  for (const row of students) {
    // Map Excel columns to our student object keys
    const studentData: any = {};
    for (const key in COLUMN_MAP) {
      if (row[key] !== undefined) {
        studentData[COLUMN_MAP[key]] = row[key];
      }
    }

    const {
      studentId, name, email, rollNumber, registrationNumber, department: rawDepartment,
      admissionYear, currentYear, phoneNumber, whatsappNumber
    } = studentData;

    // Convert department from spreadsheet (e.g., "CSE") to system value (e.g., "cse")
    const department = rawDepartment ? String(rawDepartment).trim().toLowerCase() : undefined;


    // --- Validation ---
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
      // 1. Create user in Firebase Authentication
      const userRecord = await adminAuth.createUser({
        email: email,
        password: DEFAULT_PASSWORD,
        displayName: name,
        emailVerified: true, // Assuming admin-provided emails are valid
      });

      // 2. Prepare data for Firestore
      const newStudentData: Omit<Student, 'id'> = {
        uid: userRecord.uid,
        studentId,
        name,
        email,
        role: USER_ROLES.STUDENT,
        rollNumber,
        registrationNumber,
        department, // Use the processed, lowercase department value
        admissionYear: parseInt(admissionYear, 10),
        currentYear: parseInt(currentYear, 10),
        phoneNumber: String(phoneNumber),
        whatsappNumber: String(whatsappNumber || ''),
        isEmailVerified: true,
        isPhoneVerified: false, // Phone verification not done in bulk upload
        status: 'active',
        batchIds: [],
      };
      
      // 3. Add to Firestore using UID as document ID
      await db.collection('students').doc(userRecord.uid).set(newStudentData);

      // Add to sets to prevent duplicate uploads within the same file
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
