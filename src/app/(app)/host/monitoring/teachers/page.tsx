
"use client"; 

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Briefcase, MoreHorizontal, Users, Loader2, Trash2, UserCheck, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DEPARTMENTS } from "@/lib/constants";
import type { Teacher } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
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

export default function HostMonitorTeachersPage() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [userToAction, setUserToAction] = useState<Teacher | null>(null);

  const fetchTeachers = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/teachers');
        if (!res.ok) throw new Error("Failed to fetch teachers.");
        setTeachers(await res.json());
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchTeachers();
  }, [toast]);

  const openDeleteDialog = (teacher: Teacher) => {
    setUserToAction(teacher);
    setIsDeleteDialogOpen(true);
  };
  
  const openSuspendDialog = (teacher: Teacher) => {
    setUserToAction(teacher);
    setIsSuspendDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!userToAction) return;
    try {
      const response = await fetch(`/api/teachers/${userToAction.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete teacher.");
      }
      toast({ title: "Success", description: `Teacher ${userToAction.name} deleted.` });
      fetchTeachers(); // Refresh data
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setUserToAction(null);
    }
  };

  const handleToggleSuspend = async () => {
    if (!userToAction) return;
    const newStatus = userToAction.status === 'active' ? 'suspended' : 'active';
    try {
      const response = await fetch(`/api/teachers/${userToAction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${newStatus === 'active' ? 'activate' : 'suspend'} teacher.`);
      }
      toast({ title: "Success", description: `Teacher ${userToAction.name} has been ${newStatus}.` });
      fetchTeachers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSuspendDialogOpen(false);
      setUserToAction(null);
    }
  }

  const getDepartmentLabel = (deptValue?: string) => {
    if (!deptValue) return "N/A";
    const dept = DEPARTMENTS.find(d => d.value === deptValue);
    return dept ? dept.label : deptValue;
  };

  const getStatusVariant = (status?: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "active": return "default";
      case "pending_approval": return "secondary";
      case "suspended": return "outline";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Monitor Teachers (Host)"
        description="View all registered teacher accounts and their status."
        icon={Users}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Teacher Accounts</CardTitle>
          <CardDescription>A list of all teachers in the FSP system.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
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
                            <DropdownMenuItem onClick={() => openSuspendDialog(teacher)} className="cursor-pointer">
                                {teacher.status === 'active' ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                                {teacher.status === 'active' ? 'Suspend' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDeleteDialog(teacher)} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {teachers.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                    No teachers found in the system.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the teacher "{userToAction?.name}" and their authentication account. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToAction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete Teacher</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {userToAction?.status === 'active' ? 'suspend' : 'activate'} the teacher "{userToAction?.name}"? 
              {userToAction?.status === 'active' ? ' Suspending will prevent them from logging in.' : ' Activating will restore their login access.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToAction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleSuspend}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
