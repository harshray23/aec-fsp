
"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
import { CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Student } from "@/lib/types";
import { Mail, Phone, Building, UserSquare2, Hash, ClipboardList } from "lucide-react";
import { DEPARTMENTS } from "@/lib/constants";

const editStudentProfileSchema = z.object({
  phoneNumber: z.string().optional().or(z.literal('')).refine(val => !val || /^\d{10,15}$/.test(val), {
    message: "Phone number must be 10-15 digits if provided.",
  }),
  whatsappNumber: z.string().optional().or(z.literal('')).refine(val => !val || /^\d{10,15}$/.test(val), {
    message: "WhatsApp number must be 10-15 digits if provided.",
  }),
});

export type EditStudentProfileFormValues = z.infer<typeof editStudentProfileSchema>;

interface StudentEditProfileFormProps {
  studentData: Partial<Student>;
  onSave: (values: EditStudentProfileFormValues) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export default function StudentEditProfileForm({ studentData, onSave, onCancel, isSaving }: StudentEditProfileFormProps) {
  const form = useForm<EditStudentProfileFormValues>({
    resolver: zodResolver(editStudentProfileSchema),
    defaultValues: {
      phoneNumber: studentData.phoneNumber || "",
      whatsappNumber: studentData.whatsappNumber || "",
    },
  });

  const departmentLabel = DEPARTMENTS.find(d => d.value === studentData?.department)?.label || studentData?.department || "N/A";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)}>
        <CardHeader className="p-0 mb-6">
            <CardTitle>Edit Your Profile</CardTitle>
            <CardDescription>Update your contact information below. Other details are read-only.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <FormLabel className="flex items-center text-muted-foreground text-sm"><Mail className="mr-2 h-4 w-4" />Email (Read-only)</FormLabel>
                    <Input value={studentData.email || 'N/A'} readOnly className="mt-1 bg-muted/30" />
                </div>
                <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center text-sm"><Phone className="mr-2 h-4 w-4 text-muted-foreground" />Phone Number</FormLabel>
                        <FormControl>
                        <Input type="tel" placeholder="Your 10-digit phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="whatsappNumber"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center text-sm"><Phone className="mr-2 h-4 w-4 text-muted-foreground" />WhatsApp Number</FormLabel>
                        <FormControl>
                        <Input type="tel" placeholder="Your 10-digit WhatsApp number" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <div>
                    <FormLabel className="flex items-center text-muted-foreground text-sm"><Building className="mr-2 h-4 w-4" />Department (Read-only)</FormLabel>
                    <Input value={departmentLabel} readOnly className="mt-1 bg-muted/30" />
                </div>
                 <div>
                    <FormLabel className="flex items-center text-muted-foreground text-sm"><ClipboardList className="mr-2 h-4 w-4" />Section (Read-only)</FormLabel>
                    <Input value={studentData.section || 'N/A'} readOnly className="mt-1 bg-muted/30" />
                </div>
                <div>
                    <FormLabel className="flex items-center text-muted-foreground text-sm"><UserSquare2 className="mr-2 h-4 w-4" />Roll No. (Read-only)</FormLabel>
                    <Input value={studentData.rollNumber || 'N/A'} readOnly className="mt-1 bg-muted/30" />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
                Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </CardContent>
      </form>
    </Form>
  );
}
