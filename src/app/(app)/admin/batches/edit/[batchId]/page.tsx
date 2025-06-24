
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

export default function AdminEditBatchPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.batchId as string;
  const { toast } = useToast();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (batchId) {
      const fetchBatch = async () => {
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
      fetchBatch();
    }
  }, [batchId, toast, router]);

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
    // This case should ideally be handled by redirection in useEffect,
    // but as a fallback:
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
    </div>
  );
}
