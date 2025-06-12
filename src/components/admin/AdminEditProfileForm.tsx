
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Admin } from "@/lib/types";
import { Mail, Phone, BadgePercent, Shield } from "lucide-react";

const editAdminProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().optional().or(z.literal('')).refine(val => !val || /^\d{10,15}$/.test(val), {
    message: "Phone number must be 10-15 digits if provided.",
  }),
  whatsappNumber: z.string().optional().or(z.literal('')).refine(val => !val || /^\d{10,15}$/.test(val), {
    message: "WhatsApp number must be 10-15 digits if provided.",
  }),
  // Email and username are typically not directly editable by the user or involve complex verification
  // password change would be a separate flow
});

export type EditAdminProfileFormValues = z.infer<typeof editAdminProfileSchema>;

interface AdminEditProfileFormProps {
  adminData: Admin;
  onSave: (values: EditAdminProfileFormValues) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export default function AdminEditProfileForm({ adminData, onSave, onCancel, isSaving }: AdminEditProfileFormProps) {
  const form = useForm<EditAdminProfileFormValues>({
    resolver: zodResolver(editAdminProfileSchema),
    defaultValues: {
      name: adminData.name || "",
      phoneNumber: adminData.phoneNumber || "",
      whatsappNumber: adminData.whatsappNumber || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle>Edit Your Profile</CardTitle>
          <CardDescription>Update your personal information below.</CardDescription>
        </CardHeader>
        <CardContent className="p-0 space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div>
            <FormLabel className="flex items-center text-muted-foreground"><Mail className="mr-2 h-4 w-4" />Email (Read-only)</FormLabel>
            <Input value={adminData.email || "N/A"} readOnly className="mt-1 bg-muted/30" />
          </div>

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" />Phone Number</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="Your 10-15 digit phone number" {...field} />
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
                <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" />WhatsApp Number</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="Your 10-15 digit WhatsApp number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <FormLabel className="flex items-center text-muted-foreground"><BadgePercent className="mr-2 h-4 w-4" />Username (Read-only)</FormLabel>
            <Input value={adminData.username || 'Not Assigned'} readOnly className="mt-1 bg-muted/30" />
          </div>
          
          <div>
            <FormLabel className="flex items-center text-muted-foreground"><Shield className="mr-2 h-4 w-4" />Role (Read-only)</FormLabel>
            <Input value={adminData.role || 'N/A'} readOnly className="mt-1 bg-muted/30" />
          </div>
          <div>
              <FormLabel className="flex items-center text-muted-foreground"><Shield className="mr-2 h-4 w-4" />Account Status (Read-only)</FormLabel>
              <Input value={adminData.status || "N/A"} readOnly className="mt-1 bg-muted/30 capitalize" />
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
