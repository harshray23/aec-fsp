
"use client"; 

import { DashboardLayout } from "@/components/shared/DashboardLayout";
import type { NavItem } from "@/lib/types";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserPlus, BookUser, ClipboardList, CalendarDays, BarChart3, Settings, GraduationCap, ShieldAlert, Briefcase, UserCog, UserCircle, CheckSquare, MonitorPlay, ServerCog, FileCog, UserCheck } from "lucide-react"; 
import React from "react";
import { getMockCurrentUser } from "@/lib/mockData"; 

const getNavItems = (role: "student" | "teacher" | "admin" | "host" | "guest"): NavItem[] => {
  switch (role) {
    case "student":
      return [
        { href: "/student/dashboard", label: "My Dashboard", icon: LayoutDashboard, tooltip: "View your batch and attendance" },
        { href: "/student/profile", label: "My Profile", icon: GraduationCap, tooltip: "View your profile" },
      ];
    case "teacher":
      return [
        { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard, tooltip: "Teacher overview" },
        { href: "/teacher/profile", label: "My Profile", icon: UserCircle, tooltip: "View your profile" },
        { href: "/teacher/my-assigned-batches", label: "My Assigned Batches", icon: BookUser, tooltip: "View batches assigned to you" },
        { href: "/teacher/timetables", label: "View Timetables", icon: CalendarDays, tooltip: "View timetables for assigned batches" }, // Label updated
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
        { href: "/admin/reports", label: "View Reports", icon: BarChart3, tooltip: "View system-wide reports" }, // Added Admin Reports
        { href: "/admin/settings", label: "System Settings", icon: Settings, tooltip: "Configure system settings" },
      ];
    case "host":
      return [
        { href: "/host/dashboard", label: "Host Dashboard", icon: ServerCog, tooltip: "Host overview" },
        { href: "/host/user-generation", label: "User Generation", icon: UserPlus, tooltip: "Generate teacher/admin accounts" },
        { href: "/host/user-approval", label: "User Approval", icon: UserCheck, tooltip: "Approve or reject new user registrations" },
        {
          href: "/host/monitoring",
          label: "Monitoring",
          icon: MonitorPlay,
          tooltip: "Monitor system components",
          children: [
            { href: "/host/monitoring/website", label: "Website Status", icon: FileCog, tooltip: "Monitor website" },
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

export default function AppPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentUser = getMockCurrentUser(pathname); 
  
  const navItems = getNavItems(currentUser.role as "student" | "teacher" | "admin" | "host" | "guest");

  const displayUserRole = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);

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
