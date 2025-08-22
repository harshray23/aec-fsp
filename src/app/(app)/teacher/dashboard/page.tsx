
"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, CalendarDays, BarChart3, GraduationCap, BookUser } from "lucide-react"; 
import Link from "next/link";
import type { Announcement, Batch } from "@/lib/types";
import { AnnouncementDialog } from "@/components/shared/AnnouncementDialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { USER_ROLES } from "@/lib/constants";

const actions = [
  { href: "/teacher/my-assigned-batches", label: "View My Assigned Batches", icon: BookUser },
  { href: "/teacher/timetables", label: "View Timetables", icon: CalendarDays }, 
  { href: "/teacher/reports", label: "View Performance Reports", icon: BarChart3 },
];

export default function TeacherDashboardPage() {
  const { toast } = useToast();
  const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [stats, setStats] = useState({ activeBatches: 0, studentsEnrolled: 0, todayClasses: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      
      // Fetch Announcements
      try {
        const announcementsRes = await fetch('/api/announcements');
        if (announcementsRes.ok) {
            const announcements: Announcement[] = await announcementsRes.json();
            if (announcements.length > 0) {
                const latest = announcements[0];
                const dismissedKey = `dismissed_announcement_${latest.id}`;
                if (!sessionStorage.getItem(dismissedKey)) {
                    setLatestAnnouncement(latest);
                    setIsAnnouncementDialogOpen(true);
                }
            }
        }
      } catch (error: any) {
        console.warn("Could not fetch announcements:", error.message);
      }
      
      // Fetch Stats
      let teacherId = null;
      const storedUserJSON = localStorage.getItem("currentUser");
      if (storedUserJSON) {
        const user = JSON.parse(storedUserJSON);
        if (user && user.role === USER_ROLES.TEACHER) {
          teacherId = user.id;
        }
      }

      if (!teacherId) {
        toast({ title: "Error", description: "Could not identify teacher.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      
      try {
        const res = await fetch('/api/batches');
        if (!res.ok) throw new Error("Failed to fetch batches.");
        
        const allBatches: Batch[] = await res.json();
        const assignedBatches = allBatches.filter(b => b.teacherIds?.includes(teacherId!));
        
        const studentsEnrolled = assignedBatches.reduce((acc, batch) => acc + batch.studentIds.length, 0);
        
        const todayClasses = 0; 
        
        setStats({
          activeBatches: assignedBatches.length,
          studentsEnrolled: studentsEnrolled,
          todayClasses: todayClasses,
        });

      } catch (error: any) {
         toast({ title: "Error Fetching Stats", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [toast]);

  const handleCloseAnnouncementDialog = () => {
    if (latestAnnouncement) {
      sessionStorage.setItem(`dismissed_announcement_${latestAnnouncement.id}`, "true");
    }
    setIsAnnouncementDialogOpen(false);
    setLatestAnnouncement(null);
  };

  const quickStats = [
    { title: "Active Batches", value: stats.activeBatches.toString(), icon: Users, color: "text-primary" },
    { title: "Students Enrolled", value: stats.studentsEnrolled.toString(), icon: GraduationCap, color: "text-green-500" },
    { title: "Today's Classes", value: stats.todayClasses.toString(), icon: CalendarDays, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-8">
      <AnnouncementDialog
        announcement={latestAnnouncement}
        isOpen={isAnnouncementDialogOpen}
        onClose={handleCloseAnnouncementDialog}
      />
      <PageHeader
        title="Teacher Dashboard"
        description="Manage your FSP activities and student progress."
        icon={LayoutDashboard}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.title} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{stat.value}</div>}
              <p className="text-xs text-muted-foreground">Current status</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Access common tasks quickly from here.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {actions.map((action) => (
            <Button key={action.href} variant="outline" asChild className="justify-start text-left h-auto py-3">
              <Link href={action.href} className="flex items-center gap-3">
                <action.icon className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold">{action.label}</p>
                  <p className="text-xs text-muted-foreground">Click to proceed</p>
                </div>
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Overview of recent actions and notifications.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recent activity to display.</p>
        </CardContent>
      </Card>
    </div>
  );
}
