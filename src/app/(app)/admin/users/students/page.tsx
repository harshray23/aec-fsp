
"use client"; 

import React, { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { GraduationCap, Loader2 } from "lucide-react"; 
import { DEPARTMENTS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Student, Batch } from "@/lib/types";

// A simple debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function ViewStudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters and Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all"); 
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms debounce delay

  // Fetch batches once on mount
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const batchesRes = await fetch('/api/batches');
        if (!batchesRes.ok) throw new Error("Failed to fetch batches.");
        setBatches(await batchesRes.json());
      } catch (error: any) {
        toast({ title: "Error", description: `Could not load batches: ${error.message}`, variant: "destructive" });
      }
    };
    fetchBatches();
  }, [toast]);

  // Fetch students based on filters
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedDepartment !== "all") {
          params.append("department", selectedDepartment);
        }
        if (debouncedSearchTerm) {
          params.append("searchTerm", debouncedSearchTerm);
        }
        
        const res = await fetch(`/api/students?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch students.");
        
        setStudents(await res.json());

      } catch (error: any) {
        toast({ title: "Error", description: `Could not load students: ${error.message}`, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [debouncedSearchTerm, selectedDepartment, toast]);
  
  const getBatchName = (batchId?: string) => {
    if (!batchId) return <Badge variant="outline">N/A</Badge>;
    const batchName = batches.find(b => b.id === batchId)?.name;
    return batchName ? <Badge variant="secondary">{batchName}</Badge> : <Badge variant="outline">{batchId.substring(0,8)}...</Badge>;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="View Students"
        description="Browse and search student records in the FSP system."
        icon={GraduationCap}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>A comprehensive list of all students enrolled in the FSP.</CardDescription>
          <div className="mt-4 flex flex-wrap gap-4">
            <Input 
              placeholder="Search by name..." 
              className="max-w-sm" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map(dept => (
                  <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem> 
                ))}
              </SelectContent>
            </Select>
          </div>
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
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Roll No.</TableHead>
                <TableHead>Batch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.studentId}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{DEPARTMENTS.find(d => d.value === student.department)?.label || student.department}</TableCell>
                  <TableCell>{student.section || "N/A"}</TableCell>
                  <TableCell>{student.rollNumber}</TableCell>
                  <TableCell>{getBatchName(student.batchId)}</TableCell> 
                </TableRow>
              ))}
              {students.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                    No students found with the current filters.
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
