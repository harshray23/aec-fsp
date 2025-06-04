
import BatchCreationForm from "@/components/teacher/BatchCreationForm"; // Re-using the form
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

export default function AdminCreateBatchPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Create New Batch (Admin)"
        description="Set up a new batch for the Finishing School Program."
        icon={PlusCircle}
      />
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>New Batch Details</CardTitle>
          <CardDescription>Fill in the form below to create a new batch. The batch will be associated with your admin account as the creator/teacher for now.</CardDescription>
        </CardHeader>
        <CardContent>
          <BatchCreationForm redirectPathAfterSuccess="/admin/batches" />
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: "Create New Batch - AEC FSP",
};

