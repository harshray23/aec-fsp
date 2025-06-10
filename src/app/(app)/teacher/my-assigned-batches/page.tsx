
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookUser, Eye, Home } from "lucide-react";
import { getMockCurrentUser, batches as allBatches } from "@/lib/mockData";
import { DEPARTMENTS } from "@/lib/constants";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TeacherMyAssignedBatchesPage() {
  const pathname = usePathname();
  const currentUser = getMockCurrentUser(pathname);

  const assignedBatches = allBatches.filter(batch => batch.teacherId === currentUser.id);

  const getDepartmentLabel = (deptValue: string) => {
    const dept = DEPARTMENTS.find(d => d.value === deptValue);
    return dept ? dept.label : deptValue;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Assigned Batches"
        description="View the FSP batches you are currently assigned to teach."
        icon={BookUser}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Assigned Batch List</CardTitle>
          <CardDescription>These are the batches you are responsible for.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Batch Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedBatches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>{batch.id}</TableCell>
                  <TableCell className="font-medium">{batch.name}</TableCell>
                  <TableCell>{getDepartmentLabel(batch.department)}</TableCell>
                  <TableCell>{batch.topic}</TableCell>
                  <TableCell>{batch.roomNumber || "N/A"}</TableCell>
                  <TableCell>{batch.studentIds.length}</TableCell>
                  <TableCell>
                    <Badge variant={batch.status === "Ongoing" ? "default" : batch.status === "Scheduled" ? "outline" : "secondary"}>
                      {batch.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild disabled>
                      <Link href={`/teacher/batches/view/${batch.id}`}> 
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {assignedBatches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    You are not currently assigned to any batches.
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
