
"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ServerCog, MoreHorizontal, Loader2, Trash2 } from "lucide-react";
import type { Host } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

export default function HostMonitorHostsPage() {
  const { toast } = useToast();
  const [hosts, setHosts] = useState<Host[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentHostId, setCurrentHostId] = useState<string | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [hostToDelete, setHostToDelete] = useState<Host | null>(null);

  const fetchHosts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/hosts');
        if (!res.ok) throw new Error("Failed to fetch management users.");
        setHosts(await res.json());
      } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
  
  useEffect(() => {
    fetchHosts();
    
    // Get current host from localStorage to prevent self-deletion
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user && user.role === 'host') {
            setCurrentHostId(user.id);
        }
    }
  }, [toast]);

  const openDeleteDialog = (host: Host) => {
    setHostToDelete(host);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDelete = async () => {
    if (!hostToDelete) return;
    try {
      const response = await fetch(`/api/hosts/${hostToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete host.");
      }
      toast({ title: "Success", description: `Host ${hostToDelete.name} has been deleted.` });
      fetchHosts(); // Refresh data
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setHostToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Monitor Management Users (Host)"
        description="View all registered management (host) accounts."
        icon={ServerCog}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Management Accounts</CardTitle>
          <CardDescription>A list of all management users in the FSP system.</CardDescription>
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
                <TableHead>Host ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hosts.map((host) => (
                <TableRow key={host.id}>
                  <TableCell className="truncate max-w-[100px]">{host.id}</TableCell>
                  <TableCell className="font-medium">{host.name}</TableCell>
                  <TableCell>{host.email}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={host.id === currentHostId}>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(host)} 
                              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                              disabled={host.id === currentHostId}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {hosts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                    No management users found in the system.
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
            <AlertDialogDescription>
              This will permanently delete the host user "{hostToDelete?.name}" and their authentication account. 
              This action cannot be undone. Ensure another host has access before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setHostToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete Host</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
