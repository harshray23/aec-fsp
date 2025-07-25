
"use client";
import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookUser, Users, MoreHorizontal, Trash2, Edit, Home, Link as LinkIcon, Clipboard } from "lucide-react"; 
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DEPARTMENTS } from "@/lib/constants";
import type { Batch, Teacher } from "@/lib/types";
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
import { isAfter, startOfDay } from "date-fns";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function AdminBatchOverviewPage() {
  const { toast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [batchToDeleteId, setBatchToDeleteId] = React.useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const batchesRes = await fetch('/api/batches');
        if (!batchesRes.ok) throw new Error('Failed to fetch batches');
        const batchesData: Batch[] = await batchesRes.json();
        setBatches(batchesData);

        const teachersRes = await fetch('/api/teachers'); // Assuming API exists
        if (!teachersRes.ok) throw new Error('Failed to fetch teachers');
        const teachersData: Teacher[] = await teachersRes.json();
        setTeachers(teachersData);

      } catch (error: any) {
        toast({
          title: "Error fetching data",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);


  const getTeacherNames = (teacherIds: string[]) => {
    if (!teacherIds || teacherIds.length === 0) return "N/A";
    const names = teacherIds.map(id => {
        const teacher = teachers.find(t => t.id === id);
        return teacher ? teacher.name : null;
    }).filter(Boolean);

    if (names.length === 0) return "N/A";
    return names.join(", ");
  };

  const getDepartmentLabels = (deptValues?: string[]) => {
    if (!deptValues || deptValues.length === 0) return "N/A";
    const labels = deptValues.map(value => {
        const dept = DEPARTMENTS.find(d => d.value === value);
        return dept ? dept.label : value;
    });
    if (labels.length > 2) {
      return `${labels.slice(0, 2).join(', ')} +${labels.length - 2} more`;
    }
    return labels.join(', ');
  }

  const getDynamicStatus = (batch: Batch): "Scheduled" | "Ongoing" | "Completed" => {
    if (batch.status === "Completed") {
      return "Completed";
    }
    try {
      const today = startOfDay(new Date());
      const startDate = startOfDay(new Date(batch.startDate));
      const endDate = startOfDay(new Date(batch.endDate));

      if (isAfter(today, endDate)) {
        return "Completed";
      }
      
      if (isAfter(today, startDate) || today.getTime() === startDate.getTime()) {
        return "Ongoing";
      }
    } catch (e) {
      console.error("Invalid date for batch:", batch.name, batch.startDate, batch.endDate);
      return "Scheduled";
    }
    return "Scheduled";
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

      setBatches(prevBatches => prevBatches.filter(b => b.id !== batchToDeleteId));
      
      toast({
        title: "Batch Deleted",
        description: `Batch with ID ${batchToDeleteId} has been successfully deleted.`,
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
  
  const handleCopyLink = (batchId: string) => {
    const link = `${window.location.origin}/enroll/${batchId}`;
    navigator.clipboard.writeText(link).then(() => {
        toast({ title: "Copied!", description: "Enrollment link copied to clipboard." });
    });
  };

  const openDeleteDialog = (batchId: string) => {
    setBatchToDeleteId(batchId);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Batch Overview" icon={BookUser} />
        <Card className="shadow-lg">
          <CardHeader><CardTitle>All Batches</CardTitle></CardHeader>
          <CardContent className="flex justify-center items-center h-64">
            <LoadingSpinner size={60} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Batch Overview"
        description="View and manage all Finishing School Program batches."
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
                <TableHead>Batch Name</TableHead>
                <TableHead>Departments</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Teachers</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.name}</TableCell>
                  <TableCell>{getDepartmentLabels(batch.departments)}</TableCell>
                  <TableCell>{batch.topic}</TableCell>
                  <TableCell>{getTeacherNames(batch.teacherIds)}</TableCell>
                  <TableCell>{batch.studentIds.length}</TableCell>
                  <TableCell>
                     {(() => {
                        const status = getDynamicStatus(batch);
                        return (
                            <Badge variant={status === "Ongoing" ? "default" : status === "Scheduled" ? "outline" : "secondary"}>
                              {status}
                            </Badge>
                        );
                    })()}
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
                            <Edit className="mr-2 h-4 w-4" /> Configure Batch
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyLink(batch.id)} className="cursor-pointer">
                          <LinkIcon className="mr-2 h-4 w-4" /> Copy Enrollment Link
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
                  <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
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
              and unassign all students currently in it from this batch.
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
