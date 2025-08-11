
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


const batchEditSchema = z.object({
  name: z.string().min(3, "Batch name must be at least 3 characters"),
  topic: z.string().min(2, "Topic must be at least 2 characters"),
  teacherIds: z.array(z.string()).min(1, "At least one teacher is required."),
  departments: z.array(z.string()).min(1, "At least one department is required"),
  year: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  startTimeFirstHalf: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time (HH:MM)."),
  endTimeFirstHalf: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid end time (HH:MM)."),
  startTimeSecondHalf: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid start time (HH:MM)." }).optional().or(z.literal('')),
  endTimeSecondHalf: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid end time (HH:MM)." }).optional().or(z.literal('')),
  roomNumber: z.string().max(20, "Room number too long").optional(),
  status: z.enum(["Scheduled", "Ongoing", "Completed"], { required_error: "Status is required." }),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after the start date.",
  path: ["endDate"],
}).refine(data => data.startTimeFirstHalf < data.endTimeFirstHalf, {
  message: "End time for first half must be after start time.",
  path: ["endTimeFirstHalf"],
}).refine(data => {
    // If one of the second half times is provided, both must be.
    if (data.startTimeSecondHalf || data.endTimeSecondHalf) {
        return !!data.startTimeSecondHalf && !!data.endTimeSecondHalf;
    }
    return true;
}, {
    message: "Both start and end time for the second half are required if one is provided.",
    path: ["startTimeSecondHalf"], 
}).refine(data => {
    if (data.startTimeSecondHalf && data.endTimeSecondHalf) {
        return data.startTimeSecondHalf < data.endTimeSecondHalf;
    }
    return true;
}, {
    message: "End time for second half must be after start time.",
    path: ["endTimeSecondHalf"],
});

type BatchEditFormValues = z.infer<typeof batchEditSchema>;

interface BatchEditFormProps {
  batchData?: Batch; // Make optional to support create mode
  redirectPathAfterSuccess?: string;
}

const academicYearOptions = [
    { value: "1", label: "1st Year" },
    { value: "2", label: "2nd Year" },
    { value: "3", label: "3rd Year" },
    { value: "4", label: "4th Year" },
];


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

  const form = useForm<BatchEditFormValues>({
    resolver: zodResolver(batchEditSchema),
    defaultValues: {
      name: batchData?.name || "",
      topic: batchData?.topic || "",
      teacherIds: batchData?.teacherIds || [],
      departments: batchData?.departments || [],
      year: batchData?.year || "all",
      studentIds: batchData?.studentIds || [],
      startDate: batchData?.startDate ? parseISO(batchData.startDate) : undefined,
      endDate: batchData?.endDate ? parseISO(batchData.endDate) : undefined,
      startTimeFirstHalf: batchData?.startTimeFirstHalf || "",
      endTimeFirstHalf: batchData?.endTimeFirstHalf || "",
      startTimeSecondHalf: batchData?.startTimeSecondHalf || "",
      endTimeSecondHalf: batchData?.endTimeSecondHalf || "",
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
        year: batchData.year || "all",
        studentIds: batchData.studentIds || [],
        startDate: batchData.startDate ? parseISO(batchData.startDate) : undefined,
        endDate: batchData.endDate ? parseISO(batchData.endDate) : undefined,
        startTimeFirstHalf: batchData.startTimeFirstHalf || "",
        endTimeFirstHalf: batchData.endTimeFirstHalf || "",
        startTimeSecondHalf: batchData.startTimeSecondHalf || "",
        endTimeSecondHalf: batchData.endTimeSecondHalf || "",
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
  const watchedYear = form.watch("year");
  const watchedStudentIds = form.watch("studentIds") || [];

  const availableStudents = useMemo(() => {
    const departmentMatch = (student: Student) => 
        !watchedDepartments || watchedDepartments.length === 0 || watchedDepartments.includes(student.department);
    
    const yearMatch = (student: Student) =>
        !watchedYear || watchedYear === "all" || String(student.currentYear || '') === watchedYear;
    
    // Get all students currently assigned to the batch (from original data)
    const assignedStudentIds = batchData?.studentIds || [];
    const assignedStudents = allStudents.filter(s => assignedStudentIds.includes(s.id));
    
    // Get all students that match the current department/year filters
    const studentsMatchingFilter = allStudents.filter(student => departmentMatch(student) && yearMatch(student) && student.status !== 'passed_out');

    // Combine them, ensuring no duplicates
    const combined = new Map<string, Student>();
    assignedStudents.forEach(s => combined.set(s.id, s));
    studentsMatchingFilter.forEach(s => combined.set(s.id, s));

    return Array.from(combined.values());
  }, [allStudents, watchedDepartments, watchedYear, batchData]);
  
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
        daysOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
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
        
        <Card>
          <CardHeader>
            <CardTitle>Student Filtering</CardTitle>
            <CardDescription>Filter which students are available for assignment below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
                control={form.control}
                name="departments"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Filter by Departments</FormLabel>
                        <FormDescription>Select one or more departments to see available students.</FormDescription>
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
                name="year"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Filter by Academic Year</FormLabel>
                    <FormDescription>Select a year to see available students.</FormDescription>
                    <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select an academic year" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {academicYearOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="studentIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assign Students</FormLabel>
              <FormDescription>
                Manually assign students to this batch or use the shareable link. The list is based on the filters above.
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
                  Assign Students ({watchedStudentIds.length} selected)
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
        
        <Card>
            <CardHeader><CardTitle>Batch Timings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <h3 className="font-medium mb-2">First Half</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="startTimeFirstHalf" render={({ field }) => ( <FormItem> <FormLabel>Start Time</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField control={form.control} name="endTimeFirstHalf" render={({ field }) => ( <FormItem> <FormLabel>End Time</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    </div>
                 </div>
                 <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2">Second Half (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="startTimeSecondHalf" render={({ field }) => ( <FormItem> <FormLabel>Start Time</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                        <FormField control={form.control} name="endTimeSecondHalf" render={({ field }) => ( <FormItem> <FormLabel>End Time</FormLabel> <FormControl><Input type="time" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
                    </div>
                 </div>
            </CardContent>
        </Card>

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
              Select students to add to this batch. The list shows all students unless filtered on the main form.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-hidden">
            {isLoadingStudents ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
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
                      No students found for the selected filter(s).
                    </p>
                  )}
                </div>
              </ScrollArea>
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
