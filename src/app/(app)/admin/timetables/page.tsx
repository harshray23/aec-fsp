
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CalendarDays, Clock, UserCheck2, Building, HomeIcon } from "lucide-react"; 
import { Badge } from "@/components/ui/badge";
import {
  batches as allBatches,
  teachers as allTeachers,
  timetableEntries as globalTimetableEntries 
} from "@/lib/mockData";
import { DEPARTMENTS } from "@/lib/constants";
import type { Batch, Teacher, TimetableEntry as TimetableEntryType } from "@/lib/types";

interface ProcessedScheduleEntry {
  day: string;
  time: string;
  subject: string;
  roomNumber?: string;
}

interface ProcessedTimetable {
  batchId: string;
  batchName: string;
  departmentName: string;
  teacherName: string;
  roomNumber?: string;
  schedule: ProcessedScheduleEntry[];
}

export default function AdminTimetableOverviewPage() {
  const processedTimetables: ProcessedTimetable[] = [];
  const groupedByBatch: Record<string, { batch: Batch; entries: TimetableEntryType[] }> = {};

  globalTimetableEntries.forEach(entry => {
    const batch = allBatches.find(b => b.id === entry.batchId);
    if (batch) {
      if (!groupedByBatch[entry.batchId]) {
        groupedByBatch[entry.batchId] = { batch, entries: [] };
      }
      groupedByBatch[entry.batchId].entries.push(entry);
    }
  });

  for (const batchId in groupedByBatch) {
    const group = groupedByBatch[batchId];
    const batch = group.batch;
    const teacher = allTeachers.find(t => t.id === batch.teacherId);
    const departmentInfo = DEPARTMENTS.find(d => d.value === batch.department);

    processedTimetables.push({
      batchId: batch.id,
      batchName: batch.name,
      departmentName: departmentInfo ? departmentInfo.label : batch.department,
      teacherName: teacher ? teacher.name : "N/A",
      roomNumber: batch.roomNumber,
      schedule: group.entries.map(entry => ({
        day: entry.dayOfWeek,
        time: `${entry.startTime} - ${entry.endTime}`,
        subject: entry.subject,
        roomNumber: entry.roomNumber || batch.roomNumber, // Prefer entry specific room, fallback to batch room
      })).sort((a, b) => { 
        const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayIndexA = daysOrder.indexOf(a.day);
        const dayIndexB = daysOrder.indexOf(b.day);
        if (dayIndexA !== dayIndexB) {
            return dayIndexA - dayIndexB;
        }
        return a.time.localeCompare(b.time);
      }),
    });
  }
  processedTimetables.sort((a, b) => a.batchName.localeCompare(b.batchName));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Timetable Overview (Admin)"
        description="View all FSP batch timetables across departments, including assigned teachers and batch details."
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
                      <Badge variant="outline" className="mt-1 md:mt-0 self-start md:self-center">{timetable.schedule.length} sessions</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {timetable.schedule.length > 0 ? (
                    <ul className="space-y-3 pl-4 pt-2 border-l ml-2">
                      {timetable.schedule.map((session, index) => (
                        <li key={index} className="p-3 bg-muted/30 rounded-md shadow-sm">
                          <div className="flex justify-between items-center">
                            <p className="font-medium">{session.subject}</p>
                            <Badge>{session.day}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-x-4 mt-1">
                            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{session.time}</span>
                            {session.roomNumber && <span className="flex items-center gap-1"><HomeIcon className="h-4 w-4" />{session.roomNumber}</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                    ) : (
                       <p className="text-sm text-muted-foreground pl-4 pt-2 border-l ml-2">No sessions scheduled for this batch in the system.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
             <p className="text-center text-muted-foreground py-4">No timetable entries found in the system. Teachers can add sessions via their dashboard.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: "Timetable Overview - AEC FSP",
};
