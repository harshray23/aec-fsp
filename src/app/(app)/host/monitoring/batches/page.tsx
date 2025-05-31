
"use client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookUser, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { batches as mockBatches, teachers as mockTeachersData } from "@/lib/mockData"; 
import { DEPARTMENTS } from "@/lib/constants";


export default function HostMonitorBatchesPage() {

  const getTeacherName = (teacherId: string) => {
    const teacher = mockTeachersData.find(t => t.id === teacherId);
    return teacher ? teacher.name : "N/A";
  };

  const getDepartmentLabel = (deptValue: string) => {
    const dept = DEPARTMENTS.find(d => d.value === deptValue);
    return dept ? dept.label : deptValue;
  }
  
  return (
    <div className="space-y-8">
      <PageHeader
        title="Monitor Batches (Host)"
        description="Oversee all Finishing School Program batches across the system."
        icon={BookUser}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All System Batches</CardTitle>
          <CardDescription>A comprehensive list of current, scheduled, and completed FSP batches.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Batch Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Assigned Teacher</TableHead>
                <TableHead>Students Enrolled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBatches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>{batch.id}</TableCell>
                  <TableCell className="font-medium">{batch.name}</TableCell>
                  <TableCell>{getDepartmentLabel(batch.department)}</TableCell>
                  <TableCell>{batch.topic}</TableCell>
                  <TableCell>{getTeacherName(batch.teacherId)}</TableCell>
                  <TableCell>{batch.studentIds.length}</TableCell>
                  <TableCell>
                    <Badge variant={batch.status === "Ongoing" ? "default" : batch.status === "Scheduled" ? "outline" : "secondary"}>
                      {batch.status || "Scheduled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild disabled> 
                      {/* Link to a detailed batch view if available, disabled for now */}
                      <Link href={`/host/monitoring/batches/${batch.id}`}> 
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {mockBatches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No batches found in the system.
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

// Removed metadata export
// export const metadata = {
//   title: "Monitor Batches - Host Panel - AEC FSP Portal",
// };

