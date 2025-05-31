
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, ClipboardList, CalendarDays, BarChart3, GraduationCap, BookUser } from "lucide-react"; // Removed ClipboardList as it's for attendance
import Link from "next/link";

const quickStats = [
  { title: "Active Batches", value: "0", icon: Users, color: "text-primary" },
  { title: "Students Enrolled", value: "0", icon: GraduationCap, color: "text-green-500" },
  { title: "Today's Classes", value: "0", icon: CalendarDays, color: "text-purple-500" },
  // Overall attendance might be complex to calculate here without backend, keeping as placeholder or removing
  // { title: "Overall Attendance", value: "0%", icon: ClipboardList, color: "text-orange-500" }, 
];

const actions = [
  // "Assign Students to Batch" was already deprecated for teachers.
  // "Mark Attendance" removed.
  { href: "/teacher/my-assigned-batches", label: "View My Assigned Batches", icon: BookUser },
  { href: "/teacher/timetables", label: "Manage Timetables", icon: CalendarDays }, 
  { href: "/teacher/reports", label: "View Performance Reports", icon: BarChart3 },
];

export default function TeacherDashboardPage() {
  return (
    <div className="space-y-8">
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
              <div className="text-2xl font-bold">{stat.value}</div>
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
          {/* Placeholder for recent activity feed */}
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
    title: "Teacher Dashboard - AEC FSP Portal",
};
