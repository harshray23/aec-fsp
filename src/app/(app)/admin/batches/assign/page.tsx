
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Search, Users, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DEPARTMENTS, SECTION_OPTIONS } from "@/lib/constants";
import { batches as mockBatches, students as mockStudents, teachers as mockTeachers } from "@/lib/mockData";
import type { Student, Batch } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminAssignStudentsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const batchIdFromQuery = searchParams.get("batchId");

  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>("all");
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>("all");
  const [selectedStudents, setSelectedStudents] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (batchIdFromQuery && mockBatches.find(b => b.id === batchIdFromQuery)) {
      setSelectedBatchId(batchIdFromQuery);
    }
  }, [batchIdFromQuery]);

  const selectedBatch = useMemo(() => mockBatches.find(b => b.id === selectedBatchId), [selectedBatchId]);

  useEffect(() => {
    // Reset filters and selections when batch changes
    setSelectedStudents({});
    setSearchTerm("");
    // If a batch is selected, its department should dictate the student pool
    if (selectedBatch) {
      setSelectedDepartmentFilter(selectedBatch.department);
      setSelectedSectionFilter("all"); // Reset section filter when batch changes
    } else if (!batchIdFromQuery) { // Only reset if not coming from a direct link
      setSelectedDepartmentFilter("all");
      setSelectedSectionFilter("all");
    }
  }, [selectedBatch, batchIdFromQuery]); // Added batchIdFromQuery to dependencies

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    setSelectedStudents(prev => ({ ...prev, [studentId]: checked }));
  };

  const studentsAvailableForAssignment = useMemo(() => {
    if (!selectedBatch) { // If no batch is selected, show no students for assignment
      return [];
    }
    return mockStudents.filter(student =>
      student.department === selectedBatch.department && // Filter by selected batch's department
      (selectedSectionFilter === "all" || student.section === selectedSectionFilter) && // Filter by selected section
      (student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, selectedSectionFilter, selectedBatch]);


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
        // Check if student is already in the target batch
        if (mockStudents[studentIndex].batchId === selectedBatchId) {
          // Already in this batch, skip
          return;
        }

        // If student is in another batch, unassign from old batch
        if (mockStudents[studentIndex].batchId) {
            const oldBatchIndex = mockBatches.findIndex(b => b.id === mockStudents[studentIndex].batchId);
            if (oldBatchIndex !== -1) {
                mockBatches[oldBatchIndex].studentIds = mockBatches[oldBatchIndex].studentIds.filter(id => id !== studentId);
            }
        }
        
        // Assign to new batch
        mockStudents[studentIndex].batchId = selectedBatchId;
        if (!mockBatches[batchIndex].studentIds.includes(studentId)) {
             mockBatches[batchIndex].studentIds.push(studentId);
        }
        assignedCount++;
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
            description: "Selected students may have already been in the batch or no new valid students were selected.",
            variant: "default"
        });
    }
    setSelectedStudents({}); // Clear selection after assignment
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
    if (batchIndex === -1) {
        toast({ title: "Error", description: "Selected batch not found.", variant: "destructive" });
        return;
    }

    let unassignedCount = 0;
    studentIdsToUnassign.forEach(studentId => {
        const studentIndex = mockStudents.findIndex(s => s.id === studentId && s.batchId === selectedBatchId);
        if (studentIndex !== -1) {
            mockStudents[studentIndex].batchId = undefined; // Clear batch assignment for student
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
            description: "Selected students were not in this batch or no valid students were selected.",
        });
    }
    setSelectedStudents({}); // Clear selection after unassignment
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Assign Students to Batch (Admin)"
        description="Manage student enrollments for FSP batches. Select a batch to see eligible students from its department."
        icon={UserPlus}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Student Assignment</CardTitle>
          <CardDescription>
            Select a batch to view students from its department. You can then filter by section and search.
          </CardDescription>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
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
              disabled={!selectedBatchId}
            />
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
                    {selectedSectionFilter !== 'all' && ` Section: <span className="font-semibold text-primary">${selectedSectionFilter}</span>.`}
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
                      disabled={studentsAvailableForAssignment.length === 0 || !selectedBatchId}
                      aria-label="Select all students in current view"
                    />
                  </TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Section</TableHead>
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
                        aria-labelledby={`student-name-${student.id}`}
                      />
                    </TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell id={`student-name-${student.id}`} className="font-medium">{student.name}</TableCell>
                    <TableCell>{DEPARTMENTS.find(d => d.value === student.department)?.label || student.department}</TableCell>
                    <TableCell>{student.section || "N/A"}</TableCell>
                    <TableCell>
                        {student.batchId 
                            ? (student.batchId === selectedBatchId 
                                ? <span className="text-primary font-semibold">{mockBatches.find(b=>b.id === student.batchId)?.name} (Current)</span>
                                : mockBatches.find(b=>b.id === student.batchId)?.name || "Assigned Elsewhere"
                              ) 
                            : <span className="text-muted-foreground">Not Assigned</span>
                        }
                    </TableCell>
                  </TableRow>
                ))}
                {studentsAvailableForAssignment.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                      {!selectedBatchId ? "Select a batch to see eligible students." : "No eligible students found for this batch's department/section or matching search/filter."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
                onClick={handleAssignStudents}
                disabled={Object.values(selectedStudents).filter(Boolean).length === 0 || !selectedBatchId}
            >
                <UserPlus className="mr-2 h-4 w-4" /> Assign Selected to Batch
            </Button>
            <Button
                onClick={handleUnassignStudents}
                variant="outline"
                disabled={Object.values(selectedStudents).filter(Boolean).length === 0 || !selectedBatchId}
            >
                <UserMinus className="mr-2 h-4 w-4" /> Unassign Selected from Batch
            </Button>
          </div>
           <p className="mt-4 text-xs text-muted-foreground">
            Students already in the selected batch will not be re-assigned. Assigning a student to this batch will remove them from any other batch they might currently be in.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
