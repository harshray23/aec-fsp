
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Megaphone } from "lucide-react";
import type { Announcement } from "@/lib/types";

const announcementSchema = z.object({
  message: z.string().min(10, "Announcement message must be at least 10 characters long.").max(500, "Announcement message must be 500 characters or less."),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

const LOCAL_STORAGE_KEY = "aecFspAnnouncements";

export default function HostAnnouncementsPage() {
  const { toast } = useToast();
  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      message: "",
    },
  });

  const onSubmit = (values: AnnouncementFormValues) => {
    try {
      const newAnnouncement: Announcement = {
        id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        message: values.message,
        timestamp: Date.now(),
        sender: "Management",
      };

      const existingAnnouncementsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const existingAnnouncements: Announcement[] = existingAnnouncementsRaw ? JSON.parse(existingAnnouncementsRaw) : [];
      
      // Keep a limited number of recent announcements if desired, e.g., last 10
      const updatedAnnouncements = [newAnnouncement, ...existingAnnouncements].slice(0, 10);
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedAnnouncements));

      toast({
        title: "Announcement Sent!",
        description: "The announcement has been broadcasted.",
      });
      form.reset();
    } catch (error) {
      console.error("Failed to send announcement:", error);
      toast({
        title: "Error",
        description: "Could not send the announcement. Please check console for details.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Send Announcements"
        description="Broadcast messages to Students, Teachers, and Admins. They will appear as pop-ups on their dashboards."
        icon={Megaphone}
      />
      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Compose Announcement</CardTitle>
          <CardDescription>
            Write your message below. It will be displayed to users when they visit their dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your announcement here... (e.g., System maintenance tonight at 10 PM)"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Sending..." : "Send Announcement"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
