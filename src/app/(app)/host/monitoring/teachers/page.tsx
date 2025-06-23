
"use client"; 

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Briefcase, MoreHorizontal, Users, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DEPARTMENTS } from "@/lib/constants";
import type { Teacher } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function HostMonitorTeachersPage() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/teachers');
        if (!res.ok) throw new Error("Failed to fetch teachers.");
        setTeachers(await res.json());
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeachers();
  }, [toast]);

  const getDepartmentLabel = (deptValue?: string) => {
    if (!deptValue) return "N/A";
    const dept = DEPARTMENTS.find(d => d.value === deptValue);
    return dept ? dept.label : deptValue;
  };

  const getStatusVariant = (status?: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "active": return "default";
      case "pending_approval": return "secondary";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Monitor Teachers (Host)"
        description="View all registered teacher accounts and their status."
        icon={Users}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Teacher Accounts</CardTitle>
          <CardDescription>A list of all teachers in the FSP system.</CardDescription>
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
                <TableHead>Teacher ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="truncate max-w-[100px]">{teacher.id}</TableCell>
                  <TableCell className="font-medium">{teacher.name}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{getDepartmentLabel(teacher.department)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(teacher.status)}>
                      {teacher.status?.replace("_", " ").split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" disabled>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
               {teachers.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                    No teachers found in the system.
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
