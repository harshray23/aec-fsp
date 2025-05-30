"use client"; // This layout will manage client-side state for navigation

import { DashboardLayout } from "@/components/shared/DashboardLayout";
import type { NavItem } from "@/lib/types";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserPlus, BookUser, ClipboardList, CalendarDays, BarChart3, Settings, GraduationCap, ShieldAlert, Briefcase, UserCog } from "lucide-react";
import React from "react";

// Mock user data - in a real app, this would come from auth context
const MOCK_USERS = {
  student: { name: "Student User", email: "student@aec.edu.in", role: "Student" },
  teacher: { name: "Teacher User", email: "teacher@aec.edu.in", role: "Teacher" },
  admin: { name: "Admin User", email: "admin@aec.edu.in", role: "Admin" },
};

const getNavItems = (role: "student" | "teacher" | "admin"): NavItem[] => {
  switch (role) {
    case "student":
      return [
        { href: "/student/dashboard", label: "My Dashboard", icon: LayoutDashboard, tooltip: "View your batch and attendance" },
        { href: "/student/profile", label: "My Profile", icon: GraduationCap, tooltip: "View your profile" },
        // Add more student-specific links here
      ];
    case "teacher":
      return [
        { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard, tooltip: "Teacher overview" },
        { 
          href: "/teacher/batches", 
          label: "Batches", 
          icon: Users, 
          tooltip: "Manage student batches",
          children: [
            { href: "/teacher/batches/manage", label: "Manage Batches", icon: Users, tooltip: "View and manage batches" },
            { href: "/teacher/batches/assign", label: "Assign Students", icon: UserPlus, tooltip: "Assign students to batches" },
          ]
        },
        { href: "/teacher/attendance", label: "Attendance", icon: ClipboardList, tooltip: "Manage student attendance" },
        { href: "/teacher/timetables", label: "Timetables", icon: CalendarDays, tooltip: "Manage timetables" },
        { href: "/teacher/reports", label: "Reports", icon: BarChart3, tooltip: "View reports" },
      ];
    case "admin":
      return [
        { href: "/admin/dashboard", label: "Admin Dashboard", icon: ShieldAlert, tooltip: "System overview" },
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
        { href: "/admin/batches", label: "Batch Overview", icon: BookUser, tooltip: "View all batches" },
        { href: "/admin/timetables", label: "Timetable Overview", icon: CalendarDays, tooltip: "View all timetables" },
        { href: "/admin/settings", label: "System Settings", icon: Settings, tooltip: "Configure system settings" },
      ];
    default:
      return [];
  }
};

export default function AppPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  let currentRole: "student" | "teacher" | "admin" = "student"; // Default or derive from path/auth
  let currentUser = MOCK_USERS.student;

  if (pathname.startsWith("/admin")) {
    currentRole = "admin";
    currentUser = MOCK_USERS.admin;
  } else if (pathname.startsWith("/teacher")) {
    currentRole = "teacher";
    currentUser = MOCK_USERS.teacher;
  } else if (pathname.startsWith("/student")) {
    currentRole = "student";
    currentUser = MOCK_USERS.student;
  }
  
  const navItems = getNavItems(currentRole);

  return (
    <DashboardLayout 
        navItems={navItems} 
        userRole={currentUser.role}
        userName={currentUser.name}
        userEmail={currentUser.email}
    >
      {children}
    </DashboardLayout>
  );
}
