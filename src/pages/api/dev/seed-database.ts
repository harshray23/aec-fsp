
import type { NextApiRequest, NextApiResponse } from 'next';
import { db, auth as adminAuth } from '@/lib/firebaseAdmin';
import { USER_ROLES, DEPARTMENTS } from '@/lib/constants';
import type { Teacher, Student, Batch, Host, Admin } from '@/lib/types';

// Default Admin and Management users
const superAdmin: Omit<Admin, 'id' | 'uid'> & {password: string} = {
  name: "Harsh Ray",
  email: "harshray2007@gmail.com",
  role: "admin",
  status: "active",
  username: "harsh_admin",
  password: "Password@123",
  phoneNumber: "9002555217",
  whatsappNumber: "9002555217",
};

const superHost: Omit<Host, 'id' | 'uid'> & {password: string} = {
  name: "Harsh Ray",
  email: "elvishray007@gmail.com",
  role: "host",
  password: "harsh@123"
};


// Sample data to seed
const sampleTeachers: Omit<Teacher, 'id' | 'uid'>[] = [
  { name: 'Dr. Evelyn Reed', email: 'e.reed@example.com', role: 'teacher', department: 'cse', status: 'active', username: 'evelyn_reed' },
  { name: 'Mr. Samuel Chen', email: 's.chen@example.com', role: 'teacher', department: 'it', status: 'active', username: 'samuel_chen' },
  { name: 'Ms. Priya Kaur', email: 'p.kaur@example.com', role: 'teacher', department: 'ece', status: 'active', username: 'priya_kaur' },
];

const sampleStudents: Omit<Student, 'id' | 'uid'>[] = [
  { name: 'Aarav Sharma', email: 'aarav.s@example.com', studentId: 'S001', rollNumber: 'CSE/20/01', registrationNumber: 'REG-CSE-01', department: 'cse', section: 'A', phoneNumber: '9876543210', isEmailVerified: true, isPhoneVerified: true, role: 'student' },
  { name: 'Diya Patel', email: 'diya.p@example.com', studentId: 'S002', rollNumber: 'CSE/20/02', registrationNumber: 'REG-CSE-02', department: 'cse', section: 'A', phoneNumber: '9876543211', isEmailVerified: true, isPhoneVerified: true, role: 'student' },
  { name: 'Rohan Mehta', email: 'rohan.m@example.com', studentId: 'S003', rollNumber: 'IT/20/01', registrationNumber: 'REG-IT-01', department: 'it', section: 'B', phoneNumber: '9876543212', isEmailVerified: true, isPhoneVerified: true, role: 'student' },
  { name: 'Isha Singh', email: 'isha.s@example.com', studentId: 'S004', rollNumber: 'IT/20/02', registrationNumber: 'REG-IT-02', department: 'it', section: 'B', phoneNumber: '9876543213', isEmailVerified: true, isPhoneVerified: true, role: 'student' },
  { name: 'Arjun Verma', email: 'arjun.v@example.com', studentId: 'S005', rollNumber: 'ECE/20/01', registrationNumber: 'REG-ECE-01', department: 'ece', section: 'C', phoneNumber: '9876543214', isEmailVerified: true, isPhoneVerified: true, role: 'student' },
];

const sampleBatches: Omit<Batch, 'id' | 'teacherId' | 'studentIds'>[] = [
  { name: 'FSP-CSE-2024-A', department: 'cse', topic: 'Advanced Python', startDate: new Date('2024-08-01').toISOString(), daysOfWeek: ['Monday', 'Wednesday', 'Friday'], startTime: '10:00', endTime: '11:00', roomNumber: 'R301', status: 'Scheduled' },
  { name: 'FSP-IT-2024-B', department: 'it', topic: 'Cloud Computing', startDate: new Date('2024-08-01').toISOString(), daysOfWeek: ['Tuesday', 'Thursday'], startTime: '14:00', endTime: '15:30', roomNumber: 'R302', status: 'Scheduled' },
];


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  if (!db || !adminAuth) {
    return res.status(500).json({ message: 'Firebase Admin SDK not initialized.' });
  }

  try {
    const studentsCollection = db.collection('students');
    const teachersCollection = db.collection('teachers');
    const batchesCollection = db.collection('batches');
    const adminsCollection = db.collection('admins');
    const hostsCollection = db.collection('host');

    // Check if the default admin already exists to prevent re-seeding
    try {
        await adminAuth.getUserByEmail(superAdmin.email);
        return res.status(409).json({ message: 'Database has already been seeded with the default admin user. Seeding aborted.' });
    } catch (error: any) {
        if (error.code !== 'auth/user-not-found') {
            throw error; // Re-throw unexpected errors
        }
        // If user is not found, it's safe to proceed with seeding.
    }

    const writeBatch = db.batch();

    // Seed Super Admin
    const adminUserRecord = await adminAuth.createUser({ email: superAdmin.email, password: superAdmin.password, displayName: superAdmin.name, emailVerified: true });
    const { password: adminPassword, ...adminData } = superAdmin;
    const adminRef = adminsCollection.doc(adminUserRecord.uid);
    writeBatch.set(adminRef, { ...adminData, uid: adminUserRecord.uid });

    // Seed Super Host
    const hostUserRecord = await adminAuth.createUser({ email: superHost.email, password: superHost.password, displayName: superHost.name, emailVerified: true });
    const { password: hostPassword, ...hostData } = superHost;
    const hostRef = hostsCollection.doc(hostUserRecord.uid);
    writeBatch.set(hostRef, { ...hostData, uid: hostUserRecord.uid });

    // Seed Teachers
    for (const teacher of sampleTeachers) {
        const userRecord = await adminAuth.createUser({ email: teacher.email, password: 'Password@123', displayName: teacher.name, emailVerified: true });
        const teacherRef = teachersCollection.doc(userRecord.uid);
        writeBatch.set(teacherRef, { ...teacher, uid: userRecord.uid });
    }
    
    // Seed Students
    for (const student of sampleStudents) {
         const userRecord = await adminAuth.createUser({ email: student.email, password: 'Password@123', displayName: student.name, emailVerified: true });
         const studentRef = studentsCollection.doc(userRecord.uid);
         writeBatch.set(studentRef, { ...student, uid: userRecord.uid });
    }

    // Seed Batches (without assignments)
    for (const batch of sampleBatches) {
        const batchRef = batchesCollection.doc(); // Auto-generate ID
        writeBatch.set(batchRef, { ...batch, teacherId: '', studentIds: [] });
    }

    await writeBatch.commit();
    
    return res.status(200).json({ message: `Successfully seeded default users, ${sampleTeachers.length} teachers, ${sampleStudents.length} students, and ${sampleBatches.length} batches.` });

  } catch (error: any) {
    console.error('Error seeding database:', error);
    if (error.code === 'auth/email-already-exists') {
        return res.status(409).json({ message: `Seeding failed: An email from the sample data already exists in Firebase Authentication. Please clear existing users before seeding.` });
    }
    return res.status(500).json({ message: error.message || 'Internal server error during seeding.' });
  }
}
