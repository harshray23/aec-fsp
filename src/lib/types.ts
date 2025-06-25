
import type { UserRole, Section } from "./constants";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Host extends User {
  role: "host";
  uid?: string; // Firebase Authentication User ID
}

export interface AcademicDetails {
  class10?: {
    board?: string;
    percentage?: number;
  };
  class12?: {
    board?: string;
    percentage?: number;
  };
  semesters?: {
    sem1?: number;
    sem2?: number;
    sem3?: number;
    sem4?: number;
    sem5?: number;
    sem6?: number;
    sem7?: number;
    sem8?: number;
  };
}


export interface Student extends User {
  role: "student";
  uid?: string; // Firebase Authentication User ID
  studentId: string;
  rollNumber: string;
  registrationNumber: string;
  department: string;
  section?: Section; // Made section optional
  phoneNumber: string;
  whatsappNumber?: string;
  batchId?: string; // ID of the batch the student is assigned to
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  academics?: AcademicDetails;
}

export type UserApprovalStatus = "pending_approval" | "active" | "rejected";

export interface Teacher extends User {
  role: "teacher";
  uid?: string; // Firebase Authentication User ID
  department: string;
  status: UserApprovalStatus;
  username?: string; // Assigned by Host
  phoneNumber?: string; 
  whatsappNumber?: string; 
}

export interface Admin extends User {
  role: "admin";
  uid?: string; // Firebase Authentication User ID
  phoneNumber?: string;
  whatsappNumber?: string;
  status: UserApprovalStatus;
  username?: string; // Assigned by Host
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
  roomNumber?: string;
}

export interface AttendanceRecord {
  id:string;
  studentId: string;
  date: string; // ISO Date string
  status: "present" | "absent" | "late";
  batchId: string; 
  subject: string; // Subject/module for which attendance was taken
  remarks?: string;
}

export interface TimetableEntry {
  id: string;
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "10:00"
  subject: string;
  batchId: string;
  roomNumber?: string; 
}

// Props for navigation items in DashboardLayout
export interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  children?: NavItem[];
  tooltip?: string;
}

export interface Announcement {
  id: string;
  message: string;
  timestamp: number;
  sender: string; // e.g., "Management"
}
