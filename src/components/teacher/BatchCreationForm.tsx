
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
  // We can add more fields later, e.g., maxStudents, startDate, endDate
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
    },
  });

  const onSubmit = async (values: BatchCreationFormValues) => {
    console.log("Batch creation form submitted:", values);
    toast({
      title: "Batch Creation Submitted (Simulated)",
      description: `Batch "${values.name}" for ${values.department} department is being created.`,
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
        {/* Add more fields here as needed, e.g., for student capacity, schedule, etc. */}
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating Batch..." : "Create Batch"}
        </Button>
      </form>
    </Form>
  );
}
