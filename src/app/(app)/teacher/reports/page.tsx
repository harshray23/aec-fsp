"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Download, Filter } from "lucide-react";
import { DEPARTMENTS } from "@/lib/constants";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';

// Mock Data
const mockBatchesForReport = [
  { id: "B001", name: "FSP Batch Alpha - CSE 2024", department: "Computer Science & Engineering" },
  { id: "B002", name: "FSP Batch Beta - IT 2024", department: "Information Technology" },
  { id: "B005", name: "Web Development Workshop", department: "Computer Science & Engineering" },
];

const mockAttendanceData = [ // Batch-wise overall
  { batchId: "B001", batchName: "Batch Alpha", present: 85, absent: 10, late: 5, total: 100 },
  { batchId: "B002", batchName: "Batch Beta", present: 92, absent: 5, late: 3, total: 100 },
  { batchId: "B005", batchName: "Web Dev W...", present: 70, absent: 25, late: 5, total: 100 },
];

const mockPerformanceData = [ // Department-wise average scores (example)
    { department: "CSE", avgScore: 82 },
    { department: "IT", avgScore: 78 },
    { department: "ECE", avgScore: 85 },
    { department: "ME", avgScore: 75 },
];


export default function ViewReportsPage() {
  const [reportType, setReportType] = useState<string>("attendance-batch");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");

  const chartData = useMemo(() => {
    if (reportType === "attendance-batch") {
      return mockAttendanceData.map(d => ({ name: d.batchName, Present: d.present, Absent: d.absent, Late: d.late }));
    }
    if (reportType === "performance-department") {
      return mockPerformanceData.map(d => ({ name: d.department, "Avg. Score": d.avgScore }));
    }
    return [];
  }, [reportType]);

  const handleDownloadReport = () => {
    alert("Simulating report download..."); // Placeholder
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="View Reports"
        description="Analyze attendance and performance data for batches and departments."
        icon={BarChart3}
        actions={
          <Button onClick={handleDownloadReport} disabled={!reportType}>
            <Download className="mr-2 h-4 w-4" /> Download Report
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 items-end">
            <Select onValueChange={setReportType} value={reportType}>
              <SelectTrigger><SelectValue placeholder="Select Report Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="attendance-batch">Batch-wise Attendance</SelectItem>
                <SelectItem value="attendance-department">Department-wise Attendance</SelectItem>
                <SelectItem value="performance-batch">Batch-wise Performance</SelectItem>
                <SelectItem value="performance-department">Department-wise Performance</SelectItem>
              </SelectContent>
            </Select>

            {(reportType.includes("batch")) && (
              <Select onValueChange={setSelectedBatch} value={selectedBatch}>
                <SelectTrigger><SelectValue placeholder="Select Batch (Optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Batches</SelectItem>
                  {mockBatchesForReport.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {(reportType.includes("department")) && (
              <Select onValueChange={setSelectedDepartment} value={selectedDepartment}>
                <SelectTrigger><SelectValue placeholder="Select Department (Optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  {DEPARTMENTS.map(d => <SelectItem key={d.value} value={d.label}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
             <Button variant="outline" className="md:col-start-3"><Filter className="mr-2 h-4 w-4" /> Generate Report</Button>
          </div>
        </CardHeader>
      </Card>
      
      {reportType === "attendance-batch" && (
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Batch-wise Attendance Overview</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Present" fill="hsl(var(--chart-2))" />
                <Bar dataKey="Absent" fill="hsl(var(--chart-1))" />
                <Bar dataKey="Late" fill="hsl(var(--chart-4))" />
              </BarChart>
            </ResponsiveContainer>
            <Table className="mt-4">
              <TableHeader><TableRow><TableHead>Batch</TableHead><TableHead>Present (%)</TableHead><TableHead>Absent (%)</TableHead><TableHead>Late (%)</TableHead></TableRow></TableHeader>
              <TableBody>
                {mockAttendanceData.map(d => (
                  <TableRow key={d.batchId}>
                    <TableCell>{d.batchName}</TableCell>
                    <TableCell>{(d.present / d.total * 100).toFixed(1)}%</TableCell>
                    <TableCell>{(d.absent / d.total * 100).toFixed(1)}%</TableCell>
                    <TableCell>{(d.late / d.total * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {reportType === "performance-department" && (
         <Card className="shadow-lg">
          <CardHeader><CardTitle>Department-wise Average Performance</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Avg. Score" fill="hsl(var(--chart-3))" />
              </BarChart>
            </ResponsiveContainer>
            <Table className="mt-4">
              <TableHeader><TableRow><TableHead>Department</TableHead><TableHead>Average Score</TableHead></TableRow></TableHeader>
              <TableBody>
                {mockPerformanceData.map(d => (
                  <TableRow key={d.department}>
                    <TableCell>{d.department}</TableCell>
                    <TableCell>{d.avgScore}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {reportType !== "attendance-batch" && reportType !== "performance-department" && (
         <Card className="shadow-lg">
          <CardHeader><CardTitle>Report Data</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">Report type selected. Data for this report will be displayed here. (Placeholder for: {reportType})</p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

export const metadata = {
  title: "View Reports - AEC FSP Portal",
};
