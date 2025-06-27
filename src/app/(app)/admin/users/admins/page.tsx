
"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ShieldAlert, UserPlus, MoreHorizontal, Trash2, Edit, Loader2 } from "lucide-react";
import Link from "next/link";
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

export default function ManageAdminsPage() {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admins");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch admins" }));
        throw new Error(errorData.message);
      }
      const data: Admin[] = await response.json();
      setAdmins(data);
    } catch (error: any) {
      toast({
        title: "Error fetching admins",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [toast]);

  const openDeleteDialog = (admin: Admin) => {
    setAdminToDelete(admin);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;

    try {
      const response = await fetch(`/api/admins/${adminToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to delete admin' }));
        throw new Error(errorData.message || 'Failed to delete admin');
      }

      setAdmins(prevAdmins => prevAdmins.filter(a => a.id !== adminToDelete.id));
      toast({
        title: "Admin Deleted",
        description: `${adminToDelete.name} has been successfully deleted.`,
      });
    } catch (error: any) {
      toast({
        title: "Error Deleting Admin",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setAdminToDelete(null);
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
        <PageHeader title="Manage Administrators" icon={ShieldAlert} />
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Administrator List</CardTitle></CardHeader>
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
        title="Manage Administrators"
        description="View, add, or edit administrator accounts for the FSP system."
        icon={ShieldAlert}
        actions={
          <Button asChild>
            <Link href="/admin/users/create?role=admin">
              <UserPlus className="mr-2 h-4 w-4" /> Add New Admin
            </Link>
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Administrator List</CardTitle>
          <CardDescription>A list of all registered administrators. Pending accounts must be approved by Management.</CardDescription>
        </CardHeader>
        <CardContent>
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
                        <DropdownMenuItem disabled> {/* Edit functionality can be added later */}
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                         <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(admin)}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                          disabled={admin.status === "pending_approval"}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {admins.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                    No administrators found.
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
              This action cannot be undone. This will permanently delete the admin
              "{adminToDelete?.name}". Ensure this admin does not have critical responsibilities before deleting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAdminToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAdmin} className="bg-destructive hover:bg-destructive/90">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
