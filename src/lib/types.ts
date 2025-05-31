
import type { UserRole, Section } from "./constants";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Student extends User {
  role: "student";
  studentId: string;
  rollNumber: string;
  registrationNumber: string;
  department: string;
  section: Section;
  phoneNumber: string;
  whatsappNumber?: string;
  batchId?: string; // ID of the batch the student is assigned to
}

export interface Teacher extends User {
  role: "teacher";
  department: string;
  // Add other Teacher-specific fields if any
}

export interface Admin extends User {
  role: "admin";
  phoneNumber?: string;
  whatsappNumber?: string;
  // Add other Admin-specific fields if any
}

export interface Batch {
  id: string;
  name: string;
  department: string;
  topic: string;
  startDate: string; // ISO string format
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  teacherId: string;
  studentIds: string[];
  status: "Scheduled" | "Ongoing" | "Completed";
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // ISO Date string
  status: "present" | "absent" | "late";
  batchId: string; 
  subject: string; // Subject/module for which attendance was taken
}

export interface TimetableEntry {
  id: string;
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "10:00"
  subject: string;
  batchId: string;
}

// Props for navigation items in DashboardLayout
export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  children?: NavItem[];
  tooltip?: string;
}
