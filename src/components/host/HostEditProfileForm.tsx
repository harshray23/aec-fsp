
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
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { Host } from "@/lib/types";
import { Mail, Phone, Shield } from "lucide-react";

const editHostProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().optional().or(z.literal('')).refine(val => !val || /^\d{10,15}$/.test(val), {
    message: "Phone number must be 10-15 digits if provided.",
  }),
  whatsappNumber: z.string().optional().or(z.literal('')).refine(val => !val || /^\d{10,15}$/.test(val), {
    message: "WhatsApp number must be 10-15 digits if provided.",
  }),
});

export type EditHostProfileFormValues = z.infer<typeof editHostProfileSchema>;

interface HostEditProfileFormProps {
  hostData: Host;
  onSave: (values: EditHostProfileFormValues) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export default function HostEditProfileForm({ hostData, onSave, onCancel, isSaving }: HostEditProfileFormProps) {
  const form = useForm<EditHostProfileFormValues>({
    resolver: zodResolver(editHostProfileSchema),
    defaultValues: {
      name: hostData.name || "",
      phoneNumber: hostData.phoneNumber || "",
      whatsappNumber: hostData.whatsappNumber || "",
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
            <Input value={hostData.email || "N/A"} readOnly className="mt-1 bg-muted/30" />
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
            <FormLabel className="flex items-center text-muted-foreground"><Shield className="mr-2 h-4 w-4" />Role (Read-only)</FormLabel>
            <Input value="Management" readOnly className="mt-1 bg-muted/30" />
          </div>
          <div>
            <FormLabel className="flex items-center text-muted-foreground"><Shield className="mr-2 h-4 w-4" />Account Status (Read-only)</FormLabel>
            <Input value={hostData.status || "N/A"} readOnly className="mt-1 bg-muted/30 capitalize" />
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
