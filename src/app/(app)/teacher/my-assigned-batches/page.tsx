
"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookUser, Eye, Loader2 } from "lucide-react";
import { DEPARTMENTS, USER_ROLES } from "@/lib/constants";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Batch } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function TeacherMyAssignedBatchesPage() {
  const [assignedBatches, setAssignedBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchBatches = async () => {
      setIsLoading(true);
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
        setAssignedBatches(allBatches.filter(b => b.teacherId === teacherId));
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchBatches();
  }, [toast]);

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
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
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
                  <TableCell className="truncate max-w-[100px]">{batch.id}</TableCell>
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
                  <TableCell colSpan={8} className="text-center text-muted-foreground h-24">
                    You are not currently assigned to any batches.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
