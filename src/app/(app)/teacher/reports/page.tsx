
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
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";

// Mock Data
const mockBatchesForReport: {id: string, name: string, department: string}[] = [];

const mockAttendanceData: { batchId: string, batchName: string, present: number, absent: number, late: number, total: number }[] = [];

const mockPerformanceData: { department: string, avgScore: number }[] = [];


export default function ViewReportsPage() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<string>("attendance-batch");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");

  const chartData = useMemo(() => {
    if (reportType === "attendance-batch" && mockAttendanceData.length > 0) {
      return mockAttendanceData.map(d => ({ name: d.batchName, Present: d.present, Absent: d.absent, Late: d.late }));
    }
    if (reportType === "performance-department" && mockPerformanceData.length > 0) {
      return mockPerformanceData.map(d => ({ name: d.department, "Avg. Score": d.avgScore }));
    }
    return [];
  }, [reportType]);

  const exportToExcel = (data: any[], fileName: string) => {
    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "There is no data to export for the selected report type.",
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
    let fileName = "report";

    switch (reportType) {
      case "attendance-batch":
        dataToExport = mockAttendanceData.map(d => ({
          'Batch Name': d.batchName,
          'Present': d.present,
          'Absent': d.absent,
          'Late': d.late,
          'Total Students': d.total,
          'Present (%)': (d.total > 0 ? (d.present / d.total * 100) : 0).toFixed(1),
          'Absent (%)': (d.total > 0 ? (d.absent / d.total * 100) : 0).toFixed(1),
          'Late (%)': (d.total > 0 ? (d.late / d.total * 100) : 0).toFixed(1),
        }));
        fileName = "Batch_Attendance_Report";
        break;
      case "performance-department":
        dataToExport = mockPerformanceData.map(d => ({
          'Department': d.department,
          'Average Score (%)': d.avgScore,
        }));
        fileName = "Department_Performance_Report";
        break;
      // Add cases for other report types if/when data is available
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
    if (reportType === "attendance-batch") return mockAttendanceData.length === 0;
    if (reportType === "performance-department") return mockPerformanceData.length === 0;
    // For other types, disable if no specific data handling exists for download
    if (reportType === "attendance-department" || reportType === "performance-batch") return true; 
    return chartData.length === 0; // Fallback, though specific checks are better
  }


  return (
    <div className="space-y-8">
      <PageHeader
        title="View Reports"
        description="Analyze attendance and performance data for batches and departments."
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
                <SelectItem value="attendance-department">Department-wise Attendance</SelectItem>
                <SelectItem value="performance-batch">Batch-wise Performance</SelectItem>
                <SelectItem value="performance-department">Department-wise Performance</SelectItem>
              </SelectContent>
            </Select>

            {(reportType.includes("batch")) && (
              <Select onValueChange={setSelectedBatch} value={selectedBatch}>
                <SelectTrigger><SelectValue placeholder="Select Batch (Optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {mockBatchesForReport.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  {mockBatchesForReport.length === 0 && <p className="p-2 text-sm text-muted-foreground">No batches.</p>}
                </SelectContent>
              </Select>
            )}
            {(reportType.includes("department")) && (
              <Select onValueChange={setSelectedDepartment} value={selectedDepartment}>
                <SelectTrigger><SelectValue placeholder="Select Department (Optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
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
            {mockAttendanceData.length > 0 ? (
              <>
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
                        <TableCell>{(d.total > 0 ? (d.present / d.total * 100) : 0).toFixed(1)}%</TableCell>
                        <TableCell>{(d.total > 0 ? (d.absent / d.total * 100) : 0).toFixed(1)}%</TableCell>
                        <TableCell>{(d.total > 0 ? (d.late / d.total * 100) : 0).toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-8">No attendance data available for batches.</p>
            )}
          </CardContent>
        </Card>
      )}

      {reportType === "performance-department" && (
         <Card className="shadow-lg">
          <CardHeader><CardTitle>Department-wise Average Performance</CardTitle></CardHeader>
          <CardContent>
           {mockPerformanceData.length > 0 ? (
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
                  {mockPerformanceData.map(d => (
                    <TableRow key={d.department}>
                      <TableCell>{d.department}</TableCell>
                      <TableCell>{d.avgScore}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
            ) : (
              <p className="text-muted-foreground text-center py-8">No performance data available for departments.</p>
            )}
          </CardContent>
        </Card>
      )}
      
      {reportType !== "attendance-batch" && reportType !== "performance-department" && (
         <Card className="shadow-lg">
          <CardHeader><CardTitle>Report Data</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">No data available to display or export for report type: {reportType}</p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

