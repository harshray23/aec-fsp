
"use client"; 

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { GraduationCap, Loader2, MoreHorizontal, Trash2, Download, Edit } from "lucide-react"; 
import { DEPARTMENTS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Student, Batch } from "@/lib/types";
import { Button } from "@/components/ui/button";
import StudentEditProfileForm, { type EditStudentProfileFormValues } from "@/components/student/StudentEditProfileForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const PAGE_SIZE = 20;

export default function ViewStudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters and Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all"); 
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // 500ms debounce delay

  // State for pagination
  const [lastVisibleDoc, setLastVisibleDoc] = useState<any | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // State for delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // State for edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filter out passed_out students on the client side
  const activeStudents = useMemo(() => {
    return students.filter(s => s.status !== 'passed_out');
  }, [students]);

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

  const fetchStudents = useCallback(async (isNewQuery: boolean, cursor?: any | null) => {
    if (isNewQuery) {
      setIsLoading(true);
      setStudents([]); // Clear students on a new query
    } else {
      setIsFetchingMore(true);
    }
  
    try {
      const params = new URLSearchParams();
      if (selectedDepartment !== "all") params.append("department", selectedDepartment);
      if (debouncedSearchTerm) params.append("searchTerm", debouncedSearchTerm);
      params.append("limit", String(PAGE_SIZE));
  
      if (cursor) {
        // We will pass the cursor as a stringified object if it exists
        params.append("startAfter", JSON.stringify(cursor));
      }
  
      const res = await fetch(`/api/students?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to fetch students."}));
        throw new Error(errorData.message);
      }
  
      const data = await res.json();
  
      setStudents(prev => isNewQuery ? data.students : [...prev, ...data.students]);
      setLastVisibleDoc(data.lastVisibleDoc); // Use the full document for the cursor
      setHasMore(!!data.lastVisibleDoc && data.students.length === PAGE_SIZE);
  
    } catch (error: any) {
      toast({ title: "Error", description: `Could not load students: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [selectedDepartment, debouncedSearchTerm, toast]);

  // Effect to fetch students when filters change
  useEffect(() => {
    fetchStudents(true, null); // `true` for new query, `null` for no cursor
  }, [debouncedSearchTerm, selectedDepartment, fetchStudents]);
  
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
  
  const openEditDialog = (student: Student) => {
    setStudentToEdit(student);
    setIsEditDialogOpen(true);
  };

  const handleDownload = () => {
    // Note: This download only includes currently loaded students.
    // A proper scalable solution would be a backend job to generate the full report.
    toast({
        title: "Downloading loaded data",
        description: "This export includes only the students currently visible on the page. For a full export, a backend process is recommended.",
        variant: "default",
    });
    if (activeStudents.length === 0) {
      toast({ title: "No Data", description: "No students to export with the current filters.", variant: "destructive" });
      return;
    }
    const dataForExcel = activeStudents.map(student => ({ /* ... mapping logic ... */ }));
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    XLSX.writeFile(workbook, "student_records.xlsx");
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

  const handleAdminSaveProfile = async (values: EditStudentProfileFormValues) => {
    if (!studentToEdit) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/students/${studentToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update student.' }));
        throw new Error(errorData.message);
      }
      
      const result = await response.json();
      setStudents(prev => prev.map(s => s.id === result.student.id ? result.student : s));
      toast({
        title: "Student Updated",
        description: `Profile for ${result.student.name} has been updated.`,
      });
      setIsEditDialogOpen(false);
      setStudentToEdit(null);
    } catch (error: any) {
      toast({
        title: "Error Updating Student",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
              Download Loaded Data
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
              {activeStudents.map((student) => (
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
                         <DropdownMenuItem onClick={() => openEditDialog(student)} className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" /> Edit Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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
            </TableBody>
          </Table>
          )}
          {activeStudents.length === 0 && !isLoading && (
            <div className="text-center text-muted-foreground h-24 flex items-center justify-center">
                No students found with the current filters.
            </div>
          )}
          {hasMore && !isLoading && (
            <div className="mt-6 text-center">
                <Button onClick={() => fetchStudents(false, lastVisibleDoc)} disabled={isFetchingMore}>
                    {isFetchingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isFetchingMore ? "Loading..." : "Load More"}
                </Button>
            </div>
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

      {studentToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Student: {studentToEdit.name}</DialogTitle>
              <DialogDescription>
                Modify the student's personal and contact information below.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[70vh] overflow-y-auto pr-2">
              <StudentEditProfileForm
                studentData={studentToEdit}
                onSave={handleAdminSaveProfile}
                onCancel={() => setIsEditDialogOpen(false)}
                isSaving={isSaving}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
