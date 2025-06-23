
"use client"; 

import React, { useEffect, useState } from "react";
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

export default function ViewStudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all"); 

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [studentsRes, batchesRes] = await Promise.all([
          fetch('/api/students'),
          fetch('/api/batches')
        ]);
        if (!studentsRes.ok || !batchesRes.ok) throw new Error("Failed to fetch data.");
        
        setStudents(await studentsRes.json());
        setBatches(await batchesRes.json());

      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);
  
  const getBatchName = (batchId?: string) => {
    if (!batchId) return "N/A";
    return batches.find(b => b.id === batchId)?.name || batchId;
  };

  const filteredStudents = students.filter(student =>
    (student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (student.rollNumber && student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (selectedDepartment === "all" || student.department === selectedDepartment)
  );

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
              placeholder="Search by name, ID, roll no..." 
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
                <TableHead>Status</TableHead> 
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.studentId}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{DEPARTMENTS.find(d => d.value === student.department)?.label || student.department}</TableCell>
                  <TableCell>{student.section || "N/A"}</TableCell>
                  <TableCell>{student.rollNumber}</TableCell>
                  <TableCell>{getBatchName(student.batchId)}</TableCell> 
                  <TableCell>
                    <Badge variant={"default"}> 
                      Active
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground h-24">
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
