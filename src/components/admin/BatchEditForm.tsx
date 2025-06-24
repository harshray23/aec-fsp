
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Users } from "lucide-react";

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
import type { Batch, Teacher, Student } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  teacherId: z.string().min(1, "Teacher assignment is required."),
  startDate: z.date({ required_error: "Start date is required." }),
  daysOfWeek: z.array(z.string()).refine(value => value.length > 0, {
    message: "Please select at least one day of the week.",
  }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time (HH:MM)."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid end time (HH:MM)."),
  roomNumber: z.string().max(20, "Room number too long").optional(),
  status: z.enum(["Scheduled", "Ongoing", "Completed"], { required_error: "Status is required." }),
  selectedStudentIds: z.array(z.string()).optional(),
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
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");

  const form = useForm<BatchEditFormValues>({
    resolver: zodResolver(batchEditSchema),
    defaultValues: {
      name: batchData.name || "",
      department: batchData.department || "",
      topic: batchData.topic || "",
      teacherId: batchData.teacherId || "",
      startDate: batchData.startDate ? parseISO(batchData.startDate) : new Date(),
      daysOfWeek: batchData.daysOfWeek || [],
      startTime: batchData.startTime || "",
      endTime: batchData.endTime || "",
      roomNumber: batchData.roomNumber || "",
      status: batchData.status || "Scheduled",
      selectedStudentIds: batchData.studentIds || [],
    },
  });
  
  useEffect(() => {
    form.reset({
      name: batchData.name || "",
      department: batchData.department || "",
      topic: batchData.topic || "",
      teacherId: batchData.teacherId || "",
      startDate: batchData.startDate ? parseISO(batchData.startDate) : new Date(),
      daysOfWeek: batchData.daysOfWeek || [],
      startTime: batchData.startTime || "",
      endTime: batchData.endTime || "",
      roomNumber: batchData.roomNumber || "",
      status: batchData.status || "Scheduled",
      selectedStudentIds: batchData.studentIds || [],
    });
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
    
    const fetchStudents = async () => {
        setIsLoadingStudents(true);
        try {
            const response = await fetch("/api/students");
            if(!response.ok) throw new Error("Failed to fetch students");
            const data = await response.json();
            setAllStudents(data);
        } catch (error) {
            toast({ title: "Error", description: "Could not load students for assignment.", variant: "destructive"});
        } finally {
            setIsLoadingStudents(false);
        }
    };

    fetchTeachers();
    fetchStudents();
  }, [toast]);
  
  const selectedDepartment = form.watch("department");
  
  const studentsInDepartment = useMemo(() => {
     if (!selectedDepartment || isLoadingStudents) return [];
    return allStudents.filter(student => 
        student.department === selectedDepartment && 
        (!student.batchId || student.batchId === batchData.id)
    );
  },[selectedDepartment, allStudents, isLoadingStudents, batchData.id]);

  const filteredStudents = useMemo(() => {
    if (!studentSearchTerm) return studentsInDepartment;
    return studentsInDepartment.filter(student => 
        student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        (student.rollNumber && student.rollNumber.toLowerCase().includes(studentSearchTerm.toLowerCase()))
    );
  }, [studentsInDepartment, studentSearchTerm]);


  const onSubmit = async (values: BatchEditFormValues) => {
    form.control.disabled = true;
    try {
      // The name of the field in the form is selectedStudentIds, but the API expects studentIds
      const { selectedStudentIds, ...otherValues } = values;
      const payload = {
        ...otherValues,
        studentIds: selectedStudentIds, // Rename the field for the API
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
            <FormField control={form.control} name="department" render={({ field }) => ( <FormItem> <FormLabel>Department</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl> <SelectContent>{DEPARTMENTS.map(dept => (<SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>))}</SelectContent> </Select> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="teacherId" render={({ field }) => ( <FormItem> <FormLabel>Assign Teacher</FormLabel> <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingTeachers || teachers.length === 0}> <FormControl><SelectTrigger><SelectValue placeholder={isLoadingTeachers ? "Loading..." : "Select teacher"} /></SelectTrigger></FormControl> <SelectContent>{teachers.map(teacher => (<SelectItem key={teacher.id} value={teacher.id}>{teacher.name} ({DEPARTMENTS.find(d=>d.value === teacher.department)?.label})</SelectItem>))}</SelectContent> </Select> <FormMessage /> </FormItem> )}/>
        </div>
        <FormField control={form.control} name="startDate" render={({ field }) => ( <FormItem className="flex flex-col"> <FormLabel>Start Date</FormLabel> <Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal md:w-1/2",!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="daysOfWeek" render={() => ( <FormItem> <FormLabel>Days of the Week</FormLabel> <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">{daysOfWeekOptions.map((item) => (<FormField key={item.id} control={form.control} name="daysOfWeek" render={({ field }) => (<FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item.label)} onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), item.label]) : field.onChange((field.value || []).filter(value => value !== item.label))}/></FormControl><FormLabel className="font-normal">{item.label}</FormLabel></FormItem>)}/>))}</div><FormMessage /></FormItem>)}/>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="startTime" render={({ field }) => ( <FormItem> <FormLabel>Start Time</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="endTime" render={({ field }) => ( <FormItem> <FormLabel>End Time</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        </div>
        <FormField control={form.control} name="roomNumber" render={({ field }) => ( <FormItem> <FormLabel>Room Number (Optional)</FormLabel> <FormControl><Input placeholder="E.g., R101" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="status" render={({ field }) => ( <FormItem> <FormLabel>Batch Status</FormLabel> <Select onValueChange={field.onChange} value={field.value}> <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl> <SelectContent><SelectItem value="Scheduled">Scheduled</SelectItem><SelectItem value="Ongoing">Ongoing</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent> </Select> <FormMessage /> </FormItem> )}/>
        
        <Card className="shadow-inner bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users /> Student Enrollment</CardTitle>
            <CardDescription>
              Assign or unassign students. Only students from the batch's department who are not already in another active batch are shown.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
                placeholder="Search students by name, ID, or roll no..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                className="max-w-sm mb-4 bg-background"
                disabled={!selectedDepartment || isLoadingStudents}
            />
            <FormField
              control={form.control}
              name="selectedStudentIds"
              render={({ field }) => (
                <>
                <ScrollArea className="h-60 w-full rounded-md border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                              onCheckedChange={(checked) => {
                                const allStudentIds = filteredStudents.map(s => s.id);
                                const currentSelection = field.value || [];
                                if (checked) {
                                    const newSelection = [...new Set([...currentSelection, ...allStudentIds])];
                                    field.onChange(newSelection);
                                } else {
                                    field.onChange(currentSelection.filter(id => !allStudentIds.includes(id)));
                                }
                              }}
                              checked={filteredStudents.length > 0 && filteredStudents.every(s => field.value?.includes(s.id))}
                              aria-label="Select all students in current view"
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Roll No.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                           <TableRow key={student.id}>
                               <TableCell>
                                   <Checkbox
                                       checked={field.value?.includes(student.id)}
                                       onCheckedChange={(checked) => {
                                           const currentIds = field.value || [];
                                           return checked
                                            ? field.onChange([...currentIds, student.id])
                                            : field.onChange(currentIds.filter(id => id !== student.id))
                                       }}
                                   />
                               </TableCell>
                               <TableCell>{student.name}</TableCell>
                               <TableCell>{student.studentId}</TableCell>
                               <TableCell>{student.rollNumber}</TableCell>
                           </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    {isLoadingStudents ? "Loading students..." : "No eligible students found for this department."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                  </Table>
                </ScrollArea>
                <FormMessage className="mt-2" />
                </>
              )}
            />
          </CardContent>
        </Card>


        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isLoadingTeachers || isLoadingStudents}>
          {form.formState.isSubmitting ? "Saving Changes..." : "Save All Changes"}
        </Button>
      </form>
    </Form>
  );
}
