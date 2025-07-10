
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, UserX, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@/lib/types";
import { DEPARTMENTS } from "@/lib/constants";
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

export default function PassedOutStudentsPage() {
  const { toast } = useToast();
  const [passedOutStudents, setPassedOutStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchPassedOutStudents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/students?status=passed_out");
      if (!res.ok) throw new Error("Failed to fetch passed-out students");
      const data = await res.json();
      setPassedOutStudents(data.students || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPassedOutStudents();
  }, [toast]);

  const handleDownloadDetails = () => {
    if (passedOutStudents.length === 0) {
      toast({ title: "No Data", description: "There are no passed-out students to download.", variant: "destructive" });
      return;
    }

    const dataForExcel = passedOutStudents.map(student => ({
      "Student ID": student.studentId,
      "Name": student.name,
      "Email": student.email,
      "Roll Number": student.rollNumber,
      "Registration Number": student.registrationNumber,
      "Department": DEPARTMENTS.find(d => d.value === student.department)?.label || student.department,
      "Admission Year": student.admissionYear,
      "Phone Number": student.phoneNumber,
      "WhatsApp Number": student.whatsappNumber,
      "Father's Name": student.personalDetails?.fatherName,
      "Father's Phone": student.personalDetails?.fatherPhone,
      "Mother's Name": student.personalDetails?.motherName,
      "Mother's Phone": student.personalDetails?.motherPhone,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PassedOutStudents");
    XLSX.writeFile(workbook, "passed_out_student_records.xlsx");
    
    toast({ title: "Download Successful", description: "The records of passed-out students have been downloaded." });
  };
  
  const handleRemoveAll = async () => {
    setIsDeleting(true);
    try {
        const response = await fetch('/api/students/passed-out', {
            method: 'DELETE',
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to remove students.');
        }
        toast({ title: "Success", description: result.message });
        setPassedOutStudents([]); // Clear the list on the frontend
    } catch (error: any) {
        toast({ title: "Deletion Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Passed Out Students"
        description="View and manage records of students who have completed the program."
        icon={UserX}
        actions={
          <div className="flex gap-2">
            <Button onClick={handleDownloadDetails} variant="outline" disabled={isLoading || passedOutStudents.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Download Details
            </Button>
            <Button onClick={() => setIsDeleteDialogOpen(true)} variant="destructive" disabled={isLoading || passedOutStudents.length === 0}>
                <Trash2 className="mr-2 h-4 w-4" /> Remove All Records
            </Button>
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Alumni Records</CardTitle>
          <CardDescription>
            This is a list of all students who have been marked as "Passed Out".
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Admission Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passedOutStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{DEPARTMENTS.find(d => d.value === student.department)?.label}</TableCell>
                    <TableCell>{student.admissionYear}</TableCell>
                  </TableRow>
                ))}
                {passedOutStudents.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center h-24">No passed-out students found.</TableCell></TableRow>
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
                    This action cannot be undone. This will permanently delete all {passedOutStudents.length} passed-out student records and their authentication accounts. This is for system cleanup and data privacy compliance.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemoveAll} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm & Delete All
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
