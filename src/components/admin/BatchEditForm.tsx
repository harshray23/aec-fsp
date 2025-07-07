
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Users, Link as LinkIcon, Clipboard, ClipboardCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { DEPARTMENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Batch, Teacher } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const daysOfWeekOptions = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
];

const batchEditSchema = z.object({
  name: z.string().min(3, "Batch name must be at least 3 characters"),
  department: z.string().min(1, "Department is required"),
  topic: z.string().min(2, "Topic must be at least 2 characters"),
  teacherIds: z.array(z.string()).min(1, "At least one teacher is required."),
  startDate: z.date({ required_error: "Start date is required." }),
  daysOfWeek: z.array(z.string()).refine(value => value.length > 0, {
    message: "Please select at least one day of the week.",
  }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time (HH:MM)."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid end time (HH:MM)."),
  roomNumber: z.string().max(20, "Room number too long").optional(),
  status: z.enum(["Scheduled", "Ongoing", "Completed"], { required_error: "Status is required." }),
}).refine(data => data.startTime < data.endTime, {
  message: "End time must be after start time.",
  path: ["endTime"],
});

type BatchEditFormValues = z.infer<typeof batchEditSchema>;

interface BatchEditFormProps {
  batchData: Batch;
  redirectPathAfterSuccess?: string;
}

export default function BatchEditForm({ batchData, redirectPathAfterSuccess }: BatchEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);
  const [enrollmentLink, setEnrollmentLink] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const form = useForm<BatchEditFormValues>({
    resolver: zodResolver(batchEditSchema),
    defaultValues: {
      name: batchData.name || "",
      department: batchData.department || "",
      topic: batchData.topic || "",
      teacherIds: batchData.teacherIds || [],
      startDate: batchData.startDate ? parseISO(batchData.startDate) : new Date(),
      daysOfWeek: batchData.daysOfWeek || [],
      startTime: batchData.startTime || "",
      endTime: batchData.endTime || "",
      roomNumber: batchData.roomNumber || "",
      status: batchData.status || "Scheduled",
    },
  });
  
  useEffect(() => {
    form.reset({
      name: batchData.name || "",
      department: batchData.department || "",
      topic: batchData.topic || "",
      teacherIds: batchData.teacherIds || [],
      startDate: batchData.startDate ? parseISO(batchData.startDate) : new Date(),
      daysOfWeek: batchData.daysOfWeek || [],
      startTime: batchData.startTime || "",
      endTime: batchData.endTime || "",
      roomNumber: batchData.roomNumber || "",
      status: batchData.status || "Scheduled",
    });
    if (batchData.id) {
        setEnrollmentLink(`${window.location.origin}/enroll/${batchData.id}`);
    }
  }, [batchData, form]);


  useEffect(() => {
    const fetchTeachers = async () => {
      setIsLoadingTeachers(true);
      try {
        const response = await fetch("/api/teachers");
        if (!response.ok) throw new Error("Failed to fetch teachers");
        const data = await response.json();
        setTeachers(data);
      } catch (error) {
        toast({ title: "Error", description: "Could not load teachers.", variant: "destructive" });
      } finally {
        setIsLoadingTeachers(false);
      }
    };
    fetchTeachers();
  }, [toast]);
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(enrollmentLink).then(() => {
        setIsCopied(true);
        toast({ title: "Copied!", description: "Enrollment link copied to clipboard." });
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const onSubmit = async (values: BatchEditFormValues) => {
    form.control.disabled = true;
    try {
      const payload = {
        ...values,
        startDate: values.startDate.toISOString(),
      };

      const response = await fetch(`/api/batches/${batchData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update batch. Unknown error.' }));
        throw new Error(errorData.message || 'Failed to update batch.');
      }
      
      await response.json();
      
      toast({
          title: "Batch Update Successful!",
          description: `Batch "${values.name}" has been updated.`,
      });
      router.push(redirectPathAfterSuccess || "/admin/batches");
      router.refresh(); 
    } catch (error: any) {
      toast({
        title: "Batch Update Error",
        description: error.message || "Could not update batch.",
        variant: "destructive",
      });
    } finally {
      form.control.disabled = false;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Batch Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="topic" render={({ field }) => ( <FormItem> <FormLabel>Topic / Module Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        </div>
        <FormField control={form.control} name="department" render={({ field }) => ( <FormItem> <FormLabel>Department</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl> <SelectContent>{DEPARTMENTS.map(dept => (<SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>))}</SelectContent> </Select> <FormMessage /> </FormItem> )}/>
        
        <FormField
            control={form.control}
            name="teacherIds"
            render={() => (
                <FormItem>
                    <FormLabel>Assign Teachers</FormLabel>
                    <FormDescription>Select one or more teachers for this batch.</FormDescription>
                     <ScrollArea className="h-40 w-full rounded-md border">
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            {teachers.map((teacher) => (
                            <FormField
                                key={teacher.id}
                                control={form.control}
                                name="teacherIds"
                                render={({ field }) => {
                                return (
                                    <FormItem
                                    key={teacher.id}
                                    className="flex flex-row items-center space-x-3 space-y-0"
                                    >
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value?.includes(teacher.id)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...(field.value || []), teacher.id])
                                            : field.onChange(
                                                (field.value || []).filter(
                                                    (value) => value !== teacher.id
                                                )
                                                );
                                        }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        {teacher.name} ({DEPARTMENTS.find(d=>d.value === teacher.department)?.label})
                                    </FormLabel>
                                    </FormItem>
                                );
                                }}
                            />
                            ))}
                        </div>
                    </ScrollArea>
                    <FormMessage />
                </FormItem>
            )}
        />


        <FormField control={form.control} name="startDate" render={({ field }) => ( <FormItem className="flex flex-col"> <FormLabel>Start Date</FormLabel> <Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal md:w-1/2",!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="daysOfWeek" render={() => ( <FormItem> <FormLabel>Days of the Week</FormLabel> <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">{daysOfWeekOptions.map((item) => (<FormField key={item.id} control={form.control} name="daysOfWeek" render={({ field }) => (<FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item.label)} onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), item.label]) : field.onChange((field.value || []).filter(value => value !== item.label))}/></FormControl><FormLabel className="font-normal">{item.label}</FormLabel></FormItem>)}/>))}</div><FormMessage /></FormItem>)}/>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="startTime" render={({ field }) => ( <FormItem> <FormLabel>Start Time</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="endTime" render={({ field }) => ( <FormItem> <FormLabel>End Time</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        </div>
        <FormField control={form.control} name="roomNumber" render={({ field }) => ( <FormItem> <FormLabel>Room Number (Optional)</FormLabel> <FormControl><Input placeholder="E.g., R101" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="status" render={({ field }) => ( <FormItem> <FormLabel>Batch Status</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl> <SelectContent><SelectItem value="Scheduled">Scheduled</SelectItem><SelectItem value="Ongoing">Ongoing</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent> </Select> <FormMessage /> </FormItem> )}/>
        
        {batchData.id && (
            <Card className="shadow-inner bg-muted/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LinkIcon/> Shareable Enrollment Link</CardTitle>
                    <CardDescription>
                        Share this link with students to allow them to self-enroll in this batch.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                    <Input value={enrollmentLink} readOnly className="bg-background"/>
                    <Button type="button" size="icon" onClick={handleCopyToClipboard}>
                        {isCopied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                    </Button>
                </CardContent>
            </Card>
        )}


        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isLoadingTeachers}>
          {form.formState.isSubmitting ? "Saving Changes..." : "Save All Changes"}
        </Button>
      </form>
    </Form>
  );
}

    
