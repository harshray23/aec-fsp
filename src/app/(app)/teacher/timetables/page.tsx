
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Batch } from "@/lib/types"; 
import { USER_ROLES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

export default function ViewTimetablesPage() {
  const { toast } = useToast();
  const [scheduledBatches, setScheduledBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeacherSchedules = async () => {
      setIsLoading(true);
      let teacherId: string | null = null;
      const storedUserJSON = localStorage.getItem('currentUser');
      if (storedUserJSON) {
        const user = JSON.parse(storedUserJSON);
        if (user && user.role === USER_ROLES.TEACHER) {
          teacherId = user.id;
        }
      }

      if (!teacherId) {
        toast({ title: "Error", description: "Could not identify teacher.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      
      try {
        const res = await fetch('/api/batches');
        if (!res.ok) throw new Error("Failed to fetch batches.");
        const allBatches: Batch[] = await res.json();
        
        const teacherBatches = allBatches.filter(
            batch => batch.teacherIds?.includes(teacherId) && batch.daysOfWeek?.length > 0 && batch.startTimeFirstHalf && batch.endTimeFirstHalf
        );
        setScheduledBatches(teacherBatches);
        
      } catch (error: any) {
         toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeacherSchedules();
  }, [toast]);


  return (
    <div className="space-y-8">
      <PageHeader
        title="View Timetables"
        description="View timetables for your assigned batches."
        icon={CalendarDays}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Scheduled Timetable Sessions</CardTitle>
          <CardDescription>Overview of scheduled sessions for your batches.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : scheduledBatches.length > 0 ? (
            <div className="space-y-4">
              {scheduledBatches.map(batch => (
                  <Card key={batch.id} className="bg-muted/30">
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{batch.topic}</CardTitle>
                          <CardDescription>{batch.name}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Badge>{batch.daysOfWeek.join(', ')}</Badge> 
                      </div>
                      <div className="mt-2 pl-2 space-y-1">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" /> 
                            <span>First Half: {batch.startTimeFirstHalf} - {batch.endTimeFirstHalf}</span>
                        </div>
                        {batch.startTimeSecondHalf && batch.endTimeSecondHalf && (
                             <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" /> 
                                <span>Second Half: {batch.startTimeSecondHalf} - {batch.endTimeSecondHalf}</span>
                            </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No timetable sessions found for your assigned batches. Batches must be configured with days and times to appear here.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
