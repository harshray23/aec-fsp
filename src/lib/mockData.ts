
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
    // Add other Admin-specific fields if any from types.ts, e.g., phoneNumber
    // For now, keeping it minimal based on existing mock data structure
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
    // Assuming the first admin is the logged-in admin for prototype purposes
    return admins.find(a => a.id === initialAdminId) || 
           { name: "Admin User", email: "admin@example.com", role: USER_ROLES.ADMIN };
  } else if (pathname.startsWith("/teacher")) {
    // In a real app, you'd have a logged-in teacher ID.
    // For now, return a generic teacher or the first one if any.
    return teachers[0] || { name: "Teacher User", email: "teacher@example.com", role: USER_ROLES.TEACHER, department: "N/A" };
  } else if (pathname.startsWith("/student")) {
    // In a real app, you'd have a logged-in student ID.
    // For now, return a generic student or the first one if any.
    return students[0] || { 
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
  return { name: "User", email: "user@example.com", role: "guest" as any };
};
