
"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ShieldAlert, MoreHorizontal, Loader2, Trash2, UserCheck, UserX } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { Admin } from "@/lib/types";
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

export default function HostMonitorAdminsPage() {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [userToAction, setUserToAction] = useState<Admin | null>(null);

  const fetchAdmins = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admins');
        if (!res.ok) throw new Error("Failed to fetch admins.");
        setAdmins(await res.json());
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchAdmins();
  }, [toast]);
  
  const openDeleteDialog = (admin: Admin) => {
    setUserToAction(admin);
    setIsDeleteDialogOpen(true);
  };
  
  const openSuspendDialog = (admin: Admin) => {
    setUserToAction(admin);
    setIsSuspendDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!userToAction) return;
    try {
      const response = await fetch(`/api/admins/${userToAction.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete admin.");
      }
      toast({ title: "Success", description: `Admin ${userToAction.name} deleted.` });
      fetchAdmins(); // Refresh data
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
      const response = await fetch(`/api/admins/${userToAction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${newStatus === 'active' ? 'activate' : 'suspend'} admin.`);
      }
      toast({ title: "Success", description: `Admin ${userToAction.name} has been ${newStatus}.` });
      fetchAdmins();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSuspendDialogOpen(false);
      setUserToAction(null);
    }
  }

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
        title="Monitor Administrators (Host)"
        description="View all registered administrator accounts and their status."
        icon={ShieldAlert}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Administrator Accounts</CardTitle>
          <CardDescription>A list of all administrators in the FSP system.</CardDescription>
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
                <TableHead>Admin ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell className="truncate max-w-[100px]">{admin.id}</TableCell>
                  <TableCell className="font-medium">{admin.name}</TableCell>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>{admin.username || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(admin.status)}>
                       {admin.status?.replace("_", " ").split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || "Unknown"}
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
                            <DropdownMenuItem onClick={() => openSuspendDialog(admin)} className="cursor-pointer">
                                {admin.status === 'active' ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" />}
                                {admin.status === 'active' ? 'Suspend' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openDeleteDialog(admin)} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {admins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                    No administrators found in the system.
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
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the admin "{userToAction?.name}" and their authentication account. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToAction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete Admin</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {userToAction?.status === 'active' ? 'suspend' : 'activate'} the admin "{userToAction?.name}"? 
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
