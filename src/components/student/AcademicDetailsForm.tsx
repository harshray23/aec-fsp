
"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AcademicDetails } from "@/lib/types";

const academicSchema = z.object({
  class10: z.object({
    board: z.string().optional(),
    percentage: z.coerce.number().min(0).max(100, "Must be between 0 and 100").optional().or(z.literal("")),
  }).optional(),
  class12: z.object({
    board: z.string().optional(),
    percentage: z.coerce.number().min(0).max(100, "Must be between 0 and 100").optional().or(z.literal("")),
  }).optional(),
  semesters: z.object({
    sem1: z.coerce.number().min(0).max(10, "Must be between 0 and 10").optional().or(z.literal("")),
    sem2: z.coerce.number().min(0).max(10, "Must be between 0 and 10").optional().or(z.literal("")),
    sem3: z.coerce.number().min(0).max(10, "Must be between 0 and 10").optional().or(z.literal("")),
    sem4: z.coerce.number().min(0).max(10, "Must be between 0 and 10").optional().or(z.literal("")),
    sem5: z.coerce.number().min(0).max(10, "Must be between 0 and 10").optional().or(z.literal("")),
    sem6: z.coerce.number().min(0).max(10, "Must be between 0 and 10").optional().or(z.literal("")),
    sem7: z.coerce.number().min(0).max(10, "Must be between 0 and 10").optional().or(z.literal("")),
    sem8: z.coerce.number().min(0).max(10, "Must be between 0 and 10").optional().or(z.literal("")),
  }).optional(),
});

export type AcademicFormValues = z.infer<typeof academicSchema>;

interface AcademicDetailsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: AcademicFormValues) => Promise<void>;
  isSaving: boolean;
  initialData?: AcademicDetails;
}

export default function AcademicDetailsForm({ isOpen, onClose, onSave, isSaving, initialData }: AcademicDetailsFormProps) {
  const form = useForm<AcademicFormValues>({
    resolver: zodResolver(academicSchema),
    defaultValues: {
      class10: { board: initialData?.class10?.board || "", percentage: initialData?.class10?.percentage || "" },
      class12: { board: initialData?.class12?.board || "", percentage: initialData?.class12?.percentage || "" },
      semesters: {
        sem1: initialData?.semesters?.sem1 || "",
        sem2: initialData?.semesters?.sem2 || "",
        sem3: initialData?.semesters?.sem3 || "",
        sem4: initialData?.semesters?.sem4 || "",
        sem5: initialData?.semesters?.sem5 || "",
        sem6: initialData?.semesters?.sem6 || "",
        sem7: initialData?.semesters?.sem7 || "",
        sem8: initialData?.semesters?.sem8 || "",
      }
    },
  });

  const onSubmit = (values: AcademicFormValues) => {
    // Clean up empty strings from optional number fields before saving
    const cleanedValues = JSON.parse(JSON.stringify(values), (key, value) => {
        if (value === "") return undefined;
        return value;
    });
    onSave(cleanedValues);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add / Edit Academic Details</DialogTitle>
          <DialogDescription>
            Enter your academic performance details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ScrollArea className="h-[60vh] p-1">
              <div className="space-y-6 p-4">
                <Card>
                  <CardHeader><CardTitle>Class 10th</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="class10.board" render={({ field }) => ( <FormItem><FormLabel>Board</FormLabel><FormControl><Input placeholder="e.g., CBSE, ICSE" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="class10.percentage" render={({ field }) => ( <FormItem><FormLabel>Percentage (%)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 85.5" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Class 12th</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="class12.board" render={({ field }) => ( <FormItem><FormLabel>Board</FormLabel><FormControl><Input placeholder="e.g., WBCHSE" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="class12.percentage" render={({ field }) => ( <FormItem><FormLabel>Percentage (%)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 88.2" {...field} /></FormControl><FormMessage /></FormItem> )} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Semester SGPA</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                      <FormField
                        key={`sem${sem}`}
                        control={form.control}
                        name={`semesters.sem${sem}` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Semester {sem}</FormLabel>
                            <FormControl><Input type="number" step="0.01" placeholder="SGPA" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
