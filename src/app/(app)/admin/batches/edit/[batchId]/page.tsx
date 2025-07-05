
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BatchEditForm from "@/components/admin/BatchEditForm";
import { Edit, Loader2 } from "lucide-react";
import type { Batch } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function AdminEditBatchPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.batchId as string;
  const { toast } = useToast();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);


  const fetchBatch = async () => {
    if (!batchId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/batches/${batchId}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast({ title: "Error", description: "Batch not found.", variant: "destructive" });
          router.push("/admin/batches"); // Redirect if batch not found
        } else {
          throw new Error(`Failed to fetch batch: ${response.statusText}`);
        }
        return;
      }
      const data: Batch = await response.json();
      setBatch(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatch();
  }, [batchId, toast, router]);

  const handleMarkAsCompleted = async () => {
    if (!batch) return;
    setIsCompleting(true);
    try {
        const response = await fetch(`/api/batches/${batch.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Completed' }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to mark as completed.');
        }

        const result = await response.json();
        setBatch(result.batch); // Update local state with the returned batch data
        toast({ title: 'Success', description: 'Batch has been marked as completed.' });

    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
        setIsCompleting(false);
        setIsCompleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Loading Batch Details..." icon={Loader2} />
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardHeader><CardTitle>Edit Batch</CardTitle></CardHeader>
          <CardContent className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!batch) {
    return (
       <div className="space-y-8">
        <PageHeader title="Batch Not Found" icon={Edit} />
        <Card className="max-w-2xl mx-auto shadow-lg">
          <CardContent>
            <p>The batch you are trying to edit could not be found. It might have been deleted.</p>
            <Button onClick={() => router.push("/admin/batches")} className="mt-4">Back to Batches</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Edit Batch: ${batch.name}`}
        description="Modify the details of the existing batch."
        icon={Edit}
      />
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Batch Details</CardTitle>
          <CardDescription>Update the form below to edit the batch.</CardDescription>
        </CardHeader>
        <CardContent>
          <BatchEditForm batchData={batch} redirectPathAfterSuccess="/admin/batches" />
        </CardContent>
      </Card>
      
      <Card className="max-w-2xl mx-auto shadow-lg border-amber-500">
          <CardHeader>
              <CardTitle>Batch Actions</CardTitle>
              <CardDescription>Perform one-off actions on this batch.</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="flex items-center justify-between">
                  <div>
                      <h4 className="font-semibold">Mark as Completed</h4>
                      <p className="text-sm text-muted-foreground">This will permanently set the batch status to "Completed". This action cannot be undone.</p>
                  </div>
                  <Button
                      variant="destructive"
                      onClick={() => setIsCompleteDialogOpen(true)}
                      disabled={batch.status === 'Completed' || isCompleting}
                  >
                      {isCompleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      {batch.status === 'Completed' ? 'Already Completed' : 'Mark as Completed'}
                  </Button>
              </div>
          </CardContent>
      </Card>

      <AlertDialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently mark the batch as "Completed". Students will no longer see it on their active dashboard and attendance cannot be marked. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkAsCompleted} disabled={isCompleting}>
              {isCompleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
