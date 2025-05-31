
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
import { CheckSquare, CalendarIcon, Save, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { batches as allBatches, students as allStudents, attendanceRecords as mockAttendanceRecords } from "@/lib/mockData";
import type { Student, Batch, AttendanceRecord } from "@/lib/types";
import { DEPARTMENTS } from "@/lib/constants";

type AttendanceStatus = "present" | "absent" | "late";

export default function AdminManageAttendancePage() {
  const { toast } = useToast();
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});

  const selectedBatch = useMemo(() => allBatches.find(b => b.id === selectedBatchId), [selectedBatchId]);

  const studentsInSelectedBatch = useMemo(() => {
    if (!selectedBatch) return [];
    return allStudents.filter(student => selectedBatch.studentIds.includes(student.id));
  }, [selectedBatch]);

  // Load existing records or initialize when batch/date changes
  useEffect(() => {
    const newRecords: Record<string, AttendanceStatus> = {};
    if (selectedBatch && selectedDate) {
      studentsInSelectedBatch.forEach(student => {
        const existingRecord = mockAttendanceRecords.find(
          r => r.batchId === selectedBatch.id &&
               r.studentId === student.id &&
               format(new Date(r.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
        );
        if (existingRecord) {
          newRecords[student.id] = existingRecord.status;
        } else {
          // newRecords[student.id] = "present"; // Default to present or leave blank
        }
      });
    }
    setAttendanceRecords(newRecords);
  }, [selectedBatch, selectedDate, studentsInSelectedBatch]);


  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = () => {
    if (!selectedBatch || !selectedDate) {
      toast({ title: "Error", description: "Please select a batch and date.", variant: "destructive" });
      return;
    }
    if (studentsInSelectedBatch.length > 0 && Object.keys(attendanceRecords).length !== studentsInSelectedBatch.length) {
       toast({ title: "Incomplete", description: "Please mark attendance for all students.", variant: "destructive" });
      return;
    }
    if (studentsInSelectedBatch.length === 0 && Object.keys(attendanceRecords).length > 0) {
        toast({ title: "No Students", description: "No students to mark attendance for in this batch.", variant: "destructive" });
        return;
    }
    if (studentsInSelectedBatch.length === 0 && Object.keys(attendanceRecords).length === 0) {
        toast({ title: "No Students", description: "No students in the selected batch to mark attendance for." });
        return;
    }
    
    // Update or add records in mockAttendanceRecords
    studentsInSelectedBatch.forEach(student => {
        const studentStatus = attendanceRecords[student.id];
        if (studentStatus) { // Only save if a status is set
            const recordIndex = mockAttendanceRecords.findIndex(
                r => r.batchId === selectedBatch.id &&
                     r.studentId === student.id &&
                     format(new Date(r.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
            );

            if (recordIndex !== -1) {
                mockAttendanceRecords[recordIndex].status = studentStatus;
            } else {
                mockAttendanceRecords.push({
                    id: `ATTREC_${Date.now()}_${student.id}`,
                    studentId: student.id,
                    batchId: selectedBatch.id,
                    date: selectedDate.toISOString(),
                    status: studentStatus,
                    subject: selectedBatch.topic, // Or a more specific subject if available
                });
            }
        }
    });

    toast({
      title: "Attendance Saved",
      description: `Attendance for batch ${selectedBatch.name} on ${format(selectedDate, "PPP")} has been saved.`,
    });
  };
  

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manage Student Attendance"
        description="Select a batch and date to mark or update student attendance records."
        icon={CheckSquare}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-end">
            <Select onValueChange={setSelectedBatchId} value={selectedBatchId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Batch" />
              </SelectTrigger>
              <SelectContent>
                {allBatches.map(batch => (
                  <SelectItem key={batch.id} value={batch.id}>{batch.name} ({DEPARTMENTS.find(d=>d.value === batch.department)?.label})</SelectItem>
                ))}
                 {allBatches.length === 0 && <p className="p-2 text-sm text-muted-foreground">No batches available.</p>}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full md:w-[280px] justify-start text-left font-normal ${!selectedDate && "text-muted-foreground"}`}
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
        </CardHeader>
        <CardContent>
          {selectedBatch && selectedDate && (
            <>
              <p className="mb-4 text-sm font-medium">
                Marking attendance for: <span className="text-primary">{selectedBatch.name}</span> on <span className="text-primary">{format(selectedDate, "PPP")}</span>.
                Topic: <span className="text-primary">{selectedBatch.topic}</span>.
              </p>
              {studentsInSelectedBatch.length > 0 ? (
                <>
                <div className="max-h-[60vh] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsInSelectedBatch.map((student) => (
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                <Button onClick={handleSaveAttendance} className="mt-6 w-full md:w-auto">
                  <Save className="mr-2 h-4 w-4" /> Save Attendance
                </Button>
                </>
              ) : (
                <p className="text-center text-muted-foreground py-4">No students found in the selected batch, or students have not yet been assigned.</p>
              )}
            </>
          )}
          {(!selectedBatch || !selectedDate) && (
            <p className="text-center text-muted-foreground py-4">Please select a batch and a date to mark attendance.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
