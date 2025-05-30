
"use client"; // Ensure client component for useState, useEffect if filters were active

import React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { GraduationCap, Filter as FilterIcon } from "lucide-react"; // Renamed Filter to FilterIcon to avoid conflict
import { DEPARTMENTS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";


// Mock Data
const mockStudents: { id: string, name: string, email: string, department: string, rollNumber: string, batch: string, status: string }[] = [];

export default function ViewStudentsPage() {
  // Placeholder for filtering logic
  // const [searchTerm, setSearchTerm] = React.useState("");
  // const [selectedDepartment, setSelectedDepartment] = React.useState("");

  // const filteredStudents = mockStudents.filter(student => 
  //   student.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
  //   (selectedDepartment === "" || student.department === selectedDepartment)
  // );

  return (
    <div className="space-y-8">
      <PageHeader
        title="View Students"
        description="Browse and search student records in the FSP portal."
        icon={GraduationCap}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Student Directory</CardTitle>
          <CardDescription>A comprehensive list of all students enrolled in the FSP.</CardDescription>
          <div className="mt-4 flex gap-4">
            <Input placeholder="Search by name or ID..." className="max-w-sm" />
            <Select>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map(dept => (
                  <SelectItem key={dept.value} value={dept.label}>{dept.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline"><FilterIcon className="mr-2 h-4 w-4" /> Apply Filters</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Roll No.</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStudents.map((student) => ( // Replace with filteredStudents when filter logic is live
                <TableRow key={student.id}>
                  <TableCell>{student.id}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.department}</TableCell>
                  <TableCell>{student.rollNumber}</TableCell>
                  <TableCell>{student.batch}</TableCell>
                  <TableCell>
                    <Badge variant={student.status === "Active" ? "default" : "secondary"}>
                      {student.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {mockStudents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: "View Students - AEC FSP Portal",
};
