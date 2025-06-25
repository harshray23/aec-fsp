
"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ServerCog, UserPlus, MonitorPlay, Users, BookUser, CalendarDays, ShieldAlert, FileCog, Briefcase, GraduationCap, UserCheck, Megaphone, Trash2, Database, Loader2 } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


export default function HostDashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState({ teachers: 0, admins: 0, batches: 0, students: 0, hosts: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSeedDialogOpen, setIsSeedDialogOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [teachersRes, adminsRes, batchesRes, studentsRes, hostsRes] = await Promise.all([
          fetch('/api/teachers'),
          fetch('/api/admins'),
          fetch('/api/batches'),
          fetch('/api/students'),
          fetch('/api/hosts')
        ]);

        if (!teachersRes.ok || !adminsRes.ok || !batchesRes.ok || !studentsRes.ok || !hostsRes.ok) {
          throw new Error("Failed to fetch dashboard statistics.");
        }

        setStats({
          teachers: (await teachersRes.json()).length,
          admins: (await adminsRes.json()).length,
          batches: (await batchesRes.json()).length,
          students: (await studentsRes.json()).length,
          hosts: (await hostsRes.json()).length
        });

      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [toast]);

  const hostStats = [
    { title: "Management Users", value: stats.hosts.toString(), icon: ServerCog, color: "text-orange-500", href: "/host/monitoring/hosts" },
    { title: "Total Teachers", value: stats.teachers.toString(), icon: Briefcase, color: "text-green-500", href: "/host/monitoring/teachers" },
    { title: "Total Admins", value: stats.admins.toString(), icon: ShieldAlert, color: "text-red-500", href: "/host/monitoring/admins" },
    { title: "Total Batches", value: stats.batches.toString(), icon: BookUser, color: "text-purple-500", href: "/host/monitoring/batches" },
    { title: "Total Students", value: stats.students.toString(), icon: GraduationCap, color: "text-blue-500" }, 
  ];

  const hostActions = [
    { href: "/host/user-approval", label: "Approve User Registrations", icon: UserCheck, description: "Review and approve new Admin/Teacher accounts." },
    { href: "/host/announcements", label: "Send Announcements", icon: Megaphone, description: "Broadcast messages to all users." },
    { href: "/host/monitoring/website", label: "Monitor Website Status", icon: FileCog, description: "View overall website health and status." },
    { href: "/host/monitoring/batches", label: "Monitor Batches", icon: BookUser, description: "Oversee all program batches." },
    { href: "/host/monitoring/timetables", label: "Monitor Timetables", icon: CalendarDays, description: "View all batch timetables." },
  ];
  
  const handleClearAnnouncements = () => {
    try {
      localStorage.removeItem("aecFspAnnouncements");
      toast({
        title: "Announcements Cleared",
        description: "All announcements have been successfully deleted.",
      });
    } catch (error) {
      console.error("Failed to clear announcements:", error);
      toast({
        title: "Error",
        description: "Could not clear announcements from local storage.",
        variant: "destructive",
      });
    }
  };
  
  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
        const response = await fetch('/api/dev/seed-database', { method: 'POST' });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to seed database.');
        }
        toast({
            title: "Database Seeded!",
            description: result.message,
        });
        // Optionally, refresh stats or the page
        window.location.reload();
    } catch (error: any) {
        toast({
            title: "Seeding Failed",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setIsSeeding(false);
        setIsSeedDialogOpen(false);
    }
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Management Dashboard"
        description="System overview and management tools for Management."
        icon={ServerCog}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {hostStats.map((stat) => (
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
              {stat.href ? (
                <Link href={stat.href} className="text-xs text-primary hover:underline">View details</Link>
              ) : (
                <p className="text-xs text-muted-foreground">System-wide count</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Management Actions</CardTitle>
          <CardDescription>Key management functions for the Management panel.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {hostActions.map((action) => (
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
          <CardTitle>Announcements Management</CardTitle>
          <CardDescription>Actions related to system-wide announcements.</CardDescription>
        </CardHeader>
        <CardContent>
           <Button variant="destructive" onClick={handleClearAnnouncements}>
                <Trash2 className="mr-2 h-4 w-4" /> Clear All Announcements
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
                This will remove all sent announcements from being displayed to users. This action cannot be undone.
            </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-yellow-500/50">
        <CardHeader>
          <CardTitle>Developer Tools</CardTitle>
          <CardDescription>Actions for populating and testing the application.</CardDescription>
        </CardHeader>
        <CardContent>
           <Button variant="outline" onClick={() => setIsSeedDialogOpen(true)}>
                <Database className="mr-2 h-4 w-4" /> Seed Database with Sample Data
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
                This will populate the database with sample students, teachers, and batches. It will not overwrite existing data.
            </p>
        </CardContent>
      </Card>
      
      <AlertDialog open={isSeedDialogOpen} onOpenChange={setIsSeedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to seed the database?</AlertDialogTitle>
            <AlertDialogDescription>
              This will add sample data (students, teachers, batches) to your Firestore collections.
              This action is designed to not overwrite existing data, but it cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSeeding}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSeedDatabase} disabled={isSeeding}>
              {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSeeding ? "Seeding..." : "Confirm & Seed"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
