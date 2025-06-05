
"use client"; 

import { DashboardLayout } from "@/components/shared/DashboardLayout";
import type { NavItem, User } from "@/lib/types";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserPlus, BookUser, CalendarDays, BarChart3, Settings, GraduationCap, ShieldAlert, Briefcase, UserCog, UserCircle, CheckSquare, MonitorPlay, ServerCog, FileCog, UserCheck, CalendarCheck2, Megaphone } from "lucide-react"; 
import React from "react";
import { admins, teachers, students, hosts } from "@/lib/mockData"; 
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
          let baseUserFromMockData = null;
          switch (storedUser.role) {
            case USER_ROLES.ADMIN:
              baseUserFromMockData = admins.find(a => a.id === storedUser.id);
              break;
            case USER_ROLES.TEACHER:
              baseUserFromMockData = teachers.find(t => t.id === storedUser.id);
              break;
            case USER_ROLES.STUDENT:
              baseUserFromMockData = students.find(s => s.id === storedUser.id);
              break;
            case USER_ROLES.HOST:
              baseUserFromMockData = hosts.find(h => h.id === storedUser.id);
              break;
          }

          if (baseUserFromMockData) {
            // Merge: static fields from mockData, dynamic/latest from storedUser
            return { ...baseUserFromMockData, ...storedUser };
          } else {
            // User from localStorage not found in current static mockData arrays.
            // This can happen for newly registered users. Trust localStorage user.
            console.warn(`User with ID ${storedUser.id} (role: ${storedUser.role}) from localStorage not found in static mockData. Using localStorage version directly.`);
            return storedUser; 
          }
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
    return hosts.find(h => h.email === "management@aec.edu.in") || { id: "default-host-fallback", name: "Management User", email: "management@aec.edu.in", role: USER_ROLES.HOST };
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
