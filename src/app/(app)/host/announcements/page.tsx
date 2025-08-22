
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Edit, Trash2 } from "lucide-react";
import type { Announcement } from "@/lib/types";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const announcementSchema = z.object({
  message: z.string().min(10, "Announcement message must be at least 10 characters long.").max(500, "Announcement message must be 500 characters or less."),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

const LOCAL_STORAGE_KEY = "aecFspAnnouncements";

export default function HostAnnouncementsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      message: "",
    },
  });

  useEffect(() => {
    // Load announcements from localStorage on component mount
    try {
      const existingAnnouncementsRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const existingAnnouncements: Announcement[] = existingAnnouncementsRaw ? JSON.parse(existingAnnouncementsRaw) : [];
      setAnnouncements(existingAnnouncements.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error("Failed to load announcements from localStorage", error);
    }
  }, []);

  const saveAnnouncementsToLocalStorage = (updatedAnnouncements: Announcement[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedAnnouncements));
    setAnnouncements(updatedAnnouncements.sort((a, b) => b.timestamp - a.timestamp));
  };
  
  const handleEditClick = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    form.setValue("message", announcement.message);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to the top where the form is
  };

  const handleCancelEdit = () => {
    setEditingAnnouncement(null);
    form.reset({ message: "" });
  };
  
  const openDeleteDialog = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDelete = () => {
    if (!announcementToDelete) return;
    const updatedAnnouncements = announcements.filter(a => a.id !== announcementToDelete.id);
    saveAnnouncementsToLocalStorage(updatedAnnouncements);
    toast({ title: "Deleted", description: "The announcement has been deleted." });
    setIsDeleteDialogOpen(false);
    setAnnouncementToDelete(null);
  };

  const onSubmit = (values: AnnouncementFormValues) => {
    try {
      if (editingAnnouncement) {
        // Update existing announcement
        const updatedAnnouncements = announcements.map(a =>
          a.id === editingAnnouncement.id ? { ...a, message: values.message } : a
        );
        saveAnnouncementsToLocalStorage(updatedAnnouncements);
        toast({
          title: "Announcement Updated!",
          description: "The announcement has been successfully modified.",
        });
        handleCancelEdit();
      } else {
        // Create new announcement
        const newAnnouncement: Announcement = {
          id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          message: values.message,
          timestamp: Date.now(),
          sender: "Management",
        };
        const updatedAnnouncements = [newAnnouncement, ...announcements].slice(0, 10);
        saveAnnouncementsToLocalStorage(updatedAnnouncements);
        toast({
          title: "Announcement Sent!",
          description: "The announcement has been broadcasted.",
        });
        form.reset();
      }
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
        title="Send & Manage Announcements"
        description="Broadcast and manage messages for all users. They will appear as pop-ups on their dashboards."
        icon={Megaphone}
      />
      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{editingAnnouncement ? "Edit Announcement" : "Compose Announcement"}</CardTitle>
          <CardDescription>
            {editingAnnouncement 
              ? "Modify the message below and click 'Update Announcement'."
              : "Write your message below. It will be displayed to users when they visit their dashboard."
            }
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
              <div className="flex gap-2">
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Sending..." : (editingAnnouncement ? "Update Announcement" : "Send Announcement")}
                </Button>
                {editingAnnouncement && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                        Cancel Edit
                    </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Sent Announcements</CardTitle>
          <CardDescription>A list of the most recent announcements.</CardDescription>
        </CardHeader>
        <CardContent>
          {announcements.length > 0 ? (
            <ul className="space-y-4">
              {announcements.map((ann) => (
                <li key={ann.id} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Sent on: {format(new Date(ann.timestamp), "PPP p")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{ann.message}</p>
                  </div>
                  <div className="flex gap-2 self-end md:self-center">
                    <Button variant="outline" size="icon" onClick={() => handleEditClick(ann)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="icon" onClick={() => openDeleteDialog(ann)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground py-4">No announcements have been sent yet.</p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the announcement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
