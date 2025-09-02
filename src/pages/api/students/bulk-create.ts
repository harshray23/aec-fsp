
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, auth as adminAuth } from '@/lib/firebaseAdmin';
import type { Student } from '@/lib/types';
import { USER_ROLES, DEPARTMENTS } from '@/lib/constants';

const DEFAULT_PASSWORD = "Password@123";

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


function normalizeDepartment(input: string): string | undefined {
    if (!input) return undefined;
    const normalizedInput = String(input).trim().toLowerCase();
    for (const dept of DEPARTMENTS) {
        const lowerDeptValue = dept.value.toLowerCase();
        const lowerDeptLabel = dept.label.toLowerCase();
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
  
  // Fetch existing users from both Firestore and Auth for robust duplicate checking
  const [studentsSnapshot, authUsers] = await Promise.all([
    db.collection('students').get(),
    adminAuth.listUsers(1000) // Note: This fetches up to 1000 users. For larger user bases, pagination is needed.
  ]);

  const existingRollNumbers = new Set(studentsSnapshot.docs.map(doc => String(doc.data().rollNumber)));
  const existingStudentIds = new Set(studentsSnapshot.docs.map(doc => String(doc.data().studentId)));
  const existingEmails = new Set(authUsers.users.map(user => user.email).filter(Boolean) as string[]);


  for (const row of students) {
    if (!row) continue; // Skip empty rows

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

    const {
      studentId, name, email, rollNumber, registrationNumber, department: rawDepartment,
      admissionYear, currentYear, phoneNumber
    } = studentData;
    
    // --- Rigorous Validation ---
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

    // --- Duplicate Checking ---
    if (existingStudentIds.has(studentId)) {
      results.errorCount++;
      results.errors.push(`Skipped (Student ID already exists): ${studentId}`);
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
      // --- Create User and Save ---
      const userRecord = await adminAuth.createUser({
        email: email,
        password: DEFAULT_PASSWORD,
        displayName: name,
        emailVerified: true,
      });

      const newStudentData: Omit<Student, 'id'> = {
        uid: userRecord.uid,
        studentId: studentId,
        name: name,
        email: email,
        role: USER_ROLES.STUDENT,
        rollNumber: rollNumber,
        registrationNumber: registrationNumber,
        department: normalizedDept,
        admissionYear: admissionYearNum,
        currentYear: currentYearNum,
        phoneNumber: phoneNumber,
        whatsappNumber: studentData.whatsappNumber,
        isEmailVerified: true,
        isPhoneVerified: false,
        status: 'active',
        batchIds: [],
      };
      
      await db.collection('students').doc(userRecord.uid).set(newStudentData);

      // --- Update In-Memory Sets to Prevent Duplicates Within the Same File ---
      existingStudentIds.add(studentId);
      existingRollNumbers.add(rollNumber);
      existingEmails.add(email);

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
    }
  }

  return res.status(200).json(results);
}
