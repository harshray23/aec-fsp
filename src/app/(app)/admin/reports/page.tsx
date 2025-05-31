
"use client";

import React, { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Download, Filter, AlertCircle } from "lucide-react";
import { DEPARTMENTS } from "@/lib/constants";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import { batches as allBatches, students as allStudents, attendanceRecords as allAttendanceRecords } from "@/lib/mockData";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Admin specific mock data generation for reports
const adminMockAttendanceData = allBatches.map(batch => {
  const studentsInBatch = allStudents.filter(s => s.batchId === batch.id);
  const present = studentsInBatch.filter(s => 
    allAttendanceRecords.some(ar => ar.studentId === s.id && ar.batchId === batch.id && ar.status === "present")
  ).length;
  const absent = studentsInBatch.filter(s => 
    allAttendanceRecords.some(ar => ar.studentId === s.id && ar.batchId === batch.id && ar.status === "absent")
  ).length;
  const late = studentsInBatch.filter(s => 
    allAttendanceRecords.some(ar => ar.studentId === s.id && ar.batchId === batch.id && ar.status === "late")
  ).length;
  
  // For total, consider students *who have any record* or all students in batch for a more general view
  // For simplicity, let's use total students assigned to the batch for percentage calculation base
  const totalWithRecords = new Set(allAttendanceRecords.filter(ar => ar.batchId === batch.id).map(ar => ar.studentId)).size;


  return {
    batchId: batch.id,
    batchName: batch.name,
    present: present,
    absent: absent,
    late: late,
    total: studentsInBatch.length, // Using total assigned students for overall percentage
    totalWithRecords: totalWithRecords // students with any attendance mark for this batch
  };
}).filter(b => b.total > 0); // Only show batches with students for cleaner report

const adminMockPerformanceData = DEPARTMENTS.map(dept => ({
  department: dept.label,
  avgScore: Math.floor(Math.random() * (95 - 70 + 1)) + 70, // Random score between 70-95%
}));


export default function AdminViewReportsPage() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<string>("attendance-batch");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>("all"); // Renamed to avoid conflict
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>("all"); // Renamed

  const filteredAttendanceData = useMemo(() => {
    if (!adminMockAttendanceData) return [];
    if (selectedBatchFilter === "all") return adminMockAttendanceData;
    return adminMockAttendanceData.filter(d => d.batchId === selectedBatchFilter);
  }, [selectedBatchFilter]);

  const filteredPerformanceData = useMemo(() => {
    if(!adminMockPerformanceData) return [];
    if(selectedDepartmentFilter === "all") return adminMockPerformanceData;
    return adminMockPerformanceData.filter(d => d.department === DEPARTMENTS.find(dep => dep.value === selectedDepartmentFilter)?.label);
  }, [selectedDepartmentFilter]);


  const chartData = useMemo(() => {
    if (reportType === "attendance-batch") {
      return filteredAttendanceData.map(d => ({ name: d.batchName, Present: d.present, Absent: d.absent, Late: d.late }));
    }
    if (reportType === "performance-department") {
      return filteredPerformanceData.map(d => ({ name: d.department, "Avg. Score": d.avgScore }));
    }
    return [];
  }, [reportType, filteredAttendanceData, filteredPerformanceData]);

  const exportToExcel = (data: any[], fileName: string) => {
    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "There is no data to export for the selected report type or filters.",
        variant: "destructive",
      });
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ReportData");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    toast({
      title: "Export Successful",
      description: `${fileName}.xlsx has been downloaded.`,
    });
  };

  const handleDownloadReport = () => {
    let dataToExport: any[] = [];
    let fileName = "admin_report";

    switch (reportType) {
      case "attendance-batch":
        dataToExport = filteredAttendanceData.map(d => ({
          'Batch Name': d.batchName,
          'Present': d.present,
          'Absent': d.absent,
          'Late': d.late,
          'Total Students': d.total,
          'Students with Records': d.totalWithRecords,
          'Present (%)': (d.total > 0 ? (d.present / d.total * 100) : 0).toFixed(1),
          'Absent (%)': (d.total > 0 ? (d.absent / d.total * 100) : 0).toFixed(1),
          'Late (%)': (d.total > 0 ? (d.late / d.total * 100) : 0).toFixed(1),
        }));
        fileName = "Admin_Batch_Attendance_Report";
        break;
      case "performance-department":
        dataToExport = filteredPerformanceData.map(d => ({
          'Department': d.department,
          'Average Score (%)': d.avgScore,
        }));
        fileName = "Admin_Department_Performance_Report";
        break;
      default:
        toast({
          title: "Not Implemented",
          description: `Excel export for "${reportType}" is not yet available.`,
          variant: "default",
        });
        return;
    }
    exportToExcel(dataToExport, fileName);
  };
  
  const isDownloadDisabled = () => {
    if (reportType === "attendance-batch") return filteredAttendanceData.length === 0;
    if (reportType === "performance-department") return filteredPerformanceData.length === 0;
    if (reportType === "attendance-department" || reportType === "performance-batch") return true; // Not yet implemented
    return chartData.length === 0;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin View Reports"
        description="Analyze system-wide attendance and performance data."
        icon={BarChart3}
        actions={
          <Button onClick={handleDownloadReport} disabled={isDownloadDisabled()}>
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
                <SelectItem value="attendance-department">Department-wise Attendance (Coming Soon)</SelectItem>
                <SelectItem value="performance-batch">Batch-wise Performance (Coming Soon)</SelectItem>
                <SelectItem value="performance-department">Department-wise Performance</SelectItem>
              </SelectContent>
            </Select>

            {(reportType.includes("batch")) && (
              <Select onValueChange={setSelectedBatchFilter} value={selectedBatchFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by Batch" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {allBatches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  {allBatches.length === 0 && <p className="p-2 text-sm text-muted-foreground">No batches.</p>}
                </SelectContent>
              </Select>
            )}
            {(reportType.includes("department")) && (
              <Select onValueChange={setSelectedDepartmentFilter} value={selectedDepartmentFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by Department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENTS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {/* <Button variant="outline" className="md:col-start-3"><Filter className="mr-2 h-4 w-4" /> Generate Report</Button> */}
          </div>
        </CardHeader>
      </Card>
      
      {reportType === "attendance-batch" && (
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Batch-wise Attendance Overview</CardTitle></CardHeader>
          <CardContent>
            {filteredAttendanceData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Present" fill="hsl(var(--chart-2))" stackId="a" />
                    <Bar dataKey="Absent" fill="hsl(var(--chart-1))" stackId="a" />
                    <Bar dataKey="Late" fill="hsl(var(--chart-4))" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
                <Table className="mt-4">
                  <TableHeader><TableRow><TableHead>Batch</TableHead><TableHead>Total Students</TableHead><TableHead>Present</TableHead><TableHead>Absent</TableHead><TableHead>Late</TableHead><TableHead>Present (%)</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredAttendanceData.map(d => (
                      <TableRow key={d.batchId}>
                        <TableCell>{d.batchName}</TableCell>
                        <TableCell>{d.total}</TableCell>
                        <TableCell>{d.present}</TableCell>
                        <TableCell>{d.absent}</TableCell>
                        <TableCell>{d.late}</TableCell>
                        <TableCell>{(d.total > 0 ? (d.present / d.total * 100) : 0).toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-8">No attendance data available for the selected batch filter.</p>
            )}
          </CardContent>
        </Card>
      )}

      {reportType === "performance-department" && (
         <Card className="shadow-lg">
          <CardHeader><CardTitle>Department-wise Average Performance (Mock)</CardTitle></CardHeader>
          <CardContent>
           {filteredPerformanceData.length > 0 ? (
            <>
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
                  {filteredPerformanceData.map(d => (
                    <TableRow key={d.department}>
                      <TableCell>{d.department}</TableCell>
                      <TableCell>{d.avgScore}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
            ) : (
              <p className="text-muted-foreground text-center py-8">No performance data available for the selected department filter.</p>
            )}
          </CardContent>
        </Card>
      )}
      
      {(reportType === "attendance-department" || reportType === "performance-batch") && (
         <Card className="shadow-lg">
          <CardHeader><CardTitle>Report Data (Coming Soon)</CardTitle></CardHeader>
          <CardContent>
             <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    This report type ({reportType}) is currently under development. Please check back later.
                </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

export const metadata = {
  title: "Admin Reports - AEC FSP Portal",
};
