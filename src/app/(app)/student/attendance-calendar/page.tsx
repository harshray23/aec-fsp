
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck2, CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import type { AttendanceRecord } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, startOfMonth } from "date-fns";

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


export default function StudentAttendanceCalendarPage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()));

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
            } else {
                errorMessage = errorBodyText.substring(0, 150) || errorMessage;
            }
          } catch (e) { /* Ignore parsing errors */ }
          throw new Error(errorMessage);
        }

        const data: AttendanceRecord[] = await response.json();
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAttendanceRecords(data);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, []);
  
  const attendanceByDate = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    // Iterate in reverse to let earlier records set the base status
    for (const record of [...attendanceRecords].reverse()) {
        const dateStr = format(parseISO(record.date), 'yyyy-MM-dd');
        const currentStatus = map.get(dateStr);

        // Status hierarchy: absent > late > present
        if (record.status === 'absent') {
            map.set(dateStr, 'absent');
        } else if (record.status === 'late' && currentStatus !== 'absent') {
            map.set(dateStr, 'late');
        } else if (record.status === 'present' && !currentStatus) {
            map.set(dateStr, 'present');
        }
    }
    return map;
  }, [attendanceRecords]);

  const calendarModifiers = useMemo(() => {
    const present: Date[] = [];
    const absent: Date[] = [];
    const late: Date[] = [];

    attendanceByDate.forEach((status, dateStr) => {
      const date = parseISO(dateStr);
      if (status === 'present') present.push(date);
      else if (status === 'absent') absent.push(date);
      else if (status === 'late') late.push(date);
    });
    
    return { present, absent, late };
  }, [attendanceByDate]);

  const recordsForMonth = useMemo(() => {
    return attendanceRecords.filter(record => {
        const recordDate = parseISO(record.date);
        return recordDate.getFullYear() === month.getFullYear() && recordDate.getMonth() === month.getMonth();
    });
  }, [attendanceRecords, month]);


  return (
    <div className="space-y-8">
      <PageHeader
        title="My Attendance Calendar"
        description="A calendar overview of your attendance. Navigate months to see details."
        icon={CalendarCheck2}
      />

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Fetching Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
         <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !error && (
        <>
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle>Calendar Overview</CardTitle>
                <CardDescription>
                    Your daily attendance summary. View details for the month below.
                </CardDescription>
                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5"><span className="block h-3 w-3 rounded-full bg-green-500/80"></span> Present</div>
                    <div className="flex items-center gap-1.5"><span className="block h-3 w-3 rounded-full bg-yellow-500/80"></span> Late</div>
                    <div className="flex items-center gap-1.5"><span className="block h-3 w-3 rounded-full bg-red-500/80"></span> Absent</div>
                </div>
                </CardHeader>
                <CardContent className="flex justify-center">
                <Calendar
                    mode="single"
                    month={month}
                    onMonthChange={setMonth}
                    modifiers={calendarModifiers}
                    modifiersClassNames={{
                        present: 'day-present',
                        absent: 'day-absent',
                        late: 'day-late',
                    }}
                    className="rounded-md border"
                    />
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Detailed Log for {format(month, "MMMM yyyy")}</CardTitle>
                </CardHeader>
                <CardContent>
                    {recordsForMonth.length > 0 ? (
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Subject / Module</TableHead>
                                <TableHead>Half</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Remarks</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {recordsForMonth.map((record) => (
                                <TableRow key={record.id}>
                                <TableCell>{format(parseISO(record.date), "PPP")}</TableCell>
                                <TableCell>{record.subject}</TableCell>
                                <TableCell className="capitalize">{record.batchHalf}</TableCell>
                                <TableCell>{getStatusBadge(record.status)}</TableCell>
                                <TableCell className="text-muted-foreground">{record.remarks || "—"}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>No Records</AlertTitle>
                            <AlertDescription>No attendance records found for you in {format(month, "MMMM yyyy")}.</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </>
      )}

    </div>
  );
}
