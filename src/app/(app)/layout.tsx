
"use client"; 

import { DashboardLayout } from "@/components/shared/DashboardLayout";
import type { NavItem, User } from "@/lib/types";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserPlus, BookUser, CalendarDays, BarChart3, Settings, GraduationCap, ShieldAlert, Briefcase, UserCog, UserCircle, CheckSquare, MonitorPlay, ServerCog, FileCog, UserCheck, CalendarCheck2, Megaphone } from "lucide-react"; 
import React from "react";
import { getMockCurrentUser as getMockUserFromStorageOrPath, admins, teachers, students, hosts } from "@/lib/mockData"; 
import { USER_ROLES, SECTIONS } from "@/lib/constants";

const getNavItems = (role: "student" | "teacher" | "admin" | "host" | "guest"): NavItem[] => {
  switch (role) {
    case "student":
      return [
        { href: "/student/dashboard", label: "My Dashboard", icon: LayoutDashboard, tooltip: "View your batch and attendance" },
        { href: "/student/profile", label: "My Profile", icon: UserCircle, tooltip: "View your profile" },
        { href: "/student/attendance-calendar", label: "Attendance Calendar", icon: CalendarCheck2, tooltip: "View attendance on calendar" },
      ];
    case "teacher":
      return [
        { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard, tooltip: "Teacher overview" },
        { href: "/teacher/profile", label: "My Profile", icon: UserCircle, tooltip: "View your profile" },
        { href: "/teacher/my-assigned-batches", label: "My Assigned Batches", icon: BookUser, tooltip: "View batches assigned to you" },
        { href: "/teacher/timetables", label: "View Timetables", icon: CalendarDays, tooltip: "View timetables for assigned batches" }, 
        { href: "/teacher/reports", label: "Reports", icon: BarChart3, tooltip: "View reports for assigned batches" },
      ];
    case "admin":
      return [
        { href: "/admin/dashboard", label: "Admin Dashboard", icon: ShieldAlert, tooltip: "System overview" },
        { href: "/admin/profile", label: "My Profile", icon: UserCircle, tooltip: "View your admin profile" },
        { 
          href: "/admin/users", 
          label: "User Management", 
          icon: UserCog,
          tooltip: "Manage users",
          children: [
             { href: "/admin/users/teachers", label: "Manage Teachers", icon: Briefcase, tooltip: "Manage teacher accounts" },
             { href: "/admin/users/admins", label: "Manage Admins", icon: ShieldAlert, tooltip: "Manage admin accounts" },
             { href: "/admin/users/students", label: "View Students", icon: GraduationCap, tooltip: "View student accounts" },
          ]
        },
        { 
          href: "/admin/batches", 
          label: "Batch Management", 
          icon: BookUser, 
          tooltip: "Oversee and manage program batches",
          children: [
            { href: "/admin/batches", label: "Batch Overview", icon: BookUser, tooltip: "View all batches and create new ones" },
            { href: "/admin/batches/assign", label: "Assign Students", icon: UserPlus, tooltip: "Assign students to batches" },
          ]
        },
        { href: "/admin/attendance", label: "Attendance Management", icon: CheckSquare, tooltip: "Mark and manage student attendance" },
        { href: "/admin/timetables", label: "Timetable Overview", icon: CalendarDays, tooltip: "View all timetables" },
        { href: "/admin/reports", label: "View Reports", icon: BarChart3, tooltip: "View system-wide reports" }, 
        { href: "/admin/settings", label: "System Settings", icon: Settings, tooltip: "Configure system settings" },
      ];
    case "host":
      return [
        { href: "/host/dashboard", label: "Management Dashboard", icon: ServerCog, tooltip: "Management overview" },
        { href: "/host/user-approval", label: "User Approval", icon: UserCheck, tooltip: "Approve or reject new user registrations" },
        { href: "/host/announcements", label: "Send Announcements", icon: Megaphone, tooltip: "Broadcast messages to users" },
        {
          href: "/host/monitoring",
          label: "Monitoring",
          icon: MonitorPlay,
          tooltip: "Monitor system components",
          children: [
            { href: "/host/monitoring/website", label: "Website Status", icon: FileCog, tooltip: "Monitor website health" },
            { href: "/host/monitoring/batches", label: "Batch Monitor", icon: BookUser, tooltip: "Monitor batches" },
            { href: "/host/monitoring/timetables", label: "Timetable Monitor", icon: CalendarDays, tooltip: "Monitor timetables" },
            { href: "/host/monitoring/teachers", label: "Teacher Monitor", icon: Users, tooltip: "Monitor teachers" }, 
            { href: "/host/monitoring/admins", label: "Admin Monitor", icon: ShieldAlert, tooltip: "Monitor admins" },
          ],
        },
      ];
    default:
      return [];
  }
};


// Refined getMockCurrentUser function
const getMockCurrentUser = (pathname: string): User & { department?: string; username?: string; status?: string; studentId?: string; rollNumber?: string; registrationNumber?: string; section?: string; phoneNumber?: string; isEmailVerified?: boolean; isPhoneVerified?: boolean; avatarUrl?: string; } => {
  if (typeof window !== 'undefined') {
    const storedUserString = localStorage.getItem("currentUser");
    if (storedUserString) {
      try {
        const storedUser = JSON.parse(storedUserString) as User & { department?: string; username?: string; status?: string; studentId?: string; rollNumber?: string; registrationNumber?: string; section?: string; phoneNumber?: string; isEmailVerified?: boolean; isPhoneVerified?: boolean; avatarUrl?: string;};
        if (storedUser && storedUser.id && storedUser.role) {
          // Consolidate with mock data to ensure all fields are present, prioritizing mockData as source of truth for fixed fields.
          switch (storedUser.role) {
            case USER_ROLES.ADMIN:
              const adminDetails = admins.find(a => a.id === storedUser.id);
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
              const hostDetails = hosts.find(h => h.id === storedUser.id);
              if (hostDetails) return { ...hostDetails, ...storedUser };
              break;
            default: // If role is unknown or doesn't need merging, but is valid
              return storedUser;
          }
          // If details not found in mockData (e.g. ID mismatch), indicates inconsistency
          console.warn(`User with ID ${storedUser.id} and role ${storedUser.role} found in localStorage but not in mockData. Clearing localStorage.`);
          localStorage.removeItem("currentUser");
        }
      } catch (e) {
        console.error("Error parsing currentUser from localStorage:", e);
        localStorage.removeItem("currentUser"); // Clear corrupted data
      }
    }
  }

  // Fallback to path-based determination if localStorage is empty or invalid
  if (pathname.startsWith("/admin")) {
    return admins.find(a => a.email === "harshray2007@gmail.com") || 
           { id: "default-admin-fallback", name: "Admin User", email: "admin@example.com", role: USER_ROLES.ADMIN, status: "active", username: "default_admin_fallback" };
  } else if (pathname.startsWith("/teacher")) {
    return teachers[0] || { id: "default-teacher-fallback", name: "Teacher User", email: "teacher@example.com", role: USER_ROLES.TEACHER, department: "N/A", status: "active", username: "default_teacher_fallback" };
  } else if (pathname.startsWith("/student")) {
    return students[0] || { 
        id: "default-student-fallback", name: "Student User", email: "student@example.com", role: USER_ROLES.STUDENT, 
        studentId: "S000F", rollNumber: "N/AF", registrationNumber: "N/AF", department: "N/AF", section: SECTIONS[0], 
        phoneNumber: "N/AF", isEmailVerified: true, isPhoneVerified: true
    };
  } else if (pathname.startsWith("/host")) {
    return hosts[0] || { id: "default-host-fallback", name: "Management User", email: "host@example.com", role: USER_ROLES.HOST };
  }
  return { id: "guest-user-fallback", name: "User", email: "user@example.com", role: "guest" as any };
};


export default function AppPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentUser = getMockCurrentUser(pathname); 
  
  let displayUserRole = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
  if (currentUser.role === USER_ROLES.HOST) {
    displayUserRole = "Management";
  }
  
  const navItems = getNavItems(currentUser.role as "student" | "teacher" | "admin" | "host" | "guest");


  return (
    <DashboardLayout 
        navItems={navItems} 
        userRole={displayUserRole}
        userName={currentUser.name}
        userEmail={currentUser.email}
    >
      {children}
    </DashboardLayout>
  );
}
