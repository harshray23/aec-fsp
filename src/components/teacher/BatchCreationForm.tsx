
"use client";

import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

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
import type { Teacher, Student } from "@/lib/types"; // Batch type removed, will come from API
import { ScrollArea } from "@/components/ui/scroll-area";

const daysOfWeekOptions = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
];

const batchCreationSchema = z.object({
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
  // selectedStudentIds now refers to student *document* IDs from Firestore
  selectedStudentIds: z.array(z.string()).optional(), 
}).refine(data => data.startTime < data.endTime, {
  message: "End time must be after start time.",
  path: ["endTime"],
});

type BatchCreationFormValues = z.infer<typeof batchCreationSchema>;

interface BatchCreationFormProps {
  redirectPathAfterSuccess?: string;
}

export default function BatchCreationForm({ redirectPathAfterSuccess }: BatchCreationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [allStudents, setAllStudents] = React.useState<Student[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = React.useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = React.useState(true);


  const form = useForm<BatchCreationFormValues>({
    resolver: zodResolver(batchCreationSchema),
    defaultValues: {
      name: "",
      department: "",
      topic: "",
      teacherId: "",
      startDate: undefined,
      daysOfWeek: [],
      startTime: "",
      endTime: "",
      roomNumber: "",
      selectedStudentIds: [],
    },
  });

  useEffect(() => {
    // Fetch teachers
    const fetchTeachers = async () => {
      setIsLoadingTeachers(true);
      try {
        const response = await fetch("/api/teachers"); // Assuming you'll create this API
        if (!response.ok) throw new Error("Failed to fetch teachers");
        const data = await response.json();
        setTeachers(data);
      } catch (error) {
        toast({ title: "Error", description: "Could not load teachers.", variant: "destructive" });
        console.error(error);
      } finally {
        setIsLoadingTeachers(false);
      }
    };
    
    // Fetch all students
    const fetchStudents = async () => {
        setIsLoadingStudents(true);
        try {
            const response = await fetch("/api/students"); // Assuming you'll create this API
            if (!response.ok) throw new Error("Failed to fetch students");
            const data = await response.json();
            setAllStudents(data);
        } catch (error) {
            toast({ title: "Error", description: "Could not load students for assignment.", variant: "destructive"});
            console.error(error);
        } finally {
            setIsLoadingStudents(false);
        }
    };

    fetchTeachers();
    fetchStudents();
  }, [toast]);

  const selectedDepartment = form.watch("department");

  const availableStudents = React.useMemo(() => {
    if (!selectedDepartment || isLoadingStudents) return [];
    return allStudents.filter(
      (student) => student.department === selectedDepartment && !student.batchId // only unassigned students
    );
  }, [selectedDepartment, allStudents, isLoadingStudents]);

  const onSubmit = async (values: BatchCreationFormValues) => {
    form.control.disabled = true; // Disable form while submitting
    try {
      const payload = {
        ...values,
        startDate: values.startDate.toISOString(), // Convert date to ISO string
      };

      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create batch. Unknown error.' }));
        throw new Error(errorData.message || 'Failed to create batch.');
      }
      
      await response.json(); // Contains the created batch
      
      toast({
          title: "Batch Creation Successful!",
          description: `Batch "${values.name}" for topic "${values.topic}" has been created.`,
      });
      form.reset();
      router.push(redirectPathAfterSuccess || "/admin/batches");
      router.refresh(); // To refetch batches on the overview page
    } catch (error: any) {
      toast({
        title: "Batch Creation Error",
        description: error.message || "Could not create batch.",
        variant: "destructive",
      });
    } finally {
       form.control.disabled = false;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Batch Name</FormLabel>
                <FormControl>
                    <Input placeholder="E.g., FSP-CSE-2024-A" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Topic / Module Name</FormLabel>
                <FormControl>
                    <Input placeholder="Enter the main topic for this batch" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Department</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {DEPARTMENTS.map(dept => (
                        <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="teacherId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Assign Teacher</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingTeachers || teachers.length === 0}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={isLoadingTeachers ? "Loading teachers..." : teachers.length === 0 ? "No teachers available" : "Select teacher"} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>{teacher.name} ({DEPARTMENTS.find(d=>d.value === teacher.department)?.label || teacher.department})</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                 {teachers.length === 0 && !isLoadingTeachers && <FormDescription className="text-destructive">Please add teachers to the system first.</FormDescription>}
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Start Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal md:w-1/2",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0,0,0,0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="daysOfWeek"
          render={() => (
            <FormItem>
              <FormLabel>Days of the Week</FormLabel>
              <FormDescription>Select the days this batch will be conducted.</FormDescription>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                {daysOfWeekOptions.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="daysOfWeek"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.label)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item.label])
                                  : field.onChange(
                                    (field.value || []).filter(
                                        (value) => value !== item.label
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {item.label}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
            control={form.control}
            name="roomNumber"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Room Number (Optional)</FormLabel>
                <FormControl>
                    <Input placeholder="E.g., R101, Lab 3B" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />

        {selectedDepartment && (
          <FormField
            control={form.control}
            name="selectedStudentIds"
            render={() => (
              <FormItem>
                <FormLabel>Assign Students from {DEPARTMENTS.find(d=>d.value === selectedDepartment)?.label || 'Selected Department'}</FormLabel>
                <FormDescription>
                  Select students to assign to this batch. Only students from the selected department not already in a batch are shown.
                  Student IDs here are their Firestore document IDs.
                </FormDescription>
                {isLoadingStudents ? <p>Loading students...</p> : 
                availableStudents.length > 0 ? (
                  <ScrollArea className="h-40 w-full rounded-md border p-4 mt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {availableStudents.map((student) => (
                        <FormField
                          key={student.id} // Use student.id (Firestore document ID)
                          control={form.control}
                          name="selectedStudentIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={student.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(student.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), student.id])
                                        : field.onChange(
                                          (field.value || []).filter(
                                              (value) => value !== student.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {student.name} ({student.studentId})
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2 p-4 border rounded-md">
                    No students available for assignment in the selected department, or all eligible students are already assigned.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isLoadingTeachers || (teachers.length === 0 && !form.getValues("teacherId"))}>
          {form.formState.isSubmitting ? "Creating Batch..." : "Create Batch"}
        </Button>
      </form>
    </Form>
  );
}
