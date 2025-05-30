
"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Search, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DEPARTMENTS } from "@/lib/constants";

// Mock Data
const mockBatches: { id: string, name: string }[] = [];

const mockStudents: { id: string, name: string, department: string, currentBatch: string | null }[] = [];

export default function AssignStudentsPage() {
  const { toast } = useToast();
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<Record<string, boolean>>({});

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    setSelectedStudents(prev => ({ ...prev, [studentId]: checked }));
  };

  const filteredStudents = mockStudents.filter(student => 
    (student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.id.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedDepartment === "" || student.department === selectedDepartment)
  );
  
  const studentsToDisplay = selectedBatch ? filteredStudents.filter(s => s.currentBatch !== selectedBatch) : filteredStudents;


  const handleAssignStudents = () => {
    const studentsToAssign = Object.entries(selectedStudents)
      .filter(([, isSelected]) => isSelected)
      .map(([studentId]) => studentId);

    if (!selectedBatch) {
      toast({ title: "Error", description: "Please select a batch first.", variant: "destructive" });
      return;
    }
    if (studentsToAssign.length === 0) {
      toast({ title: "Error", description: "Please select students to assign.", variant: "destructive" });
      return;
    }

    console.log(`Assigning students ${studentsToAssign.join(", ")} to batch ${selectedBatch}`);
    toast({
      title: "Assignment Successful (Simulated)",
      description: `${studentsToAssign.length} students assigned to batch ${selectedBatch}.`,
    });
    setSelectedStudents({}); // Reset selection
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Assign Students to Batch"
        description="Search for students and assign them to your FSP batches."
        icon={UserPlus}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Batch Selection & Student Search</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Select onValueChange={setSelectedBatch} value={selectedBatch}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Batch" />
              </SelectTrigger>
              <SelectContent>
                {mockBatches.map(batch => (
                  <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                ))}
                {mockBatches.length === 0 && <p className="p-2 text-sm text-muted-foreground">No batches available.</p>}
              </SelectContent>
            </Select>
            <Input 
              placeholder="Search students by name or ID..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="md:col-span-2"
            />
             <Select onValueChange={setSelectedDepartment} value={selectedDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Department" />
              </SelectTrigger>
              <SelectContent>
                 <SelectItem value="">All Departments</SelectItem>
                {DEPARTMENTS.map(dept => (
                  <SelectItem key={dept.value} value={dept.label}>{dept.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {selectedBatch && mockBatches.find(b=>b.id === selectedBatch) && <p className="mb-4 text-sm font-medium">Assigning to: <span className="text-primary">{mockBatches.find(b=>b.id === selectedBatch)?.name}</span></p>}
          <div className="max-h-[50vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      onCheckedChange={(checked) => {
                        const newSelected: Record<string, boolean> = {};
                        if (checked) {
                          studentsToDisplay.forEach(s => newSelected[s.id] = true);
                        }
                        setSelectedStudents(newSelected);
                      }}
                      checked={studentsToDisplay.length > 0 && studentsToDisplay.every(s => selectedStudents[s.id])}
                      disabled={studentsToDisplay.length === 0}
                    />
                  </TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Current Batch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsToDisplay.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Checkbox 
                        checked={!!selectedStudents[student.id]}
                        onCheckedChange={(checked) => handleSelectStudent(student.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell>{student.id}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.department}</TableCell>
                    <TableCell>{student.currentBatch ? (mockBatches.find(b=>b.id === student.currentBatch)?.name || "Assigned") : "Not Assigned"}</TableCell>
                  </TableRow>
                ))}
                {studentsToDisplay.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                      No students found matching criteria or all eligible students already assigned.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <Button 
            onClick={handleAssignStudents} 
            className="mt-6 w-full md:w-auto" 
            disabled={Object.values(selectedStudents).every(v => !v) || !selectedBatch}
          >
            <Users className="mr-2 h-4 w-4" /> Assign Selected Students
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: "Assign Students - AEC FSP Portal",
};
