
// This file will store our "live" mock data for the session.
// In a real application, this would be a database.

import type { Student, Teacher, Admin, Batch, TimetableEntry, AttendanceRecord } from "./types";
import { DEPARTMENTS, USER_ROLES } from "./constants";

// Initial Admin Data (Harsh Ray)
const initialAdminId = "ADMIN_HARSH_RAY";
export let admins: Admin[] = [
  {
    id: initialAdminId,
    name: "Harsh Ray",
    email: "harshray2007@gmail.com",
    role: USER_ROLES.ADMIN,
    // Assuming these were intended for the admin based on the prompt
    phoneNumber: "9002555217",
    whatsappNumber: "9002555217",
    // No roll number or department for admin in the type, these were in the prompt but might be student-specific
  },
];

export let teachers: Teacher[] = [];
export let students: Student[] = [];
export let batches: Batch[] = [];
export let timetableEntries: TimetableEntry[] = [];
export let attendanceRecords: AttendanceRecord[] = [];

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
        phoneNumber: "N/A"
    };
  }
  // Default fallback if role cannot be determined from path
  return { id: "guest-user", name: "User", email: "user@example.com", role: "guest" as any };
};
