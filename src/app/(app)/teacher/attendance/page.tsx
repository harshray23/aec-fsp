"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ClipboardList, CalendarIcon, Users, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Mock Data
const mockTeacherBatches = [
  { id: "B001", name: "FSP Batch Alpha - CSE 2024", subject: "Advanced Java" },
  { id: "B005", name: "Web Development Workshop", subject: "React & Next.js" },
];

const mockStudentsByBatch: Record<string, { id: string, name: string }[]> = {
  "B001": [
    { id: "S001", name: "Aarav Sharma" }, { id: "S002", name: "Diya Patel" }, { id: "S005", name: "Vikram Singh" },
  ],
  "B005": [
    { id: "S006", name: "Neha Gupta" }, { id: "S007", name: "Karan Malhotra" },
  ],
};

type AttendanceStatus = "present" | "absent" | "late";

export default function ManageAttendancePage() {
  const { toast } = useToast();
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});
  
  const studentsInBatch = selectedBatch ? mockStudentsByBatch[selectedBatch] || [] : [];

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = () => {
    if (!selectedBatch || !selectedDate) {
      toast({ title: "Error", description: "Please select a batch and date.", variant: "destructive" });
      return;
    }
    if (Object.keys(attendanceRecords).length !== studentsInBatch.length) {
       toast({ title: "Incomplete", description: "Please mark attendance for all students.", variant: "destructive" });
      return;
    }

    console.log("Saving attendance:", { batch: selectedBatch, date: selectedDate, records: attendanceRecords });
    toast({
      title: "Attendance Saved (Simulated)",
      description: `Attendance for ${mockTeacherBatches.find(b=>b.id === selectedBatch)?.name} on ${format(selectedDate, "PPP")} has been saved.`,
    });
    // Potentially reset or fetch new records after saving
  };
  
  // Reset attendance records when batch or date changes
  React.useEffect(() => {
    setAttendanceRecords({});
  }, [selectedBatch, selectedDate]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manage Attendance"
        description="Mark and view student attendance for your batches."
        icon={ClipboardList}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-end">
            <Select onValueChange={setSelectedBatch} value={selectedBatch}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Batch" />
              </SelectTrigger>
              <SelectContent>
                {mockTeacherBatches.map(batch => (
                  <SelectItem key={batch.id} value={batch.id}>{batch.name} ({batch.subject})</SelectItem>
                ))}
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
          {selectedBatch && selectedDate && studentsInBatch.length > 0 && (
            <>
              <p className="mb-4 text-sm font-medium">
                Marking attendance for: <span className="text-primary">{mockTeacherBatches.find(b=>b.id === selectedBatch)?.name}</span> on <span className="text-primary">{format(selectedDate, "PPP")}</span>.
              </p>
              <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsInBatch.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.id}</TableCell>
                      <TableCell className="font-medium">{student.name}</TableCell>
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
          )}
          {(!selectedBatch || !selectedDate) && (
            <p className="text-center text-muted-foreground py-4">Please select a batch and a date to mark attendance.</p>
          )}
          {selectedBatch && selectedDate && studentsInBatch.length === 0 && (
             <p className="text-center text-muted-foreground py-4">No students found in the selected batch.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: "Manage Attendance - AEC FSP Portal",
};
