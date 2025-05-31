
export const DEPARTMENTS = [
  { value: "cse", label: "Computer Science & Engineering" },
  { value: "it", label: "Information Technology" },
  { value: "ece", label: "Electronics & Communication Engineering" },
  { value: "ee", label: "Electrical Engineering" },
  { value: "me", label: "Mechanical Engineering" },
  { value: "ce", label: "Civil Engineering" },
  // Add more departments as needed
];

export const USER_ROLES = {
  STUDENT: "student",
  TEACHER: "teacher",
  ADMIN: "admin",
  HOST: "host", // Added Host role
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const USER_ROLE_OPTIONS = [
  { value: USER_ROLES.STUDENT, label: "Student" },
  { value: USER_ROLES.TEACHER, label: "Teacher" },
  { value: USER_ROLES.ADMIN, label: "Admin" },
  { value: USER_ROLES.HOST, label: "Host" }, // Added Host option
];

export const SECTIONS = ["A", "B", "C", "D", "E", "F", "G"] as const;
export type Section = typeof SECTIONS[number];

export const SECTION_OPTIONS = SECTIONS.map(section => ({ value: section, label: `Section ${section}` }));
