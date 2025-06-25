
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck2, CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import type { AttendanceRecord } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

type AttendanceStatus = "present" | "absent" | "late";

interface ModifierDates {
  present: Date[];
  absent: Date[];
  late: Date[];
}

export default function StudentAttendanceCalendarPage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    const fetchAttendance = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let studentId = null;
        const storedUser = localStorage.getItem("currentUser");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          studentId = user?.studentId || user?.id; 
        }

        if (!studentId) {
          setError("Could not identify student. Please log in again.");
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/attendance?studentId=${studentId}`);
        
        if (!response.ok) {
          let errorMessage = `API Error: ${response.status} ${response.statusText || ''}`.trim();
          try {
            const errorBodyText = await response.text();
            // Check if it's JSON error from our API or an HTML page (like 404)
            if (response.headers.get("content-type")?.includes("application/json")) {
                const errorData = JSON.parse(errorBodyText);
                errorMessage = errorData.message || errorMessage;
            } else if (errorBodyText.trim().toLowerCase().startsWith("<!doctype html")) {
                errorMessage = `Failed to fetch attendance records. The requested resource might not be available (${response.status}).`;
            } else {
                errorMessage = errorBodyText.substring(0, 150) || errorMessage;
            }
          } catch (e) {
            // Ignore if parsing errorBodyText fails, use the initial errorMessage
          }
          throw new Error(errorMessage);
        }

        const data: AttendanceRecord[] = await response.json();
        setAttendanceRecords(data);
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred while fetching attendance data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const modifierDates = useMemo(() => {
    const modifiers: ModifierDates = { present: [], absent: [], late: [] };
    attendanceRecords.forEach(record => {
      // record.date is a "YYYY-MM-DD" string.
      // Create a Date object in the user's local timezone to avoid off-by-one errors
      // caused by UTC conversion when the calendar component renders the date.
      const [year, month, day] = record.date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
  
      if (modifiers[record.status]) {
        modifiers[record.status].push(localDate);
      }
    });
    return modifiers;
  }, [attendanceRecords]);


  const modifiersClassNames = {
    present: "day-present",
    absent: "day-absent",
    late: "day-late",
  };

  const LegendItem = ({ colorClass, label, icon: Icon }: { colorClass: string, label: string, icon: React.ElementType }) => (
    <div className="flex items-center space-x-2">
      <div className={`w-4 h-4 rounded-sm ${colorClass} flex items-center justify-center`}>
        <Icon className="h-3 w-3 text-white" />
      </div>
      <span>{label}</span>
    </div>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Attendance Calendar"
        description="View your attendance status on the calendar."
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
          <CardTitle>Attendance Overview</CardTitle>
          <CardDescription>
            Days are highlighted based on your attendance. Navigate months using the arrows.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-grow w-full md:w-auto">
            {isLoading ? (
              <div className="flex justify-center items-center p-4">
                 <Skeleton className="w-full h-[300px] md:w-[280px]" />
              </div>
            ) : attendanceRecords.length === 0 && !error ? (
                 <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>No Records</AlertTitle>
                    <AlertDescription>No attendance records found for you yet.</AlertDescription>
                </Alert>
            ) : !error ? ( // Only render calendar if no error
              <Calendar
                mode="single"
                selected={undefined} 
                onSelect={() => {}} 
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                modifiers={modifierDates}
                modifiersClassNames={modifiersClassNames}
                className="rounded-md border shadow-sm p-0 w-full"
                classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 p-3",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center px-2",
                    nav_button: "h-7 w-7",
                    head_row: "flex justify-around",
                    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2 justify-around",
                    cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                    day: "h-9 w-9 p-0 font-normal",
                    day_selected: "!bg-primary/20 !text-primary-foreground",
                }}
              />
            ) : null}
          </div>
          <Card className="p-4 md:w-64 w-full bg-muted/30 shadow-inner">
            <h3 className="text-lg font-semibold mb-3">Legend</h3>
            <div className="space-y-2">
              <LegendItem colorClass="bg-green-500" label="Present" icon={CheckCircle} />
              <LegendItem colorClass="bg-red-500" label="Absent" icon={XCircle} />
              <LegendItem colorClass="bg-yellow-500" label="Late" icon={AlertTriangle} />
            </div>
            <p className="text-xs text-muted-foreground mt-4">
                Note: If multiple sessions occur on the same day with different statuses, the calendar might only reflect one. Check detailed records for specifics.
            </p>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
