
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

// Mock data - replace with actual data fetching
const mockStudentData = {
  name: "Student User", // Default from layout if needed, or placeholder
  studentId: "N/A",
  batch: {
    name: "No Batch Assigned",
    timetable: "N/A",
    teacher: "N/A",
  },
  attendance: [] as { date: string, subject: string, status: "present" | "absent" | "late" }[],
};

const getStatusIcon = (status: "present" | "absent" | "late") => {
  switch (status) {
    case "present":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "absent":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "late":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    default:
      return null;
  }
};

export default function StudentDashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome, ${mockStudentData.name}!`}
        description="Here's an overview of your FSP engagement."
        icon={GraduationCap}
      />

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>My Assigned Batch</CardTitle>
          <CardDescription>Details about your current Finishing School Program batch.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Batch Name:</span>
            <span className="font-medium">{mockStudentData.batch.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Timetable Slot:</span>
            <span className="font-medium">{mockStudentData.batch.timetable}</span>
          </div>
           <div className="flex justify-between">
            <span className="text-muted-foreground">Assigned Teacher:</span>
            <span className="font-medium">{mockStudentData.batch.teacher}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>My Attendance Records</CardTitle>
          <CardDescription>Your attendance for recent FSP sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Subject/Module</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStudentData.attendance.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell>{record.subject}</TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      variant={record.status === "absent" ? "destructive" : record.status === "late" ? "secondary" : "default"}
                      className="flex items-center gap-1.5 justify-end w-24 ml-auto"
                    >
                      {getStatusIcon(record.status)}
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {mockStudentData.attendance.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No attendance records found.
                    </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
    title: "Student Dashboard - AEC FSP Portal",
};
