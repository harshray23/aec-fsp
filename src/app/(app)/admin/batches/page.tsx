
"use client";
import React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookUser, Eye, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { batches as mockBatchesData, teachers as mockTeachers } from "@/lib/mockData"; // Import from central store
import { DEPARTMENTS } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
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
import { useToast } from "@/hooks/use-toast";

export default function AdminBatchOverviewPage() {
  const { toast } = useToast();
  // Use state for batches to allow re-rendering on delete
  const [batches, setBatches] = React.useState(mockBatchesData);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [batchToDeleteId, setBatchToDeleteId] = React.useState<string | null>(null);

  // Effect to update local state if mockBatchesData changes externally (e.g., after creation)
  React.useEffect(() => {
    setBatches(mockBatchesData);
  }, [mockBatchesData]);


  const getTeacherName = (teacherId: string) => {
    const teacher = mockTeachers.find(t => t.id === teacherId);
    if (teacher) return teacher.name;
    if (teacherId.startsWith("ADMIN_")) return "Admin (Self-Assigned)";
    return "N/A";
  };

  const getDepartmentLabel = (deptValue: string) => {
    const dept = DEPARTMENTS.find(d => d.value === deptValue);
    return dept ? dept.label : deptValue;
  }

  const openDeleteDialog = (batchId: string) => {
    setBatchToDeleteId(batchId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteBatch = async () => {
    if (!batchToDeleteId) return;

    try {
      const response = await fetch(`/api/batches/${batchToDeleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete batch' }));
        throw new Error(errorData.message || 'Failed to delete batch');
      }

      // Update local state to reflect deletion
      setBatches(prevBatches => prevBatches.filter(b => b.id !== batchToDeleteId));
      
      // Also ensure the global mockBatchesData is updated if other components might rely on it directly
      // This is more for mock data consistency; real apps would rely on server state.
      const globalBatchIndex = mockBatchesData.findIndex(b => b.id === batchToDeleteId);
      if (globalBatchIndex > -1) {
          mockBatchesData.splice(globalBatchIndex, 1);
          // The API handles unassigning students from mockStudents array
      }

      toast({
        title: "Batch Deleted",
        description: `Batch ${batchToDeleteId} has been successfully deleted.`,
      });
    } catch (error: any) {
      toast({
        title: "Error Deleting Batch",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setBatchToDeleteId(null);
    }
  };
  
  return (
    <div className="space-y-8">
      <PageHeader
        title="Batch Overview"
        description="View and manage all Finishing School Program batches."
        icon={BookUser}
        // "Create New Batch" button removed from here
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
                <TableHead>Topic</TableHead>
                <TableHead>Lead Teacher/Creator</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>{batch.id}</TableCell>
                  <TableCell className="font-medium">{batch.name}</TableCell>
                  <TableCell>{getDepartmentLabel(batch.department)}</TableCell>
                  <TableCell>{batch.topic}</TableCell>
                  <TableCell>{getTeacherName(batch.teacherId)}</TableCell>
                  <TableCell>{batch.studentIds.length}</TableCell>
                  <TableCell>
                    <Badge variant={batch.status === "Ongoing" ? "default" : batch.status === "Scheduled" ? "outline" : "secondary"}>
                      {batch.status || "Scheduled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/batches/edit/${batch.id}`} className="flex items-center cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                           <Link href={`/admin/batches/${batch.id}`} className="flex items-center cursor-pointer"> {/* Placeholder link */}
                                <Eye className="mr-2 h-4 w-4" /> View Details
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(batch.id)}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {batches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No batches found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the batch
              and unassign all students currently in it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBatchToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBatch} className="bg-destructive hover:bg-destructive/90">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

