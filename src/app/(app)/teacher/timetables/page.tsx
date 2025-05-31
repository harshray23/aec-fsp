
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { timetableEntries as globalTimetableEntries, batches as mockTeacherBatchesForTimetable } from "@/lib/mockData"; 
import type { TimetableEntry } from "@/lib/types"; 

export default function ViewTimetablesPage() {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);

  useEffect(() => {
    // In a real app, you might filter these for the current teacher's batches
    // For this view-only page, we will display all relevant entries from global store
    // Teachers would typically only see entries for batches they are assigned to.
    // This logic would need refinement if current user context was available here to filter batches.
    const teacherId = "TEACH_001"; // Placeholder for actual current teacher ID
    const teacherBatches = mockTeacherBatchesForTimetable.filter(b => b.teacherId === teacherId).map(b => b.id);
    setTimetable(globalTimetableEntries.filter(entry => teacherBatches.includes(entry.batchId)));
  }, []);


  return (
    <div className="space-y-8">
      <PageHeader
        title="View Timetables"
        description="View timetables for your assigned batches."
        icon={CalendarDays}
        // "Add New Session" button removed as teachers can only view
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Scheduled Timetable Sessions</CardTitle>
          <CardDescription>Overview of scheduled sessions for your batches.</CardDescription>
        </CardHeader>
        <CardContent>
          {timetable.length > 0 ? (
            <div className="space-y-4">
              {timetable.map(entry => {
                const batchName = mockTeacherBatchesForTimetable.find(b => b.id === entry.batchId)?.name || "Unknown Batch";
                return (
                  <Card key={entry.id} className="bg-muted/30">
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{entry.subject}</CardTitle>
                          <CardDescription>
                            {batchName}
                          </CardDescription>
                        </div>
                        {/* Edit and Delete buttons removed */}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2"><Badge>{entry.dayOfWeek}</Badge> <Clock className="h-4 w-4 inline-block mr-1" /> {entry.startTime} - {entry.endTime}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No timetable sessions found for your assigned batches.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
