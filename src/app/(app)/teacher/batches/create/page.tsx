
import BatchCreationForm from "@/components/teacher/BatchCreationForm";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

export default function CreateBatchPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Create New Batch"
        description="Set up a new batch for the Finishing School Program."
        icon={PlusCircle}
      />
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>New Batch Details</CardTitle>
          <CardDescription>Fill in the form below to create a new batch.</CardDescription>
        </CardHeader>
        <CardContent>
          <BatchCreationForm />
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: "Create New Batch - AEC FSP Portal",
};
