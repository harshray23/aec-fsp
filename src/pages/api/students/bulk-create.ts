
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, auth as adminAuth } from '@/lib/firebaseAdmin';
import type { Student } from '@/lib/types';
import { USER_ROLES, DEPARTMENTS } from '@/lib/constants';

const DEFAULT_PASSWORD = "Password@123";

// Helper function to find a value in an object with case-insensitive and variant keys
function findValue(obj: any, keys: string[]): any {
    for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null) {
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

function normalizeDepartment(input: string): string | undefined {
    if (!input) return undefined;
    const normalizedInput = String(input).trim().toLowerCase();

    for (const dept of DEPARTMENTS) {
        const lowerDeptValue = dept.value.toLowerCase();
        if (lowerDeptValue === normalizedInput) {
            return dept.value;
        }
        
        const lowerDeptLabel = dept.label.toLowerCase();
        const abbreviationMatch = lowerDeptLabel.match(/\(([^)]+)\)/);
        if (abbreviationMatch && abbreviationMatch[1].trim().toLowerCase() === normalizedInput) {
            return dept.value;
        }

        const namePart = lowerDeptLabel.split('(')[0].trim();
        if (namePart === normalizedInput) {
            return dept.value;
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
  const existingEmails = new Set(existingStudents.docs.map(doc => doc.data().email).filter(Boolean)); // Filter out null/undefined emails

  for (const row of students) {
    // Ensure all values are safely converted to strings for consistent processing
    const studentData = {
      name: findValue(row, ["Student Name"]) ? String(findValue(row, ["Student Name"])) : undefined,
      studentId: findValue(row, ["Student ID"]) ? String(findValue(row, ["Student ID"])) : undefined,
      rollNumber: findValue(row, ["University Roll No.", "University Roll No"]) ? String(findValue(row, ["University Roll No.", "University Roll No"])) : undefined,
      registrationNumber: findValue(row, ["University Registration No.", "University Registration No"]) ? String(findValue(row, ["University Registration No.", "University Registration No"])) : undefined,
      department: findValue(row, ["Department"]) ? String(findValue(row, ["Department"])) : undefined,
      admissionYear: findValue(row, ["Admission Year"]) ? String(findValue(row, ["Admission Year"])) : undefined,
      currentYear: findValue(row, ["Current Academic Year"]) ? String(findValue(row, ["Current Academic Year"])) : undefined,
      email: findValue(row, ["Email"]) ? String(findValue(row, ["Email"])) : undefined,
      whatsappNumber: findValue(row, ["WhatsApp No.", "WhatsApp No"]) ? String(findValue(row, ["WhatsApp No.", "WhatsApp No"])) : undefined,
      phoneNumber: findValue(row, ["Phone No.", "Phone No"]) ? String(findValue(row, ["Phone No.", "Phone No"])) : undefined,
    };


    const {
      studentId, name, email: rawEmail, rollNumber, registrationNumber, department: rawDepartment,
      admissionYear, currentYear, phoneNumber, whatsappNumber
    } = studentData;
    
    const email = rawEmail ? rawEmail.trim() : undefined;
    
    if (!studentId || !name || !email || !rollNumber || !registrationNumber || !rawDepartment || !admissionYear || !currentYear || !phoneNumber) {
        results.errorCount++;
        results.errors.push(`Skipped row (Missing required data): Name: ${name || 'N/A'}, Roll: ${rollNumber || 'N/A'}`);
        continue;
    }
    
    const department = normalizeDepartment(rawDepartment);

    if (!department) {
        results.errorCount++;
        results.errors.push(`Skipped row (Invalid department: "${rawDepartment}"): Name: ${name}, Roll: ${rollNumber}`);
        continue;
    }

    if (existingRollNumbers.has(rollNumber)) {
      results.errorCount++;
      results.errors.push(`Skipped (Roll number already exists): ${rollNumber}`);
      continue;
    }
     if (email && existingEmails.has(email)) { // Check only if email is not undefined
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
        phoneNumber: phoneNumber,
        whatsappNumber: whatsappNumber || '',
        isEmailVerified: true,
        isPhoneVerified: false,
        status: 'active',
        batchIds: [],
      };
      
      await db.collection('students').doc(userRecord.uid).set(newStudentData);

      existingRollNumbers.add(rollNumber);
      if (email) existingEmails.add(email);

      results.successCount++;

    } catch (error: any) {
      results.errorCount++;
      let errorMessage = `Failed for ${name} (${rollNumber}): ${error.message}`;
      if (error.code === 'auth/email-already-exists') {
        errorMessage = `Skipped (Email already exists in Auth): ${email}`;
      }
      if (error.code === 'auth/invalid-email') {
        errorMessage = `Failed for ${name} (${rollNumber}): The email address is improperly formatted.`;
      }
      results.errors.push(errorMessage);
      console.error(`Failed to process student ${name} (${rollNumber}):`, error);
    }
  }

  return res.status(200).json(results);
}
