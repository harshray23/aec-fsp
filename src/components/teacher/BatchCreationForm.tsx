
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { DEPARTMENTS } from "@/lib/constants";

const batchCreationSchema = z.object({
  name: z.string().min(3, "Batch name must be at least 3 characters"),
  department: z.string().min(1, "Department is required"),
  topic: z.string().min(2, "Topic must be at least 2 characters"),
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

  const form = useForm<BatchCreationFormValues>({
    resolver: zodResolver(batchCreationSchema),
    defaultValues: {
      name: "",
      department: "",
      topic: "",
      startTime: "",
      endTime: "",
    },
  });

  const onSubmit = async (values: BatchCreationFormValues) => {
    console.log("Batch creation form submitted:", values);
    toast({
      title: "Batch Creation Submitted (Simulated)",
      description: `Batch "${values.name}" for topic "${values.topic}" from ${values.startTime} to ${values.endTime} in ${values.department} department is being created.`,
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
        title: "Batch Creation Successful!",
        description: `Batch "${values.name}" has been created.`,
    });
    form.reset();
    // Optionally, redirect to the manage batches page or the new batch's detail page
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
