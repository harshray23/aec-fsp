
// This file will store our "live" mock data for the session.
// In a real application, this would be a database.

import type { Student, Teacher, Admin, Batch, TimetableEntry, AttendanceRecord, User } from "./types";
import { DEPARTMENTS, USER_ROLES, SECTIONS } from "./constants";

// --- Most mock data is removed to switch to live Firestore data ---
// We keep the essential "superuser" accounts here to allow the initial login
// and path-based role detection to work, solving the chicken-and-egg problem.
// Once logged in, all other data will be fetched from Firestore.

export let admins: Admin[] = [
  {
    id: "ADMIN_HARSH_RAY", // This ID is not a real Firestore ID, but used for the mock login bypass
    name: "Harsh Ray",
    email: "harshray2007@gmail.com",
    role: USER_ROLES.ADMIN,
    phoneNumber: "9002555217",
    whatsappNumber: "9002555217",
    status: "active",
    username: "harsh_admin",
  },
];

export let hosts: User[] = [];


// --- Deprecated Data Arrays (Empty) ---
// These are kept to prevent import errors in files that still reference them,
// but they should be considered empty and not be used for data.
export let teachers: Teacher[] = [];
export let students: Student[] = [];
export let batches: Batch[] = [];
export let timetableEntries: TimetableEntry[] = [];
export let attendanceRecords: AttendanceRecord[] = [];


// Helper to get the current logged-in user details for the dashboard layout
// This is a simplified version for the prototype.
export const getMockCurrentUser = (pathname: string): User & { department?: string; username?: string } => {
  if (typeof window !== 'undefined') {
    const storedUserString = localStorage.getItem("currentUser");
    if (storedUserString) {
      try {
        const storedUser = JSON.parse(storedUserString) as User & { department?: string; username?: string; status?: string; studentId?: string; rollNumber?: string; registrationNumber?: string; section?: string; phoneNumber?: string; isEmailVerified?: boolean; isPhoneVerified?: boolean; avatarUrl?: string;};
        if (storedUser && storedUser.id && storedUser.role) {
          // Consolidate with mock data to ensure all fields are present, prioritizing mockData as source of truth for fixed fields.
          switch (storedUser.role) {
            case USER_ROLES.ADMIN:
              const adminDetails = admins.find(a => a.id === storedUser.id || a.email === storedUser.email);
              if (adminDetails) return { ...adminDetails, ...storedUser }; // Spread storedUser last to keep any dynamic fields from localStorage
              break;
            case USER_ROLES.TEACHER:
              const teacherDetails = teachers.find(t => t.id === storedUser.id);
              if (teacherDetails) return { ...teacherDetails, ...storedUser };
              break;
            case USER_ROLES.STUDENT:
              const studentDetails = students.find(s => s.id === storedUser.id);
              if (studentDetails) return { ...studentDetails, ...storedUser };
              break;
            case USER_ROLES.HOST:
              const hostDetails = hosts.find(h => h.id === storedUser.id || h.email === storedUser.email);
              if (hostDetails) return { ...hostDetails, ...storedUser }; // Ensures mockData (like updated email) is primary
              break; 
            default:
              return storedUser;
          }
          // If details not found in mockData (e.g. newly registered user), trust localStorage
           return storedUser;
        }
      } catch (e) {
        console.error("Error parsing currentUser from localStorage:", e);
        localStorage.removeItem("currentUser"); // Clear corrupted data
      }
    }
  }


  // Fallback to path-based determination if localStorage is empty or invalid
  if (pathname.startsWith("/admin")) {
    const adminUser = admins.find(a => a.email === "harshray2007@gmail.com"); // Keep admin specific
    return adminUser || 
           { id: "default-admin-fallback", name: "Admin User", email: "admin@example.com", role: USER_ROLES.ADMIN, status: "active", username: "default_admin_fallback" };
  } else if (pathname.startsWith("/teacher")) {
    const teacherUser = teachers[0]; 
    return teacherUser || { id: "default-teacher-fallback", name: "Teacher User", email: "teacher@example.com", role: USER_ROLES.TEACHER, department: "N/A", status: "active", username: "default_teacher_fallback" };
  } else if (pathname.startsWith("/student")) {
    const studentUser = students[0]; 
    return studentUser || { 
        id: "default-student-fallback", name: "Student User", email: "student@example.com", role: USER_ROLES.STUDENT, 
        studentId: "S000F", rollNumber: "N/AF", registrationNumber: "N/AF", department: "N/AF", section: SECTIONS[0], 
        phoneNumber: "N/AF", isEmailVerified: true, isPhoneVerified: true
    };
  } else if (pathname.startsWith("/host")) {
    const hostUser = hosts.find(h => h.email === "elvishray007@gmail.com"); // Use the new email
    return hostUser || { id: "default-host-fallback", name: "Management User", email: "elvishray007@gmail.com", role: USER_ROLES.HOST };
  }
  // Default fallback if role cannot be determined from path
  return { id: "guest-user-fallback", name: "User", email: "user@example.com", role: "guest" as any };
};
