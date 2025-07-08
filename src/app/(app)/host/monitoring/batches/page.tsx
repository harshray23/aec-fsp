
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
import { isAfter, startOfDay } from "date-fns";

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

  const getDepartmentLabels = (deptValues?: string[]) => {
    if (!deptValues || deptValues.length === 0) return "N/A";
    const labels = deptValues.map(value => {
        const dept = DEPARTMENTS.find(d => d.value === value);
        return dept ? dept.label : value;
    });
    if (labels.length > 2) {
      return `${labels.slice(0, 2).join(', ')} +${labels.length - 2} more`;
    }
    return labels.join(', ');
  };

  const getDynamicStatus = (batch: Batch): "Scheduled" | "Ongoing" | "Completed" => {
    if (batch.status === "Completed") {
      return "Completed";
    }
    try {
      const today = startOfDay(new Date());
      const startDate = startOfDay(new Date(batch.startDate));
      const endDate = startOfDay(new Date(batch.endDate));

      if (isAfter(today, endDate)) {
        return "Completed";
      }
      
      if (isAfter(today, startDate) || today.getTime() === startDate.getTime()) {
        return "Ongoing";
      }
    } catch (e) {
      console.error("Invalid date for batch:", batch.name, batch.startDate, batch.endDate);
      return "Scheduled";
    }
    return "Scheduled";
  };
  
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
                <TableHead>Batch Name</TableHead>
                <TableHead>Departments</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Teachers</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.name}</TableCell>
                  <TableCell>{getDepartmentLabels(batch.departments)}</TableCell>
                  <TableCell>{batch.topic}</TableCell>
                  <TableCell>{getTeacherNames(batch.teacherIds)}</TableCell>
                  <TableCell>{batch.roomNumber || "N/A"}</TableCell>
                  <TableCell>{batch.studentIds.length}</TableCell>
                  <TableCell>
                    {(() => {
                        const status = getDynamicStatus(batch);
                        return (
                            <Badge variant={status === "Ongoing" ? "default" : status === "Scheduled" ? "outline" : "secondary"}>
                              {status}
                            </Badge>
                        );
                    })()}
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
