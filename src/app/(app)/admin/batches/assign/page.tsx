
"use client";

import React, { useState, useMemo, useEffect, ChangeEvent, DragEvent } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Search, Users, UserMinus, UploadCloud, FileText, Hash } from "lucide-react"; // Added Hash for Roll Number
import { useToast } from "@/hooks/use-toast";
import { DEPARTMENTS } from "@/lib/constants";
import { batches as mockBatches, students as mockStudents, teachers as mockTeachers } from "@/lib/mockData";
import type { Student, Batch } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as XLSX from 'xlsx';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminAssignStudentsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const batchIdFromQuery = searchParams.get("batchId");

  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  // const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>("all"); // Section filter removed
  const [selectedStudents, setSelectedStudents] = useState<Record<string, boolean>>({});

  // Excel upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelStudentIdentifiers, setExcelStudentIdentifiers] = useState<string[]>([]);
  const [excelProcessingMessage, setExcelProcessingMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);


  useEffect(() => {
    if (batchIdFromQuery && mockBatches.find(b => b.id === batchIdFromQuery)) {
      setSelectedBatchId(batchIdFromQuery);
    }
  }, [batchIdFromQuery]);

  const selectedBatch = useMemo(() => mockBatches.find(b => b.id === selectedBatchId), [selectedBatchId]);

  useEffect(() => {
    setSelectedStudents({});
    setSearchTerm("");
    setSelectedFile(null);
    setExcelStudentIdentifiers([]);
    setExcelProcessingMessage(null);
    // if (selectedBatch) { // Logic related to section filter removed
    //   setSelectedSectionFilter("all"); 
    // } else if (!batchIdFromQuery) {
    //   setSelectedSectionFilter("all");
    // }
  }, [selectedBatch, batchIdFromQuery]);

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    setSelectedStudents(prev => ({ ...prev, [studentId]: checked }));
  };

  const studentsAvailableForAssignment = useMemo(() => {
    if (!selectedBatch) { 
      return [];
    }
    return mockStudents.filter(student =>
      student.department === selectedBatch.department && 
      // (selectedSectionFilter === "all" || student.section === selectedSectionFilter) && // Section filter logic removed
      (student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
       student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, selectedBatch]); // selectedSectionFilter removed from dependencies


  const assignStudentLogic = (studentId: string, targetBatchId: string): boolean => {
    const studentIndex = mockStudents.findIndex(s => s.id === studentId);
    if (studentIndex === -1) return false; 

    if (mockStudents[studentIndex].batchId === targetBatchId) {
      return false; 
    }

    if (mockStudents[studentIndex].batchId) {
        const oldBatchIndex = mockBatches.findIndex(b => b.id === mockStudents[studentIndex].batchId);
        if (oldBatchIndex !== -1) {
            mockBatches[oldBatchIndex].studentIds = mockBatches[oldBatchIndex].studentIds.filter(id => id !== studentId);
        }
    }
    
    mockStudents[studentIndex].batchId = targetBatchId;
    const targetBatchIndex = mockBatches.findIndex(b => b.id === targetBatchId);
    if (targetBatchIndex !== -1 && !mockBatches[targetBatchIndex].studentIds.includes(studentId)) {
         mockBatches[targetBatchIndex].studentIds.push(studentId);
    }
    return true; 
  };

  const handleAssignStudents = (studentIdsToProcess: string[], source: 'manual' | 'excel') => {
    if (!selectedBatchId) {
      toast({ title: "Error", description: "Please select a batch first.", variant: "destructive" });
      return;
    }
    if (studentIdsToProcess.length === 0) {
      toast({ title: "No Students", description: `No students selected or found in Excel to assign.`, variant: "destructive" });
      return;
    }

    const batchIndex = mockBatches.findIndex(b => b.id === selectedBatchId);
    if (batchIndex === -1) {
        toast({ title: "Error", description: "Selected batch not found.", variant: "destructive" });
        return;
    }

    let assignedCount = 0;
    let alreadyInBatchCount = 0;
    let notFoundCount = 0;
    const notFoundIds: string[] = [];

    studentIdsToProcess.forEach(studentIdOrIdentifier => {
      const student = mockStudents.find(s => s.id === studentIdOrIdentifier || s.studentId === studentIdOrIdentifier);

      if (!student) {
        notFoundCount++;
        notFoundIds.push(studentIdOrIdentifier);
        return;
      }
      
      if (assignStudentLogic(student.id, selectedBatchId)) {
        assignedCount++;
      } else if (student.batchId === selectedBatchId) {
        alreadyInBatchCount++;
      }
    });
    
    let summaryMessage = "";
    if (assignedCount > 0) {
        summaryMessage += `${assignedCount} students newly assigned to batch ${selectedBatch?.name}. `;
    }
    if (alreadyInBatchCount > 0) {
        summaryMessage += `${alreadyInBatchCount} students were already in this batch. `;
    }
    if (notFoundCount > 0) {
        summaryMessage += `${notFoundCount} student IDs from Excel were not found: ${notFoundIds.slice(0,5).join(', ')}${notFoundIds.length > 5 ? '...' : ''}. `;
    }

    if (assignedCount > 0) {
        toast({
            title: "Assignment Complete",
            description: summaryMessage.trim(),
        });
    } else if (summaryMessage) { 
         toast({
            title: "Assignment Information",
            description: summaryMessage.trim(),
        });
    } else {
         toast({
            title: "No Changes",
            description: "No new assignments were made.",
        });
    }

    if (source === 'manual') setSelectedStudents({});
    if (source === 'excel') {
      setExcelStudentIdentifiers([]);
      setSelectedFile(null);
      setExcelProcessingMessage(null);
    }
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
            description: "Selected students were not in this batch or no valid students were selected.",
        });
    }
    setSelectedStudents({});
  };

  // --- Excel Upload Handlers ---
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      processFile(event.target.files[0]);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      processFile(event.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!selectedBatchId) {
      toast({ title: "Select Batch First", description: "Please select a batch before uploading an Excel file.", variant: "destructive" });
      return;
    }
    if (file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" && file.type !== "application/vnd.ms-excel") {
      toast({ title: "Invalid File Type", description: "Please upload a .xlsx or .xls file.", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setExcelProcessingMessage("Processing file...");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result;
        if (!arrayBuffer) throw new Error("Could not read file data.");
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        let studentIdColumnIndex = 0; 
        if (jsonData.length > 0) {
            const headerRow = jsonData[0];
            const foundIndex = headerRow.findIndex(cell => typeof cell === 'string' && cell.trim().toLowerCase() === 'student id');
            if (foundIndex !== -1) {
                studentIdColumnIndex = foundIndex;
            }
        }

        const idsFromFile = jsonData
          .slice(1) 
          .map(row => row[studentIdColumnIndex]?.toString().trim())
          .filter(id => id); 

        if (idsFromFile.length === 0) {
          setExcelProcessingMessage("No student IDs found in the Excel file or the 'Student ID' column is missing/empty.");
          setExcelStudentIdentifiers([]);
          return;
        }

        const validStudentsInFile = idsFromFile.filter(id => mockStudents.some(s => s.studentId === id && s.department === selectedBatch?.department));
        const notFoundInSystemOrDept = idsFromFile.filter(id => !mockStudents.some(s => s.studentId === id && s.department === selectedBatch?.department));
        
        setExcelStudentIdentifiers(validStudentsInFile);

        let message = `${validStudentsInFile.length} valid student(s) found in Excel from the batch's department. `;
        if (notFoundInSystemOrDept.length > 0) {
          message += `${notFoundInSystemOrDept.length} IDs were not found in the system for this department or were invalid.`;
        }
        setExcelProcessingMessage(message);

      } catch (error) {
        console.error("Error processing Excel file:", error);
        setExcelProcessingMessage("Error processing Excel file. Make sure it's a valid .xlsx or .xls file and the format is correct.");
        toast({ title: "Excel Processing Error", description: (error as Error).message, variant: "destructive" });
        setExcelStudentIdentifiers([]);
      }
    };
    reader.onerror = () => {
        setExcelProcessingMessage("Failed to read the file.");
        toast({title: "File Read Error", description: "Could not read the selected file.", variant: "destructive"});
        setExcelStudentIdentifiers([]);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Assign Students to Batch (Admin)"
        description="Manage student enrollments. Select a batch, then assign students manually or via Excel upload."
        icon={UserPlus}
      />
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Manual Student Assignment</CardTitle>
          <CardDescription>
            Select a batch to view students from its department. You can then search by Student ID, Name, or Roll Number.
          </CardDescription>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Select onValueChange={setSelectedBatchId} value={selectedBatchId}>
              <SelectTrigger>
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
              placeholder="Search by ID, name, or roll no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!selectedBatchId}
            />
            {/* Section filter select component removed */}
          </div>
            {selectedBatch && (
                <p className="mt-2 text-sm text-muted-foreground">
                    Selected Batch Department: <span className="font-semibold text-primary">{DEPARTMENTS.find(d=>d.value === selectedBatch.department)?.label || selectedBatch.department}</span>.
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
                  <TableHead>Roll No.</TableHead>
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
                    <TableCell>{student.rollNumber}</TableCell>
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
                    <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                      {!selectedBatchId ? "Select a batch to see eligible students." : "No eligible students found for this batch's department or matching search."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
                onClick={() => handleAssignStudents(Object.entries(selectedStudents).filter(([,isSelected])=>isSelected).map(([id])=>id), 'manual')}
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
            Assigning a student to this batch will remove them from any other batch they might currently be in.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Bulk Assign via Excel</CardTitle>
          <CardDescription>Upload an Excel file (.xlsx, .xls) with student IDs to assign them to the selected batch.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div 
            className={`p-6 border-2 border-dashed rounded-md text-center cursor-pointer
                        ${isDragging ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/50"}
                        ${!selectedBatchId ? "opacity-50 cursor-not-allowed" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => { if (selectedBatchId) document.getElementById('excel-upload-input')?.click()}}
          >
            <input
              type="file"
              id="excel-upload-input"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
              disabled={!selectedBatchId}
            />
            <UploadCloud className={`mx-auto h-12 w-12 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
            <p className="mt-2 text-sm text-muted-foreground">
              {isDragging ? "Drop the file here" : "Drag & drop your Excel file here, or click to select."}
            </p>
            {!selectedBatchId && <p className="text-xs text-destructive mt-1">Please select a batch above before uploading.</p>}
          </div>

          {selectedFile && (
            <Alert variant="default">
              <FileText className="h-4 w-4" />
              <AlertTitle>File Selected: {selectedFile.name}</AlertTitle>
              <AlertDescription>{excelProcessingMessage || "Ready to process."}</AlertDescription>
            </Alert>
          )}

          {excelStudentIdentifiers.length > 0 && excelProcessingMessage && (
             <Alert variant="default">
                <Users className="h-4 w-4" />
                <AlertTitle>Processing Result</AlertTitle>
                <AlertDescription>{excelProcessingMessage}</AlertDescription>
             </Alert>
          )}
          
          <Button
            onClick={() => handleAssignStudents(excelStudentIdentifiers, 'excel')}
            disabled={excelStudentIdentifiers.length === 0 || !selectedBatchId || !selectedFile}
            className="w-full md:w-auto"
          >
            <UserPlus className="mr-2 h-4 w-4" /> Assign from Excel
          </Button>
           <p className="mt-2 text-xs text-muted-foreground">
            The system primarily uses the "Student ID" column for matching. Ensure this column is present and correct in your Excel file.
            Including "Name" and "Roll Number" columns is good for your reference. Only students matching the selected batch's department will be considered.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}

