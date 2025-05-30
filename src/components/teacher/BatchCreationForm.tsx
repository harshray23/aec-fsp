
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter, usePathname } from "next/navigation";
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
import { batches as mockBatches, getMockCurrentUser } from "@/lib/mockData"; // Import mutable arrays
import type { Batch } from "@/lib/types";

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
  startDate: z.date({ required_error: "Start date is required." }),
  daysOfWeek: z.array(z.string()).refine(value => value.length > 0, {
    message: "Please select at least one day of the week.",
  }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time (HH:MM)."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid end time (HH:MM)."),
}).refine(data => data.startTime < data.endTime, {
  message: "End time must be after start time.",
  path: ["endTime"],
});

type BatchCreationFormValues = z.infer<typeof batchCreationSchema>;

export default function BatchCreationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const pathname = usePathname();

  const form = useForm<BatchCreationFormValues>({
    resolver: zodResolver(batchCreationSchema),
    defaultValues: {
      name: "",
      department: "",
      topic: "",
      startDate: undefined,
      daysOfWeek: [],
      startTime: "",
      endTime: "",
    },
  });

  const onSubmit = async (values: BatchCreationFormValues) => {
    const currentUser = getMockCurrentUser(pathname); // Get current user at submit time
    console.log("Batch creation form submitted:", values);
    console.log("Current user for batch creation:", currentUser);


    const newBatch: Batch = {
      id: `BATCH_${Date.now()}`,
      name: values.name,
      department: values.department,
      topic: values.topic,
      startDate: values.startDate.toISOString(),
      daysOfWeek: values.daysOfWeek,
      startTime: values.startTime,
      endTime: values.endTime,
      teacherId: currentUser.id, // Use current user's ID
      studentIds: [],
      status: "Scheduled",
    };

    mockBatches.push(newBatch);
    console.log("Batches after adding new one:", mockBatches);
    
    toast({
        title: "Batch Creation Successful!",
        description: `Batch "${values.name}" for topic "${values.topic}" on ${values.daysOfWeek.join(', ')} starting ${format(values.startDate, "PPP")} has been created.`,
    });
    form.reset();
    router.push("/teacher/batches/manage"); 
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topic / Module Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter the main topic or module for this batch" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                        "w-full pl-3 text-left font-normal",
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
                      date < new Date(new Date().setHours(0,0,0,0)) // Disable past dates
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Days of the Week</FormLabel>
              <FormDescription>Select the days this batch will be conducted.</FormDescription>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                {daysOfWeekOptions.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="daysOfWeek"
                    render={({ field: innerField }) => { // Use innerField to avoid conflict
                      return (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={innerField.value?.includes(item.label)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? innerField.onChange([...(innerField.value || []), item.label])
                                  : innerField.onChange(
                                    (innerField.value || []).filter(
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating Batch..." : "Create Batch"}
        </Button>
      </form>
    </Form>
  );
}
