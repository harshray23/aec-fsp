
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Users, Link as LinkIcon, Clipboard, ClipboardCheck, Loader2 } from "lucide-react";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { DEPARTMENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Batch, Teacher, Student } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";


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
  topic: z.string().min(2, "Topic must be at least 2 characters"),
  teacherIds: z.array(z.string()).min(1, "At least one teacher is required."),
  departments: z.array(z.string()).min(1, "At least one department is required"),
  studentIds: z.array(z.string()).optional(),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  daysOfWeek: z.array(z.string()).refine(value => value.length > 0, {
    message: "Please select at least one day of the week.",
  }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time (HH:MM)."),
  endTime: z.string().regex(/^([01]\d|2[0-5]\d)$/, "Invalid end time (HH:MM)."),
  roomNumber: z.string().max(20, "Room number too long").optional(),
  status: z.enum(["Scheduled", "Ongoing", "Completed"], { required_error: "Status is required." }),
}).refine(data => data.startTime < data.endTime, {
  message: "End time must be after start time.",
  path: ["endTime"],
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after the start date.",
  path: ["endDate"],
});

type BatchEditFormValues = z.infer<typeof batchEditSchema>;

interface BatchEditFormProps {
  batchData?: Batch; // Make optional to support create mode
  redirectPathAfterSuccess?: string;
}

export default function BatchEditForm({ batchData, redirectPathAfterSuccess }: BatchEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [enrollmentLink, setEnrollmentLink] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [tempSelectedStudentIds, setTempSelectedStudentIds] = useState<string[]>([]);

  const isEditMode = !!batchData?.id;
  const isFirstRender = React.useRef(true);


  const form = useForm<BatchEditFormValues>({
    resolver: zodResolver(batchEditSchema),
    defaultValues: {
      name: batchData?.name || "",
      topic: batchData?.topic || "",
      teacherIds: batchData?.teacherIds || [],
      departments: batchData?.departments || [],
      studentIds: batchData?.studentIds || [],
      startDate: batchData?.startDate ? parseISO(batchData.startDate) : undefined,
      endDate: batchData?.endDate ? parseISO(batchData.endDate) : undefined,
      daysOfWeek: batchData?.daysOfWeek || [],
      startTime: batchData?.startTime || "",
      endTime: batchData?.endTime || "",
      roomNumber: batchData?.roomNumber || "",
      status: batchData?.status || "Scheduled",
    },
  });
  
  useEffect(() => {
    if (isEditMode && batchData) {
      form.reset({
        name: batchData.name || "",
        topic: batchData.topic || "",
        teacherIds: batchData.teacherIds || [],
        departments: batchData.departments || [],
        studentIds: batchData.studentIds || [],
        startDate: batchData.startDate ? parseISO(batchData.startDate) : undefined,
        endDate: batchData.endDate ? parseISO(batchData.endDate) : undefined,
        daysOfWeek: batchData.daysOfWeek || [],
        startTime: batchData.startTime || "",
        endTime: batchData.endTime || "",
        roomNumber: batchData.roomNumber || "",
        status: batchData.status || "Scheduled",
      });
      if (batchData?.id) {
          setEnrollmentLink(`${window.location.origin}/enroll/${batchData.id}`);
      }
    }
  }, [batchData, form, isEditMode]);

  useEffect(() => {
    // For create mode, set dates on client to avoid hydration mismatch
    if (!isEditMode) {
        const today = new Date();
        form.setValue('startDate', today);
        form.setValue('endDate', today);
    }
  }, [isEditMode, form]);


  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingTeachers(true);
      setIsLoadingStudents(true);
      try {
        const [teachersRes, studentsRes] = await Promise.all([
          fetch("/api/teachers?status=active"),
          fetch('/api/students?limit=99999')
        ]);
        if (!teachersRes.ok) throw new Error("Failed to fetch teachers");
        setTeachers(await teachersRes.json());

        if (!studentsRes.ok) throw new Error("Failed to fetch students");
        const studentData = await studentsRes.json();
        setAllStudents(studentData.students || []);

      } catch (error: any) {
        toast({ title: "Error", description: `Could not load required data: ${error.message}`, variant: "destructive" });
      } finally {
        setIsLoadingTeachers(false);
        setIsLoadingStudents(false);
      }
    };
    fetchInitialData();
  }, [toast]);

  const watchedDepartments = form.watch("departments");

  const availableStudents = useMemo(() => {
    if (!watchedDepartments || watchedDepartments.length === 0) {
        return [];
    }
    return allStudents.filter(student => watchedDepartments.includes(student.department));
  }, [allStudents, watchedDepartments]);
  
  useEffect(() => {
    if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
    }
    // When departments change, filter the existing selection of students
    // to ensure only students from the currently selected departments remain selected.
    const currentStudentIds = form.getValues("studentIds") || [];
    const availableStudentIds = availableStudents.map(s => s.id);
    const newStudentIds = currentStudentIds.filter(id => availableStudentIds.includes(id));
    form.setValue("studentIds", newStudentIds, { shouldDirty: true });
    
  }, [watchedDepartments, form, availableStudents]);
  
  
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
        endDate: values.endDate.toISOString(),
      };

      const url = isEditMode ? `/api/batches/${batchData.id}` : '/api/batches';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to ${isEditMode ? 'update' : 'create'} batch. Unknown error.` }));
        throw new Error(errorData.message || `Failed to ${isEditMode ? 'update' : 'create'} batch.`);
      }
      
      await response.json();
      
      toast({
          title: isEditMode ? "Batch Update Successful!" : "Batch Created Successfully!",
          description: `Batch "${values.name}" has been ${isEditMode ? 'updated' : 'created'}.`,
      });
      router.push(redirectPathAfterSuccess || "/admin/batches");
      router.refresh(); 
    } catch (error: any) {
      toast({
        title: `Batch ${isEditMode ? 'Update' : 'Creation'} Error`,
        description: error.message || `Could not ${isEditMode ? 'update' : 'create'} batch.`,
        variant: "destructive",
      });
    } finally {
      form.control.disabled = false;
    }
  };

  return (
    <>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Batch Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="topic" render={({ field }) => ( <FormItem> <FormLabel>Topic / Module Name</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        </div>
        
        <FormField
            control={form.control}
            name="teacherIds"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Assign Teachers</FormLabel>
                    <FormDescription>Select one or more teachers for this batch.</FormDescription>
                     <ScrollArea className="h-40 w-full rounded-md border">
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            {isLoadingTeachers ? <Loader2 className="animate-spin" /> : teachers.map((teacher) => (
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
        
        <FormField
            control={form.control}
            name="departments"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Assign Departments</FormLabel>
                    <FormDescription>Select the departments this batch is for. This will filter the available students below.</FormDescription>
                     <ScrollArea className="h-40 w-full rounded-md border">
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            {DEPARTMENTS.map((dept) => (
                            <FormField
                                key={dept.value}
                                control={form.control}
                                name="departments"
                                render={({ field }) => {
                                return (
                                    <FormItem
                                    key={dept.value}
                                    className="flex flex-row items-center space-x-3 space-y-0"
                                    >
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value?.includes(dept.value)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...(field.value || []), dept.value])
                                            : field.onChange(
                                                (field.value || []).filter(
                                                    (value) => value !== dept.value
                                                )
                                                );
                                        }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        {dept.label}
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

        <FormField
          control={form.control}
          name="studentIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign Students</FormLabel>
              <FormDescription>
                Manually assign students to this batch or use the shareable link.
              </FormDescription>
              <FormControl>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setTempSelectedStudentIds(field.value || []);
                    setIsStudentDialogOpen(true);
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Assign Students ({field.value?.length || 0} selected)
                </Button>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField control={form.control} name="startDate" render={({ field }) => ( <FormItem className="flex flex-col"> <FormLabel>Start Date</FormLabel> <Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover> <FormMessage /> </FormItem> )}/>
          <FormField control={form.control} name="endDate" render={({ field }) => ( <FormItem className="flex flex-col"> <FormLabel>End Date</FormLabel> <Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < form.getValues("startDate")} initialFocus /></PopoverContent></Popover> <FormMessage /> </FormItem> )}/>
        </div>

        <FormField control={form.control} name="daysOfWeek" render={() => ( <FormItem> <FormLabel>Days of the Week</FormLabel> <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">{daysOfWeekOptions.map((item) => (<FormField key={item.id} control={form.control} name="daysOfWeek" render={({ field }) => (<FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item.label)} onCheckedChange={(checked) => checked ? field.onChange([...(field.value || []), item.label]) : field.onChange((field.value || []).filter(value => value !== item.label))}/></FormControl><FormLabel className="font-normal">{item.label}</FormLabel></FormItem>)}/>))}</div><FormMessage /></FormItem>)}/>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="startTime" render={({ field }) => ( <FormItem> <FormLabel>Start Time</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="endTime" render={({ field }) => ( <FormItem> <FormLabel>End Time</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        </div>
        <FormField control={form.control} name="roomNumber" render={({ field }) => ( <FormItem> <FormLabel>Room Number (Optional)</FormLabel> <FormControl><Input placeholder="E.g., R101" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        
        {isEditMode && batchData.id && (
            <Card className="shadow-inner bg-muted/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LinkIcon/> Shareable Enrollment Link</CardTitle>
                    <CardDescription>
                        Share this link with students to allow them to self-enroll in this batch. This works alongside manual assignment.
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


        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isLoadingTeachers || isLoadingStudents}>
          {form.formState.isSubmitting ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save All Changes" : "Create Batch")}
        </Button>
      </form>
    </Form>
    <Dialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Assign Students</DialogTitle>
            <DialogDescription>
              Select students from the chosen departments to add to this batch.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-hidden">
            {isLoadingStudents ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin" />
              </div>
            ) : watchedDepartments.length > 0 ? (
              <ScrollArea className="h-full">
                <div className="p-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                  {availableStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex flex-row items-center space-x-3 space-y-0 p-2 rounded-md hover:bg-muted"
                    >
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={tempSelectedStudentIds.includes(student.id)}
                        onCheckedChange={(checked) => {
                          setTempSelectedStudentIds((prev) =>
                            checked
                              ? [...prev, student.id]
                              : prev.filter((id) => id !== student.id)
                          );
                        }}
                      />
                      <label htmlFor={`student-${student.id}`} className="font-normal text-sm cursor-pointer">
                        {student.name}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({student.rollNumber})
                        </span>
                      </label>
                    </div>
                  ))}
                  {availableStudents.length === 0 && (
                    <p className="text-muted-foreground col-span-full text-center py-4">
                      No students found for the selected department(s).
                    </p>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Alert>
                  <AlertTitle>Select a department first</AlertTitle>
                  <FormDescription>
                    Please select one or more departments on the main form to see the list of available students.
                  </FormDescription>
                </Alert>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsStudentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                form.setValue("studentIds", tempSelectedStudentIds, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setIsStudentDialogOpen(false);
              }}
            >
              Confirm Assignment ({tempSelectedStudentIds.length} students)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
