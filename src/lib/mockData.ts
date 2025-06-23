
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
