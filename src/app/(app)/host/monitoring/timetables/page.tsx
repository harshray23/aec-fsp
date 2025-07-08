
"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CalendarDays, Clock, UserCheck2, Building, HomeIcon, Loader2 } from "lucide-react"; 
import { Badge } from "@/components/ui/badge";
import { DEPARTMENTS } from "@/lib/constants";
import type { Batch, Teacher } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface ProcessedTimetable {
  batchId: string;
  batchName: string;
  departmentName: string;
  teacherName: string;
  roomNumber?: string;
  schedule: {
    days: string;
    time: string;
    subject: string;
  }[];
}

export default function HostMonitorTimetablesPage() {
  const [processedTimetables, setProcessedTimetables] = useState<ProcessedTimetable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [batchesRes, teachersRes] = await Promise.all([
          fetch('/api/batches'),
          fetch('/api/teachers'),
        ]);

        if (!batchesRes.ok || !teachersRes.ok) {
          throw new Error('Failed to fetch timetable data.');
        }
        
        const allBatches: Batch[] = await batchesRes.json();
        const allTeachers: Teacher[] = await teachersRes.json();
        
        const teachersMap = new Map(allTeachers.map(t => [t.id, t.name]));

        const timetables = allBatches
          .filter(batch => batch.daysOfWeek?.length > 0 && batch.startTime && batch.endTime)
          .map(batch => {
            const departmentInfo = DEPARTMENTS.find(d => d.value === batch.department);
            const teacherNames = (batch.teacherIds || []).map(id => teachersMap.get(id)).filter(Boolean).join(', ');

            return {
              batchId: batch.id,
              batchName: batch.name,
              departmentName: departmentInfo ? departmentInfo.label : (batch.department || "N/A"),
              teacherName: teacherNames || "N/A",
              roomNumber: batch.roomNumber,
              schedule: [{
                days: batch.daysOfWeek.join(', '),
                time: `${batch.startTime} - ${batch.endTime}`,
                subject: batch.topic,
              }],
            };
          })
          .sort((a, b) => a.batchName.localeCompare(b.batchName));

        setProcessedTimetables(timetables);

      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);
  
  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Monitor Timetables (Host)" icon={CalendarDays} />
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>All Batch Timetables</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Monitor Timetables (Host)"
        description="View all FSP batch timetables across departments and teachers."
        icon={CalendarDays}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Batch Timetables</CardTitle>
          <CardDescription>Expand each batch to see its detailed schedule, assigned teacher, and department.</CardDescription>
        </CardHeader>
        <CardContent>
          {processedTimetables.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {processedTimetables.map((timetable) => (
                <AccordionItem value={timetable.batchId} key={timetable.batchId}>
                  <AccordionTrigger className="hover:no-underline text-left">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full pr-2 md:pr-4 gap-y-1 md:gap-x-4">
                      <div className="flex-grow">
                        <h3 className="font-semibold text-base md:text-lg">{timetable.batchName}</h3>
                        <div className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-3 gap-y-0.5 mt-1">
                          <span className="flex items-center"><Building className="h-3.5 w-3.5 mr-1 flex-shrink-0" /> {timetable.departmentName}</span>
                          <span className="flex items-center"><UserCheck2 className="h-3.5 w-3.5 mr-1 flex-shrink-0" /> Teacher: {timetable.teacherName}</span>
                          {timetable.roomNumber && <span className="flex items-center"><HomeIcon className="h-3.5 w-3.5 mr-1 flex-shrink-0" /> Room: {timetable.roomNumber}</span>}
                        </div>
                      </div>
                      <Badge variant="outline" className="mt-1 md:mt-0 self-start md:self-center">1 schedule</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-3 pl-4 pt-2 border-l ml-2">
                      {timetable.schedule.map((session, index) => (
                        <li key={index} className="p-3 bg-muted/30 rounded-md shadow-sm">
                          <div className="flex justify-between items-center">
                            <p className="font-medium">{session.subject}</p>
                            <Badge>{session.days}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-x-4 mt-1">
                             <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{session.time}</span>
                            {timetable.roomNumber && <span className="flex items-center gap-1"><HomeIcon className="h-4 w-4" />{timetable.roomNumber}</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
             <p className="text-center text-muted-foreground py-4">No batches with schedules found. Configure batches to see their timetables here.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
