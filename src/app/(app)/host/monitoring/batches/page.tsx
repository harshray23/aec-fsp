
"use client";
import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookUser, Loader2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DEPARTMENTS } from "@/lib/constants";
import type { Batch, Teacher } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function HostMonitorBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [batchesRes, teachersRes] = await Promise.all([
          fetch('/api/batches'),
          fetch('/api/teachers')
        ]);
        if (!batchesRes.ok || !teachersRes.ok) throw new Error('Failed to fetch data.');
        
        setBatches(await batchesRes.json());
        setTeachers(await teachersRes.json());
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const getTeacherNames = (teacherIds: string[]) => {
    if (!teacherIds || teacherIds.length === 0) return "N/A";
    const teachersMap = new Map(teachers.map(t => [t.id, t.name]));
    return teacherIds.map(id => teachersMap.get(id)).filter(Boolean).join(', ') || "N/A";
  };

  const getDepartmentLabel = (deptValue: string) => {
    const dept = DEPARTMENTS.find(d => d.value === deptValue);
    return dept ? dept.label : deptValue;
  }
  
  if (isLoading) {
    return (
       <div className="space-y-8">
        <PageHeader title="Monitor Batches (Host)" icon={BookUser} />
        <Card className="shadow-lg">
          <CardHeader><CardTitle>All System Batches</CardTitle></CardHeader>
          <CardContent className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
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
                <TableHead>Teachers</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="truncate max-w-[100px]">{batch.id}</TableCell>
                  <TableCell className="font-medium">{batch.name}</TableCell>
                  <TableCell>{getDepartmentLabel(batch.department)}</TableCell>
                  <TableCell>{batch.topic}</TableCell>
                  <TableCell>{getTeacherNames(batch.teacherIds)}</TableCell>
                  <TableCell>{batch.roomNumber || "N/A"}</TableCell>
                  <TableCell>{batch.studentIds.length}</TableCell>
                  <TableCell>
                    <Badge variant={batch.status === "Ongoing" ? "default" : batch.status === "Scheduled" ? "outline" : "secondary"}>
                      {batch.status || "Scheduled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/host/monitoring/batches/${batch.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {batches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground h-24">
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
