
"use client"; 

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Users, UserPlus, BookUser, Settings, Briefcase, GraduationCap, CheckSquare, Loader2, BookCopy, Database, Trash2 } from "lucide-react"; 
import Link from "next/link";
import type { Announcement, Student } from "@/lib/types";
import { AnnouncementDialog } from "@/components/shared/AnnouncementDialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const LOCAL_STORAGE_ANNOUNCEMENT_KEY = "aecFspAnnouncements";

export default function AdminDashboardPage() {
  const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [stats, setStats] = useState({ students: 0, teachers: 0, batches: 0, admins: 0, testsConducted: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [studentsRes, teachersRes, batchesRes, adminsRes] = await Promise.all([
          fetch('/api/students?limit=99999&simple=true'), // Simplified API call
          fetch('/api/teachers'),
          fetch('/api/batches'),
          fetch('/api/admins')
        ]);

        if (!studentsRes.ok || !teachersRes.ok || !batchesRes.ok || !adminsRes.ok) {
            throw new Error("Failed to fetch all dashboard statistics.");
        }
        
        const studentsApiResponse = await studentsRes.json();
        const studentsData: Student[] = studentsApiResponse.students;
        const teachersData = await teachersRes.json();
        const batchesData = await batchesRes.json();
        const adminsData = await adminsRes.json();

        const testsConducted = studentsData.reduce((acc, student) => {
          return acc + (student.academics?.tests?.length || 0);
        }, 0);

        setStats({
          students: studentsData.length,
          teachers: teachersData.length,
          batches: batchesData.length,
          admins: adminsData.length,
          testsConducted: testsConducted,
        });

      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();

    // Check for announcements
    const announcementsRaw = localStorage.getItem(LOCAL_STORAGE_ANNOUNCEMENT_KEY);
    if (announcementsRaw) {
      const announcements: Announcement[] = JSON.parse(announcementsRaw);
      if (announcements.length > 0) {
        const latest = announcements.sort((a, b) => b.timestamp - a.timestamp)[0];
        const dismissedKey = `dismissed_announcement_${latest.id}`;
        if (!sessionStorage.getItem(dismissedKey)) {
          setLatestAnnouncement(latest);
          setIsAnnouncementDialogOpen(true);
        }
      }
    }
  }, [toast]);

  const handleCloseAnnouncementDialog = () => {
    if (latestAnnouncement) {
      sessionStorage.setItem(`dismissed_announcement_${latestAnnouncement.id}`, "true");
    }
    setIsAnnouncementDialogOpen(false);
    setLatestAnnouncement(null);
  };

  const adminStats = [
    { title: "Total Students", value: stats.students.toString(), icon: GraduationCap, color: "text-blue-500" },
    { title: "Active Teachers", value: stats.teachers.toString(), icon: Briefcase, color: "text-green-500" },
    { title: "Total Batches", value: stats.batches.toString(), icon: BookUser, color: "text-purple-500" },
    { title: "Tests Recorded", value: stats.testsConducted.toString(), icon: BookCopy, color: "text-orange-500" },
    { title: "Active Admins", value: stats.admins.toString(), icon: ShieldAlert, color: "text-red-500" },
  ];

  const adminActions = [
    { href: "/admin/users/teachers", label: "Manage Teachers", icon: Briefcase, description: "Add, view, or edit teacher accounts." },
    { href: "/admin/users/admins", label: "Manage Admins", icon: ShieldAlert, description: "Manage other administrator accounts." },
    { href: "/admin/users/students", label: "View & Download Students", icon: GraduationCap, description: "Browse student records and download personal data." },
    { href: "/admin/batches", label: "View Batches & Timetables", icon: BookUser, description: "Oversee all program batches and their schedules." },
    { href: "/admin/attendance", label: "Manage Attendance", icon: CheckSquare, description: "Mark and manage student attendance." },
    { href: "/admin/academics", label: "Manage Academics", icon: BookCopy, description: "Track and manage student test scores." },
    { href: "/admin/settings", label: "System Settings", icon: Settings, description: "Configure overall system settings." },
  ];

  return (
    <div className="space-y-8">
      <AnnouncementDialog
        announcement={latestAnnouncement}
        isOpen={isAnnouncementDialogOpen}
        onClose={handleCloseAnnouncementDialog}
      />
      <PageHeader
        title="Admin Dashboard"
        description="Oversee and manage the Finishing School Program."
        icon={ShieldAlert}
        actions={
          <Button asChild>
            <Link href="/admin/users/create">
              <UserPlus className="mr-2 h-4 w-4" /> Register New User
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {adminStats.map((stat) => (
          <Card key={stat.title} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-1/2" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
              <p className="text-xs text-muted-foreground">System-wide count</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Administrative Actions</CardTitle>
          <CardDescription>Key management functions for the system.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {adminActions.map((action) => (
            <Button key={action.href} variant="outline" asChild className="justify-start text-left h-auto py-3">
               <Link href={action.href} className="flex items-center gap-3">
                <action.icon className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>System Health & Logs</CardTitle>
          <CardDescription>Overview of system status and recent critical logs.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">System is operating normally.</p>
        </CardContent>
      </Card>
    </div>
  );
}
