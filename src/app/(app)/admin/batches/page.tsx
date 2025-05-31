
"use client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookUser, Eye, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { batches as mockBatches, teachers as mockTeachersData } from "@/lib/mockData"; // Import from central store
import { DEPARTMENTS } from "@/lib/constants";


export default function AdminBatchOverviewPage() {

  const getTeacherName = (teacherId: string) => {
    const teacher = mockTeachersData.find(t => t.id === teacherId);
    if (teacher) return teacher.name;
    // If teacherId matches an admin's ID (because admin created it)
    // For now, we can show "Admin Created" or similar.
    // A more robust solution would involve checking admin list or having a dedicated field.
    if (teacherId.startsWith("ADMIN_")) return "Admin (Self-Assigned)";
    return "N/A";
  };

  const getDepartmentLabel = (deptValue: string) => {
    const dept = DEPARTMENTS.find(d => d.value === deptValue);
    return dept ? dept.label : deptValue;
  }
  
  return (
    <div className="space-y-8">
      <PageHeader
        title="Batch Overview"
        description="View and manage all Finishing School Program batches."
        icon={BookUser}
        actions={
          <Button asChild>
            <Link href="/admin/batches/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Batch
            </Link>
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Batches</CardTitle>
          <CardDescription>A list of current, scheduled, and completed FSP batches.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Batch Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Lead Teacher/Creator</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Details</TableHead>
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
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/batches/${batch.id}`}> {/* Placeholder link */}
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {mockBatches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No batches found.
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
