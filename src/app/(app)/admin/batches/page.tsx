import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookUser, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Mock Data
const mockBatches = [
  { id: "B001", name: "FSP Batch Alpha - CSE 2024", department: "Computer Science", teacher: "Dr. Priya Singh", students: 45, status: "Ongoing" },
  { id: "B002", name: "FSP Batch Beta - IT 2024", department: "Information Technology", teacher: "Prof. Rahul Verma", students: 38, status: "Ongoing" },
  { id: "B003", name: "FSP Spring Cohort - ECE", department: "Electronics", teacher: "Ms. Anjali Desai", students: 52, status: "Scheduled" },
  { id: "B004", name: "Advanced Java - CSE Evening", department: "Computer Science", teacher: "Dr. Priya Singh", students: 30, status: "Completed" },
];

export default function AdminBatchOverviewPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Batch Overview"
        description="View all Finishing School Program batches across departments."
        icon={BookUser}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Batches</CardTitle>
          <CardDescription>A list of current, scheduled, and completed FSP batches.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Batch Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Lead Teacher</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockBatches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>{batch.id}</TableCell>
                  <TableCell className="font-medium">{batch.name}</TableCell>
                  <TableCell>{batch.department}</TableCell>
                  <TableCell>{batch.teacher}</TableCell>
                  <TableCell>{batch.students}</TableCell>
                  <TableCell>
                    <Badge variant={batch.status === "Ongoing" ? "default" : batch.status === "Scheduled" ? "outline" : "secondary"}>
                      {batch.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/batches/${batch.id}`}> {/* Placeholder link */}
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {mockBatches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No batches found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: "Batch Overview - AEC FSP Portal",
};
