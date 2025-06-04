
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Announcement } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface AnnouncementDialogProps {
  announcement: Announcement | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AnnouncementDialog({ announcement, isOpen, onClose }: AnnouncementDialogProps) {
  if (!announcement) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Announcement from {announcement.sender}</DialogTitle>
          <DialogDescription>
            Posted on: {format(new Date(announcement.timestamp), "PPP p")}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] my-4">
          <p className="text-sm whitespace-pre-wrap p-1">{announcement.message}</p>
        </ScrollArea>
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
