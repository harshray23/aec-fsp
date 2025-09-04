
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, auth as adminAuth } from '@/lib/firebaseAdmin';
import type { Student } from '@/lib/types';
import { USER_ROLES, DEPARTMENTS } from '@/lib/constants';

const DEFAULT_PASSWORD = "Password@123";

// This helper function finds a value in an object using a list of possible keys, case-insensitively.
function findValue(obj: any, keys: string[]): any {
    if (!obj) return undefined;
    const lowerCaseKeys = keys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
    for (const objKey in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, objKey)) {
            const lowerObjKey = objKey.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (lowerCaseKeys.includes(lowerObjKey)) {
                return obj[objKey];
            }
        }
    }
    return undefined;
}

// This helper function normalizes department names to their standard system codes.
function normalizeDepartment(input: string): string | undefined {
    if (!input) return undefined;
    const normalizedInput = String(input).trim().toLowerCase();
    for (const dept of DEPARTMENTS) {
        const lowerDeptValue = dept.value.toLowerCase();
        const lowerDeptLabel = dept.label.toLowerCase();
        // Check against value ('cse'), label ('Computer...'), and abbreviation ('CSE').
        if (lowerDeptValue === normalizedInput || lowerDeptLabel === normalizedInput) {
            return dept.value;
        }
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
  
  const studentsRef = db.collection('students');

  for (const row of students) {
    if (!row) continue;

    // --- Data Extraction & Sanitization ---
    const studentData = {
      name: String(findValue(row, ["Student Name"]) || '').trim(),
      studentId: String(findValue(row, ["Student ID"]) || '').trim(),
      rollNumber: String(findValue(row, ["University Roll No.", "University Roll No"]) || '').trim(),
      registrationNumber: String(findValue(row, ["University Registration No.", "University Registration No"]) || '').trim(),
      department: String(findValue(row, ["Department"]) || '').trim(),
      admissionYear: findValue(row, ["Admission Year"]),
      currentYear: findValue(row, ["Current Academic Year"]),
      email: String(findValue(row, ["Email"]) || '').trim(),
      whatsappNumber: String(findValue(row, ["WhatsApp No.", "WhatsApp No"]) || '').trim(),
      phoneNumber: String(findValue(row, ["Phone No.", "Phone No"]) || '').trim(),
    };
    
    // --- Rigorous Validation ---
    const { name, studentId, email, rollNumber, registrationNumber, department: rawDepartment, admissionYear, currentYear, phoneNumber } = studentData;
    if (!studentId || !name || !email || !rollNumber || !registrationNumber || !rawDepartment || !admissionYear || !currentYear || !phoneNumber) {
        results.errorCount++;
        results.errors.push(`Skipped row (Missing required data): Name: ${name || 'N/A'}, Roll: ${rollNumber || 'N/A'}`);
        continue;
    }
    const normalizedDept = normalizeDepartment(rawDepartment);
    if (!normalizedDept) {
        results.errorCount++;
        results.errors.push(`Skipped (Invalid department: "${rawDepartment}"): Name: ${name}, Roll: ${rollNumber}`);
        continue;
    }
    const admissionYearNum = parseInt(String(admissionYear), 10);
    const currentYearNum = parseInt(String(currentYear), 10);
    if (isNaN(admissionYearNum) || isNaN(currentYearNum)) {
        results.errorCount++;
        results.errors.push(`Skipped (Invalid year format): Name: ${name}, Admission: ${admissionYear}, Current: ${currentYear}`);
        continue;
    }

    try {
      // Check for auth user existence *before* transaction. This is a read operation.
      try {
        await adminAuth.getUserByEmail(email);
        results.errorCount++;
        results.errors.push(`Skipped (Email already exists in Authentication system): ${email}`);
        continue;
      } catch (authError: any) {
        if (authError.code !== 'auth/user-not-found') {
          throw authError; // Re-throw unexpected auth errors.
        }
        // If user not found, we can proceed.
      }
      
      // Use a transaction to ensure atomic read/write and prevent race conditions.
      await db.runTransaction(async (transaction) => {
        const idQuery = studentsRef.where('studentId', '==', studentId).limit(1);
        const rollQuery = studentsRef.where('rollNumber', '==', rollNumber).limit(1);
        const emailQuery = studentsRef.where('email', '==', email).limit(1);

        const [idSnapshot, rollSnapshot, emailSnapshot] = await Promise.all([
            transaction.get(idQuery),
            transaction.get(rollQuery),
            transaction.get(emailQuery)
        ]);

        if (!idSnapshot.empty) {
            throw new Error(`Student ID ${studentId} already exists.`);
        }
        if (!rollSnapshot.empty) {
            throw new Error(`Roll Number ${rollNumber} already exists.`);
        }
        if (!emailSnapshot.empty) {
            throw new Error(`Email ${email} already exists.`);
        }
        
        // If all checks pass inside the transaction, proceed to create the Auth user and then set the Firestore doc.
        const userRecord = await adminAuth.createUser({
            email: email,
            password: DEFAULT_PASSWORD,
            displayName: name,
            emailVerified: true,
        });

        const newStudentData: Omit<Student, 'id'> = {
            uid: userRecord.uid,
            studentId, name, email, rollNumber, registrationNumber,
            department: normalizedDept,
            admissionYear: admissionYearNum,
            currentYear: currentYearNum,
            phoneNumber,
            whatsappNumber: studentData.whatsappNumber,
            role: USER_ROLES.STUDENT,
            isEmailVerified: true,
            isPhoneVerified: false,
            status: 'active',
            batchIds: [],
        };
        
        const newStudentRef = studentsRef.doc(userRecord.uid);
        transaction.set(newStudentRef, newStudentData);
      });
      
      results.successCount++;

    } catch (error: any) {
      results.errorCount++;
      let errorMessage = `Failed for ${name} (${rollNumber}): ${error.message}`;
      // Clean up Firebase Auth user if Firestore transaction failed.
      try {
        const user = await adminAuth.getUserByEmail(email);
        if (user) await adminAuth.deleteUser(user.uid);
        errorMessage += ' (Auth user cleaned up).';
      } catch (cleanupError) {
        // Log cleanup error but don't overwrite original error message
        console.error(`Failed to cleanup auth user for ${email} after transaction failure.`);
      }
      results.errors.push(errorMessage);
    }
  }

  return res.status(200).json(results);
}
