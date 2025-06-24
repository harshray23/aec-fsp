
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DEPARTMENTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const quickBatchSchema = z.object({
  name: z.string().min(3, "Batch name must be at least 3 characters long."),
  department: z.string().min(1, "Please select a department."),
});

type QuickBatchFormValues = z.infer<typeof quickBatchSchema>;

export default function AdminCreateBatchPage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<QuickBatchFormValues>({
    resolver: zodResolver(quickBatchSchema),
    defaultValues: {
      name: "",
      department: "",
    },
  });

  const onSubmit = async (values: QuickBatchFormValues) => {
    try {
      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create batch.");
      }

      toast({
        title: "Batch Created",
        description: `Batch "${result.batch.name}" has been created. Now add the remaining details.`,
      });

      // Redirect to the edit page for the newly created batch
      router.push(`/admin/batches/edit/${result.batch.id}`);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Create New Batch (Step 1 of 2)"
        description="Start by selecting a department and giving the batch a name."
        icon={PlusCircle}
      />
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Initial Batch Details</CardTitle>
          <CardDescription>After this step, you will be taken to a page to add teachers, students, and schedule details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
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
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating..." : "Create and Continue to Step 2"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
