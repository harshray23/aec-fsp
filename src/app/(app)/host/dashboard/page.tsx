
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ServerCog, UserPlus, MonitorPlay, Users, BookUser, CalendarDays, ShieldAlert, FileCog, Briefcase, GraduationCap } from "lucide-react"; // Added Briefcase, GraduationCap
import { admins, batches, teachers, students, timetableEntries } from "@/lib/mockData";

export default function HostDashboardPage() {
  const hostStats = [
    { title: "Total Teachers", value: teachers.length.toString(), icon: Briefcase, color: "text-green-500", href: "/host/monitoring/teachers" },
    { title: "Total Admins", value: admins.length.toString(), icon: ShieldAlert, color: "text-red-500", href: "/host/monitoring/admins" },
    { title: "Total Batches", value: batches.length.toString(), icon: BookUser, color: "text-purple-500", href: "/host/monitoring/batches" },
    { title: "Total Students", value: students.length.toString(), icon: GraduationCap, color: "text-blue-500" }, // No direct monitor page for students under host yet
  ];

  const hostActions = [
    { href: "/host/user-generation", label: "Generate User Accounts", icon: UserPlus, description: "Create new accounts for teachers or administrators." },
    { href: "/host/monitoring/website", label: "Monitor Website Status", icon: FileCog, description: "View overall website health and status." },
    { href: "/host/monitoring/batches", label: "Monitor Batches", icon: BookUser, description: "Oversee all program batches." },
    { href: "/host/monitoring/timetables", label: "Monitor Timetables", icon: CalendarDays, description: "View all batch timetables." },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Host Dashboard"
        description="System overview and management tools for the Host."
        icon={ServerCog}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {hostStats.map((stat) => (
          <Card key={stat.title} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
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
          <CardTitle>Host Actions</CardTitle>
          <CardDescription>Key management functions for the Host panel.</CardDescription>
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
    </div>
  );
}

