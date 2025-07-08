
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import BatchEditForm from "@/components/admin/BatchEditForm";
import { PlusCircle } from "lucide-react";

export default function AdminCreateBatchPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Create New Batch"
        description="Fill out all the details below to create a new batch in a single step."
        icon={PlusCircle}
      />
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>New Batch Details</CardTitle>
          <CardDescription>Configure the new batch including its topic, schedule, and assigned teachers.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* No batchData is passed, so the form will be in 'create' mode */}
          <BatchEditForm redirectPathAfterSuccess="/admin/batches" />
        </CardContent>
      </Card>
    </div>
  );
}
