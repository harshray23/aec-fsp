
"use client";

import React, { useState, useEffect, useMemo } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Student, AcademicTest } from "@/lib/types";
import { DEPARTMENTS } from "@/lib/constants";
import { BookCopy, Loader2, User, Download, PlusCircle, Edit, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import * as XLSX from "xlsx";

const testSchema = z.object({
  id: z.string().optional(),
  testName: z.string().min(2, "Test name is required"),
  testDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  maxMarks: z.coerce.number().positive("Max marks must be positive"),
  marksObtained: z.coerce.number().min(0, "Marks cannot be negative"),
}).refine(data => data.marksObtained <= data.maxMarks, {
    message: "Marks obtained cannot exceed max marks",
    path: ["marksObtained"],
});

type TestFormValues = z.infer<typeof testSchema>;

export default function ManageAcademicsPage() {
  const { toast } = useToast();
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // States for the dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<AcademicTest | null>(null);

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      testName: "",
      testDate: new Date().toISOString().split('T')[0],
      maxMarks: 100,
      marksObtained: 0,
    },
  });

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/students");
        if (!res.ok) throw new Error("Failed to fetch students");
        setAllStudents(await res.json());
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [toast]);

  const filteredStudents = useMemo(() => {
    if (selectedDepartment === "all") return allStudents;
    return allStudents.filter((s) => s.department === selectedDepartment);
  }, [allStudents, selectedDepartment]);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsDialogOpen(true);
  };

  const handleOpenTestForm = (test: AcademicTest | null = null) => {
    if (test) {
      setEditingTest(test);
      form.reset({
        ...test,
        testDate: format(parseISO(test.testDate), 'yyyy-MM-dd'),
      });
    } else {
      setEditingTest(null);
      form.reset({
        testName: "",
        testDate: new Date().toISOString().split('T')[0],
        maxMarks: 100,
        marksObtained: 0,
      });
    }
  };

  const onTestSubmit = (values: TestFormValues) => {
    if (!selectedStudent) return;
    
    let updatedTests = [...(selectedStudent.academics?.tests || [])];
    if (editingTest) {
      // Update existing test
      updatedTests = updatedTests.map(t => t.id === editingTest.id ? { ...t, ...values, id: t.id } : t);
    } else {
      // Add new test
      updatedTests.push({ ...values, id: crypto.randomUUID() });
    }
    
    const updatedStudent: Student = {
        ...selectedStudent,
        academics: {
            ...selectedStudent.academics,
            tests: updatedTests
        }
    };
    setSelectedStudent(updatedStudent);
    handleOpenTestForm(null); // Close the inline form part or reset it
  };

  const handleDeleteTest = (testId: string) => {
     if (!selectedStudent) return;
     const updatedTests = (selectedStudent.academics?.tests || []).filter(t => t.id !== testId);
     const updatedStudent: Student = {
        ...selectedStudent,
        academics: {
            ...selectedStudent.academics,
            tests: updatedTests
        }
    };
    setSelectedStudent(updatedStudent);
  }

  const handleSaveChanges = async () => {
    if (!selectedStudent) return;
    setIsSaving(true);
    try {
        const response = await fetch(`/api/students/${selectedStudent.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ academics: selectedStudent.academics }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to save changes.");
        }
        toast({ title: "Success", description: "Academic records saved successfully." });
        
        // Update the master list of students
        setAllStudents(prev => prev.map(s => s.id === selectedStudent.id ? selectedStudent : s));

        setIsDialogOpen(false);
        setSelectedStudent(null);

    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleDownload = () => {
    const dataForExcel = filteredStudents.flatMap(student => {
        if (!student.academics?.tests || student.academics.tests.length === 0) {
            return [{
                'Student Name': student.name,
                'Student ID': student.studentId,
                'Department': DEPARTMENTS.find(d => d.value === student.department)?.label || student.department,
                'Test Name': 'N/A',
                'Test Date': 'N/A',
                'Marks Obtained': 'N/A',
                'Max Marks': 'N/A',
            }];
        }
        return student.academics.tests.map(test => ({
            'Student Name': student.name,
            'Student ID': student.studentId,
            'Department': DEPARTMENTS.find(d => d.value === student.department)?.label || student.department,
            'Test Name': test.testName,
            'Test Date': format(parseISO(test.testDate), "PPP"),
            'Marks Obtained': test.marksObtained,
            'Max Marks': test.maxMarks,
        }));
    });

    if (dataForExcel.length === 0) {
        toast({ title: "No Data", description: "No students or academic data to export for the selected department.", variant: "destructive" });
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Academic Records");
    XLSX.writeFile(workbook, "academic_records.xlsx");
  }


  return (
    <div className="space-y-8">
      <PageHeader
        title="Manage Academics"
        description="View, add, or edit student test scores and academic records."
        icon={BookCopy}
        actions={
            <Button onClick={handleDownload} disabled={isLoading || filteredStudents.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Download as Excel
            </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Filter Students</CardTitle>
          <div className="mt-4">
            <Select onValueChange={setSelectedDepartment} defaultValue="all">
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept.value} value={dept.value}>
                    {dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
                  <TableHead>Student Name</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>
                      {DEPARTMENTS.find((d) => d.value === student.department)?.label}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectStudent(student)}
                      >
                        <User className="mr-2 h-4 w-4" /> Manage Academics
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {selectedStudent && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Manage Academics for {selectedStudent.name}</DialogTitle>
                    <DialogDescription>{selectedStudent.studentId} - {DEPARTMENTS.find(d=>d.value === selectedStudent.department)?.label}</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto p-1">
                    {/* View/Edit Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PlusCircle/> {editingTest ? "Edit Test" : "Add New Test"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onTestSubmit)} className="space-y-4">
                                    <FormField control={form.control} name="testName" render={({ field }) => ( <FormItem><FormLabel>Test Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="testDate" render={({ field }) => ( <FormItem><FormLabel>Test Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="maxMarks" render={({ field }) => ( <FormItem><FormLabel>Max Marks</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={form.control} name="marksObtained" render={({ field }) => ( <FormItem><FormLabel>Marks Obtained</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    </div>
                                    <div className="flex gap-2">
                                     <Button type="submit">{editingTest ? "Update Test" : "Add Test"}</Button>
                                     {editingTest && <Button type="button" variant="ghost" onClick={() => handleOpenTestForm(null)}>Cancel Edit</Button>}
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>

                     {/* Existing Tests Table */}
                    <Card>
                        <CardHeader><CardTitle>Recorded Tests</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Test</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedStudent.academics?.tests?.length ? selectedStudent.academics.tests.map(test => (
                                        <TableRow key={test.id}>
                                            <TableCell>
                                                <p className="font-medium">{test.testName}</p>
                                                <p className="text-xs text-muted-foreground">{format(parseISO(test.testDate), "PPP")}</p>
                                            </TableCell>
                                            <TableCell>{test.marksObtained} / {test.maxMarks}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenTestForm(test)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteTest(test.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow><TableCell colSpan={3} className="text-center h-24">No tests recorded.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSaving ? "Saving..." : "Save All Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
