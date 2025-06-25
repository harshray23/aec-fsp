
"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck2, CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import type { AttendanceRecord } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AttendanceStatus = "present" | "absent" | "late";

const getStatusBadge = (status: AttendanceStatus) => {
  switch (status) {
    case "present":
      return (
        <Badge className="flex items-center gap-1.5 justify-center w-24" variant="default">
          <CheckCircle className="h-4 w-4" />
          Present
        </Badge>
      );
    case "absent":
      return (
        <Badge className="flex items-center gap-1.5 justify-center w-24" variant="destructive">
          <XCircle className="h-4 w-4" />
          Absent
        </Badge>
      );
    case "late":
      return (
        <Badge className="flex items-center gap-1.5 justify-center w-24" variant="secondary">
          <AlertTriangle className="h-4 w-4" />
          Late
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};


export default function StudentAttendanceRecordPage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let studentDocId = null;
        const storedUser = localStorage.getItem("currentUser");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          studentDocId = user?.id; 
        }

        if (!studentDocId) {
          setError("Could not identify student. Please log in again.");
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/attendance?studentId=${studentDocId}`);
        
        if (!response.ok) {
          let errorMessage = `API Error: ${response.status} ${response.statusText || ''}`.trim();
          try {
            const errorBodyText = await response.text();
            if (response.headers.get("content-type")?.includes("application/json")) {
                const errorData = JSON.parse(errorBodyText);
                errorMessage = errorData.message || errorMessage;
            } else if (errorBodyText.trim().toLowerCase().startsWith("<!doctype html")) {
                errorMessage = `Failed to fetch attendance records. The requested resource might not be available (${response.status}).`;
            } else {
                errorMessage = errorBodyText.substring(0, 150) || errorMessage;
            }
          } catch (e) {
            // Ignore if parsing errorBodyText fails
          }
          throw new Error(errorMessage);
        }

        const data: AttendanceRecord[] = await response.json();
        // Sort records by date, most recent first
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAttendanceRecords(data);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred while fetching attendance data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, []);


  return (
    <div className="space-y-8">
      <PageHeader
        title="My Attendance Record"
        description="A detailed log of your attendance for all sessions."
        icon={CalendarCheck2}
      />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Fetching Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>
            Your complete attendance history is listed below, with the most recent sessions first.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
           ) : attendanceRecords.length > 0 && !error ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Subject / Module</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.date).toLocaleDateString(undefined, { timeZone: 'UTC' })}</TableCell>
                      <TableCell>{record.subject}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-muted-foreground">{record.remarks || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
           ) : !error ? (
              <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>No Records</AlertTitle>
                  <AlertDescription>No attendance records found for you yet.</AlertDescription>
              </Alert>
           ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
