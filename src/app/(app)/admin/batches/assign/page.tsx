
"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Search, Users, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DEPARTMENTS, SECTION_OPTIONS } from "@/lib/constants"; // Added SECTION_OPTIONS
import { batches as mockBatches, students as mockStudents, teachers as mockTeachers } from "@/lib/mockData";
import type { Student, Batch } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminAssignStudentsPage() {
  const { toast } = useToast();
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>("all");
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>("all"); // New state for section filter
  const [selectedStudents, setSelectedStudents] = useState<Record<string, boolean>>({});

  const selectedBatch = useMemo(() => mockBatches.find(b => b.id === selectedBatchId), [selectedBatchId]);

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    setSelectedStudents(prev => ({ ...prev, [studentId]: checked }));
  };

  const studentsAvailableForAssignment = useMemo(() => {
    return mockStudents.filter(student =>
      (selectedDepartmentFilter === "all" || student.department === selectedDepartmentFilter) &&
      (student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.studentId.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!selectedBatch || student.department === selectedBatch.department) && // Only show students from batch's department
      (selectedSectionFilter === "all" || student.section === selectedSectionFilter) // Added section filter
    );
  }, [searchTerm, selectedDepartmentFilter, selectedSectionFilter, selectedBatch]);


  const handleAssignStudents = () => {
    const studentIdsToAssign = Object.entries(selectedStudents)
      .filter(([, isSelected]) => isSelected)
      .map(([studentId]) => studentId);

    if (!selectedBatchId) {
      toast({ title: "Error", description: "Please select a batch first.", variant: "destructive" });
      return;
    }
    if (studentIdsToAssign.length === 0) {
      toast({ title: "No Students Selected", description: "Please select students to assign.", variant: "destructive" });
      return;
    }

    const batchIndex = mockBatches.findIndex(b => b.id === selectedBatchId);
    if (batchIndex === -1) {
        toast({ title: "Error", description: "Selected batch not found.", variant: "destructive" });
        return;
    }

    let assignedCount = 0;
    studentIdsToAssign.forEach(studentId => {
      const studentIndex = mockStudents.findIndex(s => s.id === studentId);
      if (studentIndex !== -1) {
        if (mockStudents[studentIndex].batchId !== selectedBatchId) {
            if (mockStudents[studentIndex].batchId) {
                const oldBatchIndex = mockBatches.findIndex(b => b.id === mockStudents[studentIndex].batchId);
                if (oldBatchIndex !== -1) {
                    mockBatches[oldBatchIndex].studentIds = mockBatches[oldBatchIndex].studentIds.filter(id => id !== studentId);
                }
            }
            mockStudents[studentIndex].batchId = selectedBatchId;
            if (!mockBatches[batchIndex].studentIds.includes(studentId)) {
                 mockBatches[batchIndex].studentIds.push(studentId);
            }
            assignedCount++;
        }
      }
    });

    if (assignedCount > 0) {
        toast({
        title: "Assignment Successful",
        description: `${assignedCount} students assigned to batch ${selectedBatch?.name}.`,
        });
    } else {
        toast({
            title: "No Changes",
            description: "Selected students were already in the batch or no new students were assigned.",
            variant: "default"
        });
    }
    setSelectedStudents({});
  };

  const handleUnassignStudents = () => {
    const studentIdsToUnassign = Object.entries(selectedStudents)
      .filter(([, isSelected]) => isSelected)
      .map(([studentId]) => studentId);

    if (!selectedBatchId) {
      toast({ title: "Error", description: "Please select a batch first.", variant: "destructive" });
      return;
    }
    if (studentIdsToUnassign.length === 0) {
      toast({ title: "No Students Selected", description: "Please select students to unassign.", variant: "destructive" });
      return;
    }

    const batchIndex = mockBatches.findIndex(b => b.id === selectedBatchId);
    if (batchIndex === -1) return;

    let unassignedCount = 0;
    studentIdsToUnassign.forEach(studentId => {
        const studentIndex = mockStudents.findIndex(s => s.id === studentId && s.batchId === selectedBatchId);
        if (studentIndex !== -1) {
            mockStudents[studentIndex].batchId = undefined;
            mockBatches[batchIndex].studentIds = mockBatches[batchIndex].studentIds.filter(id => id !== studentId);
            unassignedCount++;
        }
    });

    if (unassignedCount > 0) {
        toast({
            title: "Unassignment Successful",
            description: `${unassignedCount} students removed from batch ${selectedBatch?.name}.`,
        });
    } else {
         toast({
            title: "No Changes",
            description: "Selected students were not in this batch.",
        });
    }
    setSelectedStudents({});
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Assign Students to Batch (Admin)"
        description="Manage student enrollments for FSP batches."
        icon={UserPlus}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Student Assignment</CardTitle>
          <CardDescription>Select a batch, then filter and select students to assign or unassign. Students must match the batch's department.</CardDescription>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <Select onValueChange={setSelectedBatchId} value={selectedBatchId}>
              <SelectTrigger className="lg:col-span-1">
                <SelectValue placeholder="Select a Batch" />
              </SelectTrigger>
              <SelectContent>
                {mockBatches.map(batch => (
                  <SelectItem key={batch.id} value={batch.id}>{batch.name} ({DEPARTMENTS.find(d=>d.value === batch.department)?.label})</SelectItem>
                ))}
                {mockBatches.length === 0 && <p className="p-2 text-sm text-muted-foreground">No batches available.</p>}
              </SelectContent>
            </Select>
            <Input
              placeholder="Search students by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="lg:col-span-1"
            />
            <Select onValueChange={setSelectedDepartmentFilter} value={selectedDepartmentFilter} disabled={!!selectedBatchId}>
              <SelectTrigger className="lg:col-span-1">
                <SelectValue placeholder="Filter by Department" />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="all">All Departments (Students)</SelectItem>
                {DEPARTMENTS.map(dept => (
                  <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={setSelectedSectionFilter} value={selectedSectionFilter} disabled={!selectedBatchId}>
                <SelectTrigger className="lg:col-span-1">
                    <SelectValue placeholder="Filter by Section" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {SECTION_OPTIONS.map(sec => (
                        <SelectItem key={sec.value} value={sec.value}>{sec.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
            {selectedBatch && (
                <p className="mt-2 text-sm text-muted-foreground">
                    Selected Batch Department: <span className="font-semibold text-primary">{DEPARTMENTS.find(d=>d.value === selectedBatch.department)?.label || selectedBatch.department}</span>.
                    Only students from this department (and matching section filter) will be shown.
                </p>
            )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[45vh] w-full rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      onCheckedChange={(checked) => {
                        const newSelected: Record<string, boolean> = {};
                        if (checked === true) {
                          studentsAvailableForAssignment.forEach(s => newSelected[s.id] = true);
                        }
                        setSelectedStudents(newSelected);
                      }}
                      checked={studentsAvailableForAssignment.length > 0 && studentsAvailableForAssignment.every(s => selectedStudents[s.id])}
                      disabled={studentsAvailableForAssignment.length === 0}
                    />
                  </TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Section</TableHead> {/* New Table Head */}
                  <TableHead>Current Batch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsAvailableForAssignment.map((student) => (
                  <TableRow key={student.id} data-state={selectedStudents[student.id] ? "selected" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={!!selectedStudents[student.id]}
                        onCheckedChange={(checked) => handleSelectStudent(student.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{DEPARTMENTS.find(d => d.value === student.department)?.label || student.department}</TableCell>
                    <TableCell>{student.section}</TableCell> {/* New Table Cell */}
                    <TableCell>{student.batchId ? (mockBatches.find(b=>b.id === student.batchId)?.name || "Assigned") : <span className="text-muted-foreground">Not Assigned</span>}</TableCell>
                  </TableRow>
                ))}
                {studentsAvailableForAssignment.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24"> {/* Updated colSpan */}
                      {selectedBatch ? "No eligible students found for this batch's department/section or matching search/filter." : "Select a batch to see eligible students."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
                onClick={handleAssignStudents}
                disabled={Object.values(selectedStudents).every(v => !v) || !selectedBatchId}
            >
                <UserPlus className="mr-2 h-4 w-4" /> Assign Selected
            </Button>
            <Button
                onClick={handleUnassignStudents}
                variant="outline"
                disabled={Object.values(selectedStudents).every(v => !v) || !selectedBatchId}
            >
                <UserMinus className="mr-2 h-4 w-4" /> Unassign Selected from Batch
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
