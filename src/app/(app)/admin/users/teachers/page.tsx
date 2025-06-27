
"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Briefcase, UserPlus, MoreHorizontal, Trash2, Edit, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DEPARTMENTS } from "@/lib/constants";
import type { Teacher } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
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

export default function ManageTeachersPage() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      // Fetch all teachers, including pending or rejected for admin view.
      // The API defaults to all if no status is provided.
      const response = await fetch("/api/teachers"); 
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch teachers" }));
        throw new Error(errorData.message);
      }
      const data: Teacher[] = await response.json();
      setTeachers(data);
    } catch (error: any) {
      toast({
        title: "Error fetching teachers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [toast]);

  const getDepartmentLabel = (deptValue?: string) => {
    if (!deptValue) return "N/A";
    const dept = DEPARTMENTS.find(d => d.value === deptValue);
    return dept ? dept.label : deptValue;
  };

  const openDeleteDialog = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;

    try {
      const response = await fetch(`/api/teachers/${teacherToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete teacher' }));
        throw new Error(errorData.message || 'Failed to delete teacher');
      }

      setTeachers(prevTeachers => prevTeachers.filter(t => t.id !== teacherToDelete.id));
      toast({
        title: "Teacher Deleted",
        description: `${teacherToDelete.name} has been successfully deleted.`,
      });
    } catch (error: any) {
      toast({
        title: "Error Deleting Teacher",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setTeacherToDelete(null);
    }
  };

  const getStatusVariant = (status?: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "active":
        return "default";
      case "pending_approval":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Manage Teachers" icon={Briefcase} />
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Teacher List</CardTitle></CardHeader>
          <CardContent className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manage Teachers"
        description="View, add, or edit teacher accounts for the FSP."
        icon={Briefcase}
        actions={
          <Button asChild>
            <Link href="/admin/users/create?role=teacher">
              <UserPlus className="mr-2 h-4 w-4" /> Add New Teacher
            </Link>
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Teacher List</CardTitle>
          <CardDescription>A list of all registered teachers in the system. Pending users must be approved by Management.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="truncate max-w-[100px]">{teacher.id}</TableCell>
                  <TableCell className="font-medium">{teacher.name}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{getDepartmentLabel(teacher.department)}</TableCell>
                  <TableCell>{teacher.username || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(teacher.status)}>
                      {teacher.status?.replace("_", " ").split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || "Unknown"}
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
                        <DropdownMenuItem disabled> {/* Edit functionality can be added later */}
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(teacher)}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                          disabled={teacher.status === "pending_approval"} // Maybe don't allow deleting pending users from here
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {teachers.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                    No teachers found.
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
              This action cannot be undone. This will permanently delete the teacher
              "{teacherToDelete?.name}" and unassign them from any batches.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTeacherToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTeacher} className="bg-destructive hover:bg-destructive/90">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
