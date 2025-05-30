"use client";

import React, { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CalendarDays, PlusCircle, Edit, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Mock Data
const mockTeacherBatchesForTimetable = [
  { id: "B001", name: "FSP Batch Alpha - CSE 2024" },
  { id: "B005", name: "Web Development Workshop" },
];

interface TimetableEntry {
  id: string;
  batchId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: string;
}

const initialTimetable: TimetableEntry[] = [
  { id: "TT001", batchId: "B001", dayOfWeek: "Monday", startTime: "09:00", endTime: "11:00", subject: "Advanced Java" },
  { id: "TT002", batchId: "B001", dayOfWeek: "Wednesday", startTime: "09:00", endTime: "11:00", subject: "Advanced Java" },
  { id: "TT003", batchId: "B005", dayOfWeek: "Tuesday", startTime: "14:00", endTime: "16:00", subject: "React & Next.js" },
];

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const timetableEntrySchema = z.object({
  batchId: z.string().min(1, "Batch is required."),
  dayOfWeek: z.string().min(1, "Day of week is required."),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time (HH:MM)."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid end time (HH:MM)."),
  subject: z.string().min(2, "Subject must be at least 2 characters."),
}).refine(data => data.startTime < data.endTime, {
  message: "End time must be after start time.",
  path: ["endTime"],
});

type TimetableEntryFormValues = z.infer<typeof timetableEntrySchema>;

export default function ManageTimetablesPage() {
  const { toast } = useToast();
  const [timetable, setTimetable] = useState<TimetableEntry[]>(initialTimetable);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

  const form = useForm<TimetableEntryFormValues>({
    resolver: zodResolver(timetableEntrySchema),
    defaultValues: { batchId: "", dayOfWeek: "", startTime: "", endTime: "", subject: "" },
  });

  React.useEffect(() => {
    if (editingEntry) {
      form.reset(editingEntry);
    } else {
      form.reset({ batchId: "", dayOfWeek: "", startTime: "", endTime: "", subject: "" });
    }
  }, [editingEntry, form]);

  const onSubmit = (values: TimetableEntryFormValues) => {
    if (editingEntry) {
      setTimetable(prev => prev.map(entry => entry.id === editingEntry.id ? { ...editingEntry, ...values } : entry));
      toast({ title: "Timetable Updated", description: "The session has been updated." });
    } else {
      const newEntry: TimetableEntry = { ...values, id: `TT${Date.now()}` };
      setTimetable(prev => [...prev, newEntry]);
      toast({ title: "Timetable Session Added", description: "New session added to the timetable." });
    }
    setIsDialogOpen(false);
    setEditingEntry(null);
  };

  const handleEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (entryId: string) => {
     // Confirm before deleting
    if(confirm("Are you sure you want to delete this timetable entry?")){
        setTimetable(prev => prev.filter(entry => entry.id !== entryId));
        toast({ title: "Session Deleted", description: "The timetable session has been removed.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manage Timetables"
        description="Create, view, and edit timetables for your batches."
        icon={CalendarDays}
        actions={
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingEntry(null); }}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Session</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingEntry ? "Edit Timetable Session" : "Add New Timetable Session"}</DialogTitle>
                <DialogDescription>
                  {editingEntry ? "Update the details for this session." : "Fill in the details for the new session."}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField control={form.control} name="batchId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select Batch" /></SelectTrigger></FormControl>
                        <SelectContent>{mockTeacherBatchesForTimetable.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="dayOfWeek" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Week</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select Day" /></SelectTrigger></FormControl>
                        <SelectContent>{daysOfWeek.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="startTime" render={({ field }) => (
                    <FormItem><FormLabel>Start Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="endTime" render={({ field }) => (
                    <FormItem><FormLabel>End Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="subject" render={({ field }) => (
                    <FormItem><FormLabel>Subject/Module</FormLabel><FormControl><Input placeholder="Enter subject or module name" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    <Button type="submit">{editingEntry ? "Save Changes" : "Add Session"}</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Current Timetable</CardTitle>
          <CardDescription>Overview of all scheduled sessions for your batches.</CardDescription>
        </CardHeader>
        <CardContent>
          {timetable.length > 0 ? (
            <div className="space-y-4">
              {timetable.map(entry => (
                <Card key={entry.id} className="bg-muted/30">
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{entry.subject}</CardTitle>
                        <CardDescription>
                          {mockTeacherBatchesForTimetable.find(b => b.id === entry.batchId)?.name || "Unknown Batch"}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><Badge>{entry.dayOfWeek}</Badge> <Clock className="h-4 w-4 inline-block mr-1" /> {entry.startTime} - {entry.endTime}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No timetable sessions found. Add a new session to get started.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: "Manage Timetables - AEC FSP Portal",
};
