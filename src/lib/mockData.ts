
// This file will store our "live" mock data for the session.
// In a real application, this would be a database.

import type { Student, Teacher, Admin, Batch, TimetableEntry, AttendanceRecord, User } from "./types";
import { DEPARTMENTS, USER_ROLES, SECTIONS } from "./constants";

// Initial Admin Data (Harsh Ray)
const initialAdminId = "ADMIN_HARSH_RAY";
export let admins: Admin[] = [
  {
    id: initialAdminId,
    name: "Harsh Ray",
    email: "harshray2007@gmail.com",
    role: USER_ROLES.ADMIN,
    phoneNumber: "9002555217",
    whatsappNumber: "9002555217",
  },
];

export let teachers: Teacher[] = [
  { id: "TEACH_001", name: "Dr. Ananya Sharma", email: "ananya.sharma@example.com", role: USER_ROLES.TEACHER, department: DEPARTMENTS[0].value },
  { id: "TEACH_002", name: "Prof. Rohan Gupta", email: "rohan.gupta@example.com", role: USER_ROLES.TEACHER, department: DEPARTMENTS[1].value },
];

export let students: Student[] = [
    { id: "STUD_001", studentId: "S001", name: "Aarav Singh", email: "aarav.s@example.com", role: USER_ROLES.STUDENT, department: DEPARTMENTS[0].value, section: "A", rollNumber: "CSE001", registrationNumber: "REG001", phoneNumber: "1234567890", isEmailVerified: true, isPhoneVerified: true, batchId: "BATCH_CSE_MORNING" },
    { id: "STUD_002", studentId: "S002", name: "Diya Patel", email: "diya.p@example.com", role: USER_ROLES.STUDENT, department: DEPARTMENTS[0].value, section: "B", rollNumber: "CSE002", registrationNumber: "REG002", phoneNumber: "1234567891", isEmailVerified: true, isPhoneVerified: true, batchId: "BATCH_CSE_MORNING" },
    { id: "STUD_003", studentId: "S003", name: "Vikram Rao", email: "vikram.r@example.com", role: USER_ROLES.STUDENT, department: DEPARTMENTS[1].value, section: "A", rollNumber: "IT001", registrationNumber: "REG003", phoneNumber: "1234567892", isEmailVerified: true, isPhoneVerified: true, batchId: "BATCH_IT_AFTERNOON" },
    { id: "STUD_004", studentId: "S004", name: "Nisha Reddy", email: "nisha.r@example.com", role: USER_ROLES.STUDENT, department: DEPARTMENTS[0].value, section: "A", rollNumber: "CSE003", registrationNumber: "REG004", phoneNumber: "1234567893", isEmailVerified: true, isPhoneVerified: true },
];

export let batches: Batch[] = [
  { id: "BATCH_CSE_MORNING", name: "FSP_CSE_Morning_Java", department: DEPARTMENTS[0].value, topic: "Advanced Java", teacherId: "TEACH_001", startDate: "2024-08-01T00:00:00.000Z", daysOfWeek: ["Monday", "Wednesday", "Friday"], startTime: "09:00", endTime: "11:00", studentIds: ["STUD_001", "STUD_002"], status: "Scheduled" },
  { id: "BATCH_IT_AFTERNOON", name: "FSP_IT_Afternoon_Python", department: DEPARTMENTS[1].value, topic: "Data Science with Python", teacherId: "TEACH_002", startDate: "2024-08-05T00:00:00.000Z", daysOfWeek: ["Tuesday", "Thursday"], startTime: "14:00", endTime: "16:00", studentIds: ["STUD_003"], status: "Scheduled" },
];

export let timetableEntries: TimetableEntry[] = [
    { id: "TT-1", batchId: "BATCH_CSE_MORNING", dayOfWeek: "Monday", startTime: "09:00", endTime: "11:00", subject: "Advanced Java - Collections" },
    { id: "TT-2", batchId: "BATCH_CSE_MORNING", dayOfWeek: "Wednesday", startTime: "09:00", endTime: "11:00", subject: "Advanced Java - Concurrency" },
    { id: "TT-3", batchId: "BATCH_IT_AFTERNOON", dayOfWeek: "Tuesday", startTime: "14:00", endTime: "16:00", subject: "Python - Pandas" },
];

export let attendanceRecords: AttendanceRecord[] = [];

export let hosts: User[] = [ // Using generic User type for Host for now
  { id: "HOST_001", name: "Site Host", email: "host@example.com", role: USER_ROLES.HOST },
];

// Helper to get the current logged-in user details for the dashboard layout
// This is a simplified version for the prototype.
export const getMockCurrentUser = (pathname: string) => {
  if (pathname.startsWith("/admin")) {
    return admins.find(a => a.email === "harshray2007@gmail.com") || 
           { id: "default-admin", name: "Admin User", email: "admin@example.com", role: USER_ROLES.ADMIN };
  } else if (pathname.startsWith("/teacher")) {
    return teachers[0] || { id: "default-teacher", name: "Teacher User", email: "teacher@example.com", role: USER_ROLES.TEACHER, department: "N/A" };
  } else if (pathname.startsWith("/student")) {
    return students[0] || { 
        id: "default-student",
        name: "Student User", 
        email: "student@example.com", 
        role: USER_ROLES.STUDENT, 
        studentId: "S000",
        rollNumber: "N/A",
        registrationNumber: "N/A",
        department: "N/A",
        section: SECTIONS[0], 
        phoneNumber: "N/A",
        isEmailVerified: true,
        isPhoneVerified: true,
    };
  } else if (pathname.startsWith("/host")) {
    return hosts[0] || { id: "default-host", name: "Host User", email: "host@example.com", role: USER_ROLES.HOST };
  }
  // Default fallback if role cannot be determined from path
  return { id: "guest-user", name: "User", email: "user@example.com", role: "guest" as any };
};
