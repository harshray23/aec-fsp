
"use client"; 

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { GraduationCap, Loader2, MoreHorizontal, Trash2, Download } from "lucide-react"; 
import { DEPARTMENTS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Student, Batch } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import * as XLSX from "xlsx";

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

  // State for delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

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
  
  const getBatchInfo = (batchIds?: string[]) => {
    if (!batchIds || batchIds.length === 0) return <Badge variant="outline">N/A</Badge>;
    if (batchIds.length === 1) {
        const batchName = batches.find(b => b.id === batchIds[0])?.name;
        return batchName ? <Badge variant="secondary">{batchName}</Badge> : <Badge variant="outline">1 Batch</Badge>;
    }
    return <Badge variant="secondary">{batchIds.length} Batches</Badge>;
  };
  
  const openDeleteDialog = (student: Student) => {
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  };

  const handleDownload = () => {
    if (students.length === 0) {
      toast({ title: "No Data", description: "No students to export with the current filters.", variant: "destructive" });
      return;
    }

    const dataForExcel = students.map(student => ({
      "Student ID": student.studentId,
      "Name": student.name,
      "Email": student.email,
      "Roll Number": student.rollNumber,
      "Registration Number": student.registrationNumber,
      "Department": DEPARTMENTS.find(d => d.value === student.department)?.label || student.department,
      "Section": student.section || "N/A",
      "Phone Number": student.phoneNumber,
      "WhatsApp Number": student.whatsappNumber || "N/A",
      "Father's Name": student.personalDetails?.fatherName || "N/A",
      "Mother's Name": student.personalDetails?.motherName || "N/A",
      "Father's Phone": student.personalDetails?.fatherPhone || "N/A",
      "Mother's Phone": student.personalDetails?.motherPhone || "N/A",
      "Father's Occupation": student.personalDetails?.fatherOccupation || "N/A",
      "Mother's Occupation": student.personalDetails?.motherOccupation || "N/A",
      "Blood Group": student.personalDetails?.bloodGroup || "N/A",
      "Present Address": [student.address?.street, student.address?.city, student.address?.state, student.address?.pincode, student.address?.country].filter(Boolean).join(', ') || "N/A",
      "Permanent Address": [student.permanentAddress?.street, student.permanentAddress?.city, student.permanentAddress?.state, student.permanentAddress?.pincode, student.permanentAddress?.country].filter(Boolean).join(', ') || "N/A",
      "12th School Name": student.personalDetails?.schoolName || "N/A",
      "12th Board": student.academics?.class12?.board || "N/A",
      "12th Percentage": student.academics?.class12?.percentage || "N/A",
      "10th Board": student.academics?.class10?.board || "N/A",
      "10th Percentage": student.academics?.class10?.percentage || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "student_records.xlsx");
    toast({ title: "Export Successful", description: "Student records have been downloaded." });
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      const response = await fetch(`/api/students/${studentToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete student.' }));
        throw new Error(errorData.message);
      }
      
      setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
      toast({
        title: "Student Deleted",
        description: `Student ${studentToDelete.name} has been successfully deleted.`,
      });

    } catch (error: any) {
      toast({
        title: "Error Deleting Student",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
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
          <div className="mt-4 flex flex-wrap gap-4 items-center">
            <Input 
              placeholder="Search by name, roll no, email..." 
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
            <Button onClick={handleDownload} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Data
            </Button>
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
                <TableHead>Batch(es)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell>{getBatchInfo(student.batchIds)}</TableCell> 
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(student)}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Student
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {students.length === 0 && !isLoading && (
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
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student 
              "{studentToDelete?.name}" ({studentToDelete?.studentId}) and all associated data,
              including their authentication account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStudentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent} className="bg-destructive hover:bg-destructive/90">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
