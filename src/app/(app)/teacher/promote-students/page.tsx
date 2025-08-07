
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, TrendingUp } from "lucide-react";
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
import { Alert, AlertTitle } from "@/components/ui/alert";

const YEARS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
];

export default function PromoteStudentsPage() {
  const { toast } = useToast();
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPromoting, setIsPromoting] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [promotionAction, setPromotionAction] = useState<'promote' | 'pass_out'>('promote');
  
  const firstSelectedStudentYear = useMemo(() => {
    if (selectedStudents.length === 0) return null;
    return allStudents.find(s => s.id === selectedStudents[0])?.currentYear;
  }, [selectedStudents, allStudents]);

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/students?limit=99999");
        if (!res.ok) throw new Error("Failed to fetch students");
        const data = await res.json();
        setAllStudents(data.students || []);
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [toast]);

  const filteredStudents = useMemo(() => {
    return allStudents.filter(student => {
      if (student.status === 'passed_out') return false;
      const departmentMatch = selectedDepartment === "all" || student.department === selectedDepartment;
      const yearMatch = selectedYear === "all" || String(student.currentYear || '') === selectedYear;
      return departmentMatch && yearMatch;
    });
  }, [allStudents, selectedDepartment, selectedYear]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedStudents([]); // Clear selection first to avoid mixed years
    if (checked) {
      if (filteredStudents.length > 0) {
        const firstYear = filteredStudents[0].currentYear;
        // Select all students matching the year of the first student in the filtered list
        const studentsOfSameYear = filteredStudents
          .filter(s => s.currentYear === firstYear)
          .map(s => s.id);
        setSelectedStudents(studentsOfSameYear);
      }
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectSingle = (student: Student, checked: boolean) => {
    if (checked) {
       if (selectedStudents.length === 0 || student.currentYear === firstSelectedStudentYear) {
         setSelectedStudents(prev => [...prev, student.id]);
       } else {
         toast({
           title: "Mixed Selection Not Allowed",
           description: "You can only select students from the same academic year to promote.",
           variant: "destructive"
         });
       }
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== student.id));
    }
  };
  
  const openPromotionDialog = () => {
    if (selectedStudents.length === 0) return;
    
    // The action is determined by the year of the *first selected student*
    if (firstSelectedStudentYear === 4) {
      setPromotionAction('pass_out');
    } else {
      setPromotionAction('promote');
    }
    setIsPromotionDialogOpen(true);
  };

  const handlePromote = async () => {
    if (selectedStudents.length === 0) {
      toast({ title: "No students selected", description: "Please select students to promote.", variant: "destructive" });
      return;
    }

    const payload = {
        studentIds: selectedStudents,
        action: promotionAction,
    };
    
    setIsPromoting(true);
    try {
        const response = await fetch('/api/students/promote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to process request.');
        }
        toast({ title: "Success", description: result.message });
        
        // Refresh student list from the server to get the most accurate data
        await fetch("/api/students?limit=99999").then(res => res.json()).then(data => setAllStudents(data.students || []));
        setSelectedStudents([]);

    } catch (error: any) {
        toast({ title: "Promotion Failed", description: error.message, variant: "destructive" });
    } finally {
        setIsPromoting(false);
        setIsPromotionDialogOpen(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Promote Students"
        description="Select students from the same academic year and promote them."
        icon={TrendingUp}
      />
      <Card>
        <CardHeader>
          <CardTitle>Filter Students</CardTitle>
          <CardDescription>
            Use the filters to narrow down the list of students. You can only promote students from one academic year at a time.
          </CardDescription>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <Select onValueChange={setSelectedDepartment} defaultValue="all">
              <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={setSelectedYear} defaultValue="all">
              <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {YEARS.map((year) => (
                  <SelectItem key={year.value} value={year.value}>{year.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
             <Button onClick={openPromotionDialog} disabled={selectedStudents.length === 0}>
                <TrendingUp className="mr-2 h-4 w-4" /> 
                <span>
                    {selectedStudents.length > 0
                        ? firstSelectedStudentYear === 4
                            ? `Mark ${selectedStudents.length} as Passed Out`
                            : `Promote ${selectedStudents.length} Student(s)`
                        : "Promote Students"}
                </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
            {selectedStudents.length > 0 && (
                <Alert className="mb-4">
                  <AlertTitle>
                    {selectedStudents.length} student(s) from {firstSelectedStudentYear}{firstSelectedStudentYear === 1 ? 'st' : firstSelectedStudentYear === 2 ? 'nd' : firstSelectedStudentYear === 3 ? 'rd' : 'th'} year selected.
                  </AlertTitle>
                </Alert>
              )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedStudents.length > 0 && selectedStudents.length === filteredStudents.filter(s => s.currentYear === firstSelectedStudentYear).length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Current Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} data-state={selectedStudents.includes(student.id) ? 'selected' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => handleSelectSingle(student, !!checked)}
                        disabled={selectedStudents.length > 0 && student.currentYear !== firstSelectedStudentYear}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>{DEPARTMENTS.find(d => d.value === student.department)?.label}</TableCell>
                    <TableCell>{student.currentYear ? `${student.currentYear}${student.currentYear === 1 ? 'st' : student.currentYear === 2 ? 'nd' : student.currentYear === 3 ? 'rd' : 'th'}` : 'N/A'}</TableCell>
                  </TableRow>
                ))}
                {filteredStudents.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">No students match the current filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            </>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={isPromotionDialogOpen} onOpenChange={setIsPromotionDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                <AlertDialogDescription>
                    {promotionAction === 'promote'
                        ? `You are about to promote ${selectedStudents.length} student(s) to the next academic year. Are you sure?`
                        : `You are about to mark ${selectedStudents.length} final year student(s) as "Passed Out". Their status will be updated accordingly. Are you sure?`
                    }
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handlePromote} disabled={isPromoting}>
                    {isPromoting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {promotionAction === 'promote' ? 'Confirm & Promote' : 'Mark as Passed Out'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
