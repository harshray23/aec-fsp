
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CalendarDays, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock Data
interface ScheduleEntry { day: string; time: string; subject: string; teacher: string; }
interface Timetable { batchId: string; batchName: string; department: string; schedule: ScheduleEntry[]; }
const mockTimetables: Timetable[] = [];

export default function AdminTimetableOverviewPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Timetable Overview"
        description="View all FSP batch timetables across departments."
        icon={CalendarDays}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Batch Timetables</CardTitle>
          <CardDescription>Expand each batch to see its detailed schedule.</CardDescription>
        </CardHeader>
        <CardContent>
          {mockTimetables.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {mockTimetables.map((timetable) => (
                <AccordionItem value={timetable.batchId} key={timetable.batchId}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex justify-between items-center w-full pr-4">
                      <div>
                        <h3 className="font-semibold text-lg">{timetable.batchName}</h3>
                        <p className="text-sm text-muted-foreground">{timetable.department}</p>
                      </div>
                      <Badge variant="outline">{timetable.schedule.length} sessions</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-3 pl-4 pt-2 border-l ml-2">
                      {timetable.schedule.map((session, index) => (
                        <li key={index} className="p-3 bg-muted/50 rounded-md shadow-sm">
                          <div className="flex justify-between items-center">
                            <p className="font-medium">{session.subject}</p>
                            <Badge>{session.day}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4" />
                            <span>{session.time}</span>
                            <span className="mx-1">|</span>
                            <span>{session.teacher}</span>
                          </div>
                        </li>
                      ))}
                       {timetable.schedule.length === 0 && (
                        <p className="text-sm text-muted-foreground">No sessions scheduled for this batch.</p>
                       )}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
             <p className="text-center text-muted-foreground py-4">No timetables found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: "Timetable Overview - AEC FSP Portal",
};
