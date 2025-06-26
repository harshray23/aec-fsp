
"use client"; 

import { DashboardLayout } from "@/components/shared/DashboardLayout";
import type { NavItem, User, Student, Teacher, Admin, Host } from "@/lib/types";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UserPlus, BookUser, CalendarDays, BarChart3, Settings, GraduationCap, ShieldAlert, Briefcase, UserCog, UserCircle, CheckSquare, MonitorPlay, ServerCog, FileCog, UserCheck, CalendarCheck2, Megaphone, PlusCircle, BookCopy } from "lucide-react"; 
import React, { useState, useEffect } from "react";
import { USER_ROLES } from "@/lib/constants";

// A comprehensive type for the current user, covering all possible roles and properties.
type CurrentUserType = User & Partial<Student> & Partial<Teacher> & Partial<Admin> & Partial<Host>;


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
            { href: "/admin/batches/create", label: "Create Batch", icon: PlusCircle, tooltip: "Set up a new batch" },
          ]
        },
        { href: "/admin/attendance", label: "Attendance Management", icon: CheckSquare, tooltip: "Mark and manage student attendance" },
        { href: "/admin/academics", label: "Manage Academics", icon: BookCopy, tooltip: "Manage student test scores" },
        { href: "/admin/timetables", label: "Timetable Overview", icon: CalendarDays, tooltip: "View all timetables" },
        { href: "/admin/reports", label: "View Reports", icon: BarChart3, tooltip: "View system-wide reports" }, 
        { href: "/admin/settings", label: "System Settings", icon: Settings, tooltip: "Configure system settings" },
      ];
    case "host":
      return [
        { href: "/host/dashboard", label: "Management Dashboard", icon: ServerCog, tooltip: "Management overview" },
        { href: "/host/user-approval", label: "User Approval", icon: UserCheck, tooltip: "Approve or reject new user registrations" },
        { href: "/host/add-host", label: "Add New Host", icon: UserPlus, tooltip: "Create a new management user" },
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
            { href: "/host/monitoring/hosts", label: "Management Monitor", icon: ServerCog, tooltip: "Monitor management users" },
          ],
        },
      ];
    default:
      return [];
  }
};

const getServerSideUser = (pathname: string): CurrentUserType => {
  // This function ONLY contains server-safe logic (path-based determination)
  // and is used for the initial render on both server and client to avoid hydration mismatch.
  if (pathname.startsWith("/admin")) {
    return { id: "server-admin-fallback", name: "Admin", email: "admin@example.com", role: USER_ROLES.ADMIN, status: "active", username: "server_admin_fallback" };
  } else if (pathname.startsWith("/teacher")) {
    return { id: "server-teacher-fallback", name: "Teacher", email: "teacher@example.com", role: USER_ROLES.TEACHER, department: "N/A", status: "active", username: "server_teacher_fallback" };
  } else if (pathname.startsWith("/student")) {
    return { 
        id: "server-student-fallback", name: "Student", email: "student@example.com", role: USER_ROLES.STUDENT, 
        studentId: "S000F", rollNumber: "N/AF", registrationNumber: "N/AF", department: "N/AF", section: undefined, 
        phoneNumber: "N/AF", isEmailVerified: true, isPhoneVerified: true
    };
  } else if (pathname.startsWith("/host")) {
    return { id: "server-host-fallback", name: "Management", email: "host@example.com", role: USER_ROLES.HOST };
  }
  return { id: "server-guest-fallback", name: "User", email: "user@example.com", role: "guest" as any };
};


export default function AppPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Initialize state with a server-side determined user. This prevents hydration mismatch.
  const [currentUser, setCurrentUser] = useState<CurrentUserType>(() => getServerSideUser(pathname)); 

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    const storedUserString = localStorage.getItem("currentUser");
    if (storedUserString) {
      try {
        const storedUser = JSON.parse(storedUserString);
        // More robust check to prevent crashes from corrupted localStorage data
        if (storedUser && storedUser.id && storedUser.role && storedUser.name && storedUser.email) {
          // Safely update the state on the client after hydration.
          setCurrentUser(storedUser);
        } else {
            // Clear corrupted or incomplete data
            localStorage.removeItem("currentUser");
        }
      } catch (e) {
        console.error("Error parsing currentUser from localStorage:", e);
        localStorage.removeItem("currentUser"); // Clear corrupted data
      }
    }
  }, [pathname]); // Re-run if path changes to support client-side navigation.

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
