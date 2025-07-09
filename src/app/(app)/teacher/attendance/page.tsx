
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckSquare, CalendarIcon, Save, Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Student, Batch, AttendanceRecord, Teacher } from "@/lib/types";
import { DEPARTMENTS, USER_ROLES } from "@/lib/constants";
import * as XLSX from "xlsx";

type AttendanceStatus = "present" | "absent" | "late";

export default function TeacherManageAttendancePage() {
  const { toast } = useToast();
  const [assignedBatches, setAssignedBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedHalf, setSelectedHalf] = useState<'first' | 'second'>('first');
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});
  const [remarksRecords, setRemarksRecords] = useState<Record<string, string>>({});
  
  const selectedBatch = useMemo(() => assignedBatches.find(b => b.id === selectedBatchId), [selectedBatchId, assignedBatches]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingBatches(true);
      let teacherId = null;
      const storedUserJSON = localStorage.getItem("currentUser");
      if (storedUserJSON) {
        const user = JSON.parse(storedUserJSON);
        if (user && user.role === USER_ROLES.TEACHER) {
          teacherId = user.id;
        }
      }

      if (!teacherId) {
        toast({ title: "Error", description: "Could not identify teacher.", variant: "destructive" });
        setIsLoadingBatches(false);
        return;
      }
      
      try {
        const [batchesRes, teachersRes] = await Promise.all([
            fetch('/api/batches'),
            fetch('/api/teachers')
        ]);
        
        if (!batchesRes.ok) throw new Error("Failed to fetch batches");
        const allBatches: Batch[] = await batchesRes.json();
        const teacherBatches = allBatches.filter(b => b.teacherIds?.includes(teacherId!));
        setAssignedBatches(teacherBatches);

        if (teachersRes.ok) {
            setAllTeachers(await teachersRes.json());
        }

      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setIsLoadingBatches(false);
      }
    };
    fetchInitialData();
  }, [toast]);

  // Fetch students and attendance records when batch, date, or half changes
  useEffect(() => {
    if (!selectedBatchId || !selectedDate) {
      setStudents([]);
      setAttendanceRecords({});
      setRemarksRecords({});
      return;
    };

    const fetchDataForBatchAndDate = async () => {
      setIsLoadingStudents(true);
      try {
        const studentsRes = await fetch('/api/students?limit=99999');
        if (!studentsRes.ok) {
            throw new Error(`Failed to fetch student list (${studentsRes.status})`);
        }
        
        const studentsApiResponse = await studentsRes.json();
        const allStudents: Student[] = Array.isArray(studentsApiResponse?.students) ? studentsApiResponse.students : [];

        const studentsInBatch = allStudents.filter(s => s.batchIds?.includes(selectedBatchId));
        setStudents(studentsInBatch);

        const attendanceRes = await fetch(`/api/attendance?batchId=${selectedBatchId}&date=${format(selectedDate, 'yyyy-MM-dd')}&batchHalf=${selectedHalf}`);
        if (!attendanceRes.ok) throw new Error("Failed to fetch attendance records");
        const existingRecords: AttendanceRecord[] = await attendanceRes.json();
        
        const recordsMap: Record<string, AttendanceStatus> = {};
        const remarksMap: Record<string, string> = {};
        existingRecords.forEach(rec => {
          recordsMap[rec.studentId] = rec.status;
          remarksMap[rec.studentId] = rec.remarks || "";
        });
        setAttendanceRecords(recordsMap);
        setRemarksRecords(remarksMap);

      } catch (error: any) {
        toast({ title: "Error", description: `Failed to load data for batch: ${error.message}`, variant: "destructive" });
        setStudents([]);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchDataForBatchAndDate();

  }, [selectedBatchId, selectedDate, selectedHalf, toast]);

  // Reset selected half to first when batch changes
  useEffect(() => {
    setSelectedHalf('first');
  }, [selectedBatchId]);


  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
  };
  
  const handleRemarkChange = (studentId: string, remark: string) => {
    setRemarksRecords(prev => ({ ...prev, [studentId]: remark }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedBatch || !selectedDate) {
      toast({ title: "Error", description: "Please select a batch and date.", variant: "destructive" });
      return;
    }
    if (students.length > 0 && Object.keys(attendanceRecords).length !== students.length) {
       toast({ title: "Incomplete", description: "Please mark attendance for all students.", variant: "destructive" });
      return;
    }
    if (students.length === 0) {
        toast({ title: "No Students", description: "No students in the selected batch to mark attendance for." });
        return;
    }

    setIsSaving(true);
    try {
        const response = await fetch('/api/attendance/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                records: attendanceRecords,
                remarks: remarksRecords,
                batchId: selectedBatch.id,
                date: format(selectedDate, 'yyyy-MM-dd'),
                subject: selectedBatch.topic,
                batchHalf: selectedHalf,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save attendance.');
        }
        
        toast({
          title: "Attendance Saved",
          description: `Attendance for batch ${selectedBatch.name} on ${format(selectedDate, "PPP")} (${selectedHalf} half) has been saved.`,
        });

    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleDownloadExcel = async () => {
    if (!selectedBatch || !selectedDate || students.length === 0) {
      toast({
        title: "No Data to Export",
        description: "Please select a batch and date with student records to download.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Generating Report...", description: "Fetching all attendance data for the month. This may take a moment." });

    try {
      // 1. Define Date Range (current month of selectedDate)
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      // 2. Fetch all attendance for the batch (could be optimized with date range in API)
      const attendanceRes = await fetch(`/api/attendance?batchId=${selectedBatch.id}`);
      if (!attendanceRes.ok) {
        throw new Error("Failed to fetch full attendance data for report.");
      }
      const allRecordsForBatch: AttendanceRecord[] = await attendanceRes.json();
      
      const recordsForMonth = allRecordsForBatch.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate >= startOfMonth && recordDate <= endOfMonth;
      });

      // 3. Process Data
      const uniqueDates = [...new Set(recordsForMonth.map(r => r.date.split('T')[0]))].sort();
      const attendanceMap = new Map<string, Map<string, { M?: string; A?: string; remark?: string }>>();

      recordsForMonth.forEach(record => {
        const studentMap = attendanceMap.get(record.studentId) || new Map();
        const dateStr = record.date.split('T')[0];
        const dateMap = studentMap.get(dateStr) || {};
        const status = record.status.charAt(0).toUpperCase();

        if (record.batchHalf === 'first') dateMap.M = status;
        if (record.batchHalf === 'second') dateMap.A = status;
        
        // Combine remarks from both halves for the day
        if (record.remarks) {
            if (dateMap.remark && !dateMap.remark.includes(record.remarks)) {
                dateMap.remark += `; ${record.remarks}`;
            } else if (!dateMap.remark) {
                 dateMap.remark = record.remarks;
            }
        }
        
        studentMap.set(dateStr, dateMap);
        attendanceMap.set(record.studentId, studentMap);
      });

      // 4. Build Excel Data (Array of Arrays)
      const aoa: (string | number)[][] = [];
      const teacherNames = selectedBatch.teacherIds.map(id => allTeachers.find(t => t.id === id)?.name).filter(Boolean).join(', ');

      aoa.push(['Attendance Sheet']);
      aoa.push([`${selectedBatch.topic} (Room: ${selectedBatch.roomNumber || 'N/A'})`]);
      aoa.push([`Teacher(s): ${teacherNames}`]);
      aoa.push([]);

      const staticHeaders = ['Sl. No.', 'Student Name', 'University Roll No', 'Phone Number', 'Department'];
      const dateHeaders = uniqueDates.map(date => format(new Date(date.replace(/-/g, '/')), 'dd-MM-yyyy'));
      
      const headerRow1 = [...staticHeaders, ...dateHeaders.flatMap(d => [d, '', ''])];
      aoa.push(headerRow1);

      const headerRow2 = [...staticHeaders.map(() => ''), ...uniqueDates.flatMap(() => ['M', 'A', 'Remark'])];
      aoa.push(headerRow2);
      
      students
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((student, index) => {
          const studentAttendance = attendanceMap.get(student.id);
          const studentDept = DEPARTMENTS.find(d => d.value === student.department)?.label
                .split(' ')
                .filter(word => word.match(/^[A-Z&]+$/))
                .join('') || student.department;

          const row: (string|number)[] = [
            index + 1,
            student.name,
            student.registrationNumber || 'N/A',
            student.phoneNumber || 'N/A',
            studentDept,
          ];

          uniqueDates.forEach(date => {
            const attendance = studentAttendance?.get(date);
            row.push(attendance?.M || '-');
            row.push(attendance?.A || '-');
            row.push(attendance?.remark || '');
          });
          aoa.push(row);
        });

      // 5. Create Worksheet and Download
      const worksheet = XLSX.utils.aoa_to_sheet(aoa);

      // Define merges
      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: staticHeaders.length + (uniqueDates.length * 3) - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: staticHeaders.length + (uniqueDates.length * 3) - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: staticHeaders.length + (uniqueDates.length * 3) - 1 } },
      ];
      uniqueDates.forEach((_, i) => {
        const col = staticHeaders.length + (i * 3);
        merges.push({ s: { r: 4, c: col }, e: { r: 4, c: col + 2 } });
      });
      worksheet['!merges'] = merges;
      
      // Auto-fit columns
      const columnWidths = aoa[5].map((_, colIndex) => {
          let maxLength = 0;
          aoa.forEach(row => {
              if (row[colIndex] && String(row[colIndex]).length > maxLength) {
                  maxLength = String(row[colIndex]).length;
              }
          });
          return { wch: maxLength + 2 }; // +2 for padding
      });
      worksheet['!cols'] = columnWidths;


      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');

      const fileName = `Attendance_Report_${selectedBatch.name.replace(/\s/g, '_')}_${format(selectedDate, "MMM_yyyy")}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({ title: "Report Generated", description: `Downloaded ${fileName}` });

    } catch (error: any) {
      toast({ title: "Report Error", description: error.message, variant: "destructive" });
    }
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Manage Student Attendance"
        description="Select a batch you're assigned to and date to mark or update attendance records."
        icon={CheckSquare}
        actions={
          <Button onClick={handleDownloadExcel} disabled={!selectedBatchId || !selectedDate || students.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Download Monthly Report
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 items-end">
            <div className="flex flex-col gap-1.5">
                <Label>Batch</Label>
                <Select onValueChange={setSelectedBatchId} value={selectedBatchId} disabled={isLoadingBatches}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingBatches ? "Loading your batches..." : "Select an Assigned Batch"} />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedBatches.map(batch => (
                      <SelectItem key={batch.id} value={batch.id}>{batch.name} ({DEPARTMENTS.find(d=>d.value === batch.department)?.label})</SelectItem>
                    ))}
                     {assignedBatches.length === 0 && !isLoadingBatches && <p className="p-2 text-sm text-muted-foreground">No batches assigned to you.</p>}
                  </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col gap-1.5">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`w-full justify-start text-left font-normal ${!selectedDate && "text-muted-foreground"}`}
                      disabled={!selectedBatchId}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
            </div>
             {selectedBatch && (
              <div className="flex flex-col gap-1.5">
                <Label>Select Batch Half</Label>
                <RadioGroup value={selectedHalf} onValueChange={(value) => setSelectedHalf(value as 'first' | 'second')} className="flex items-center space-x-4 h-10">
                    <div className="flex items-center space-x-2">
                    <RadioGroupItem value="first" id="r1" />
                    <Label htmlFor="r1">First Half</Label>
                    </div>
                    {selectedBatch.startTimeSecondHalf && selectedBatch.endTimeSecondHalf && (
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="second" id="r2" />
                        <Label htmlFor="r2">Second Half</Label>
                    </div>
                    )}
                </RadioGroup>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingStudents ? (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            </div>
          ) : selectedBatch && selectedDate ? (
            <>
              <p className="mb-4 text-sm font-medium">
                Marking attendance for: <span className="text-primary">{selectedBatch.name}</span> on <span className="text-primary">{format(selectedDate, "PPP")}</span>.
                Topic: <span className="text-primary">{selectedBatch.topic}</span>.
                {selectedHalf === 'first' && <span> Time: <span className="text-primary">{selectedBatch.startTimeFirstHalf} - {selectedBatch.endTimeFirstHalf}</span>.</span>}
                {selectedHalf === 'second' && <span> Time: <span className="text-primary">{selectedBatch.startTimeSecondHalf} - {selectedBatch.endTimeSecondHalf}</span>.</span>}
              </p>
              {students.length > 0 ? (
                <>
                <div className="max-h-[60vh] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.studentId}</TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.section}</TableCell>
                        <TableCell className="text-center">
                          <RadioGroup 
                            onValueChange={(value) => handleAttendanceChange(student.id, value as AttendanceStatus)} 
                            value={attendanceRecords[student.id]}
                            className="flex justify-center gap-2 md:gap-4"
                          >
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="present" id={`${student.id}-present`} />
                              <Label htmlFor={`${student.id}-present`} className="text-green-600 cursor-pointer">Present</Label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="absent" id={`${student.id}-absent`} />
                              <Label htmlFor={`${student.id}-absent`} className="text-red-600 cursor-pointer">Absent</Label>
                            </div>
                            <div className="flex items-center space-x-1">
                              <RadioGroupItem value="late" id={`${student.id}-late`} />
                              <Label htmlFor={`${student.id}-late`} className="text-yellow-600 cursor-pointer">Late</Label>
                            </div>
                          </RadioGroup>
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Add a remark..."
                            value={remarksRecords[student.id] || ""}
                            onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                            className="w-48"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                <Button onClick={handleSaveAttendance} disabled={isSaving} className="mt-6 w-full md:w-auto">
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSaving ? 'Saving...' : 'Save Attendance'}
                </Button>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-4">No students found in the selected batch, or students have not yet been assigned.</p>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground py-4">Please select one of your assigned batches and a date to mark attendance.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
