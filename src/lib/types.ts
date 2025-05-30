import type { UserRole } from "./constants";

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
  phoneNumber: string;
  whatsappNumber?: string;
  batchId?: string;
}

export interface Teacher extends User {
  role: "teacher";
  department: string;
}

export interface Admin extends User {
  role: "admin";
}

export interface Batch {
  id: string;
  name: string;
  teacherId: string;
  studentIds: string[];
  timetableId?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // ISO Date string
  status: "present" | "absent" | "late";
  classId: string; // Reference to a class in timetable
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
