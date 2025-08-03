
export const DEPARTMENTS = [
  { value: "cse", label: "Computer Science & Engineering (CSE)" },
  { value: "it", label: "Information Technology (IT)" },
  { value: "ece", label: "Electronics & Communication Engineering (ECE)" },
  { value: "ee", label: "Electrical Engineering (EE)" },
  { value: "me", label: "Mechanical Engineering (ME)" },
  { value: "ce", label: "Civil Engineering (CE)" },
  { value: "bca", label: "Bachelor of Computer Application (BCA)" },
  { value: "mca", label: "Master of Computer Application (MCA)" },
  { value: "cse_ai_ml", label: "Computer Science & Engineering (AI & ML)" },
  { value: "cse_iot_cs", label: "Computer Science & Engineering (IoT & Cyber Security)" },
  { value: "cst", label: "Computer Science & Technology (CST)" },
  { value: "csbs", label: "Computer Science & Business Systems (CSBS)" },
  { value: "bba", label: "Bachelor of Business Administration (BBA)" },
  { value: "bba_hm", label: "BBA in Hospital Management" },
  { value: "ecs", label: "Electronics & Computer Science (ECS)" },
  { value: "bsc_ds", label: "B.Sc in Data Science" },
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
