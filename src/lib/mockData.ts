
// This file will store our "live" mock data for the session.
// In a real application, this would be a database.

import type { Student, Teacher, Admin, Batch, TimetableEntry, AttendanceRecord, User, Host } from "./types";
import { DEPARTMENTS, USER_ROLES, SECTIONS } from "./constants";

// --- Most mock data is removed to switch to live Firestore data ---
// The database seeder (`/api/dev/seed-database.ts`) is now the single source of truth
// for creating the initial set of users. These arrays below are empty
// because all data is fetched directly from Firestore after login.


// --- Deprecated Data Arrays (Empty) ---
// These are kept to prevent import errors in files that still reference them,
// but they should be considered empty and not be used for data.
export let admins: Admin[] = [];
export let hosts: Host[] = [];
export let teachers: Teacher[] = [];
export let students: Student[] = [];
export let batches: Batch[] = [];
export let timetableEntries: TimetableEntry[] = [];
export let attendanceRecords: AttendanceRecord[] = [];
