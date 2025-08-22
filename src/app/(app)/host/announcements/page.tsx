
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
import { Megaphone, Edit, Trash2, Loader2 } from "lucide-react";
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

export default function HostAnnouncementsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      message: "",
    },
  });

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/announcements');
      if (!response.ok) {
        throw new Error('Failed to fetch announcements.');
      }
      const data: Announcement[] = await response.json();
      setAnnouncements(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [toast]);

  const handleEditClick = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    form.setValue("message", announcement.message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingAnnouncement(null);
    form.reset({ message: "" });
  };
  
  const openDeleteDialog = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!announcementToDelete) return;
    try {
      const response = await fetch(`/api/announcements/${announcementToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete announcement.');
      toast({ title: "Deleted", description: "The announcement has been deleted." });
      fetchAnnouncements(); // Refresh the list
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
    }
  };

  const onSubmit = async (values: AnnouncementFormValues) => {
    try {
      let response;
      if (editingAnnouncement) {
        // Update existing announcement
        response = await fetch(`/api/announcements/${editingAnnouncement.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: values.message }),
        });
        if (!response.ok) throw new Error('Failed to update announcement.');
        toast({ title: "Announcement Updated!", description: "The announcement has been successfully modified." });
      } else {
        // Create new announcement
        response = await fetch('/api/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: values.message, sender: "Management" }),
        });
        if (!response.ok) throw new Error('Failed to send announcement.');
        toast({ title: "Announcement Sent!", description: "The announcement has been broadcasted." });
      }
      
      form.reset();
      setEditingAnnouncement(null);
      fetchAnnouncements(); // Refresh the list

    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
          {isLoading ? (
             <div className="flex justify-center items-center h-24"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : announcements.length > 0 ? (
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
