
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserCheck, UserX, ShieldQuestion, Briefcase, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Admin, Teacher } from "@/lib/types";
import { USER_ROLES, DEPARTMENTS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type PendingUser = (Admin | Teacher) & { role: 'admin' | 'teacher' };

export default function HostUserApprovalPage() {
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allActiveUsers, setAllActiveUsers] = useState<(Admin|Teacher)[]>([]);
  
  const [selectedUserForApproval, setSelectedUserForApproval] = useState<PendingUser | null>(null);
  const [userToReject, setUserToReject] = useState<PendingUser | null>(null);
  const [assignedUsername, setAssignedUsername] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const [pendingAdminsRes, pendingTeachersRes, activeAdminsRes, activeTeachersRes] = await Promise.all([
        fetch("/api/admins?status=pending_approval"),
        fetch("/api/teachers?status=pending_approval"),
        fetch("/api/admins?status=active"),
        fetch("/api/teachers?status=active"),
      ]);

      if (!pendingAdminsRes.ok || !pendingTeachersRes.ok || !activeAdminsRes.ok || !activeTeachersRes.ok) {
        throw new Error(`Failed to fetch user data`);
      }

      const pendingAdmins: Admin[] = await pendingAdminsRes.json();
      const pendingTeachers: Teacher[] = await pendingTeachersRes.json();
      const activeAdmins: Admin[] = await activeAdminsRes.json();
      const activeTeachers: Teacher[] = await activeTeachersRes.json();
      
      const combinedPending: PendingUser[] = [
        ...pendingAdmins.map(a => ({ ...a, role: 'admin' as const })),
        ...pendingTeachers.map(t => ({ ...t, role: 'teacher' as const })),
      ];
      setPendingUsers(combinedPending);
      setAllActiveUsers([...activeAdmins, ...activeTeachers]);

    } catch (error: any) {
      toast({ title: "Error Fetching Users", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [toast]);

  const handleApproveUser = async () => {
    if (!selectedUserForApproval || !assignedUsername.trim()) {
      toast({ title: "Error", description: "Username is required for approval.", variant: "destructive" });
      return;
    }
    
    const isUsernameTaken = allActiveUsers.some(u => u.username === assignedUsername.trim());
    if (isUsernameTaken) {
        toast({ title: "Username Taken", description: "This username is already in use. Please choose another.", variant: "destructive" });
        return;
    }
    
    const apiPath = selectedUserForApproval.role === 'admin' 
      ? `/api/admins/${selectedUserForApproval.id}` 
      : `/api/teachers/${selectedUserForApproval.id}`;
    
    try {
      const response = await fetch(apiPath, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: "active", username: assignedUsername.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to approve user (${response.status})`}));
        throw new Error(errorData.message);
      }

      toast({ title: "User Approved", description: `${selectedUserForApproval.name} has been approved with username @${assignedUsername.trim()}.` });
      setIsApproveDialogOpen(false);
      setSelectedUserForApproval(null);
      setAssignedUsername("");
      fetchUsers(); // Refresh list
    } catch (error: any) {
       toast({ title: "Approval Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRejectUser = async () => {
    if (!userToReject) return;

    const apiPath = userToReject.role === 'admin' ? `/api/admins/${userToReject.id}` : `/api/teachers/${userToReject.id}`;
    try {
      const response = await fetch(apiPath, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to reject user (${response.status})`}));
        throw new Error(errorData.message);
      }
      toast({ title: "User Rejected", description: `${userToReject.name}'s registration has been rejected.`, variant: "default" });
      setIsRejectDialogOpen(false);
      setUserToReject(null);
      fetchUsers(); // Refresh list
    } catch (error: any) {
       toast({ title: "Rejection Error", description: error.message, variant: "destructive" });
    }
  };

  const getDepartmentLabel = (deptValue?: string) => {
    if (!deptValue) return "N/A";
    return DEPARTMENTS.find(d => d.value === deptValue)?.label || deptValue;
  };
  
  const openApproveDialog = (user: PendingUser) => {
    setSelectedUserForApproval(user);
    setAssignedUsername(user.name.toLowerCase().replace(/\s+/g, '_') + (user.role === 'admin' ? '_admin' : '_teacher'));
    setIsApproveDialogOpen(true);
  };

  const openRejectDialog = (user: PendingUser) => {
    setUserToReject(user);
    setIsRejectDialogOpen(true);
  };


  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="User Registration Approval (Host)" icon={ShieldQuestion} />
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Pending Approvals</CardTitle></CardHeader>
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
        title="User Registration Approval (Host)"
        description="Review and approve or reject new Admin and Teacher registrations."
        icon={ShieldQuestion}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>Users awaiting your approval to activate their accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Requested Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className="capitalize flex items-center gap-1">
                        {user.role === USER_ROLES.ADMIN ? <ShieldQuestion className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>{user.role === USER_ROLES.TEACHER ? getDepartmentLabel((user as Teacher).department) : "N/A"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                        onClick={() => openApproveDialog(user)}
                      >
                        <UserCheck className="mr-1 h-4 w-4" /> Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => openRejectDialog(user)}
                      >
                        <UserX className="mr-1 h-4 w-4" /> Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No users currently pending approval.</p>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={(open) => { if (!open) { setSelectedUserForApproval(null); setAssignedUsername(""); } setIsApproveDialogOpen(open); }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Approve User & Assign Username</DialogTitle>
            <DialogDescription>
              Assign a unique username for {selectedUserForApproval?.name} ({selectedUserForApproval?.email}). This username will be used for display and login.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right col-span-1">
                Username
              </Label>
              <Input
                id="username"
                value={assignedUsername}
                onChange={(e) => setAssignedUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="col-span-3"
                placeholder="e.g., john_doe_admin"
              />
            </div>
            <p className="text-xs text-muted-foreground col-span-4 px-1">Usernames can only contain lowercase letters, numbers, and underscores.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsApproveDialogOpen(false); setSelectedUserForApproval(null); setAssignedUsername(""); }}>Cancel</Button>
            <Button onClick={handleApproveUser} disabled={!assignedUsername.trim()}>Confirm Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
                <AlertDialogDescription>
                Are you sure you want to reject the registration for {userToReject?.name} ({userToReject?.email})? This action cannot be undone easily.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setUserToReject(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRejectUser} className="bg-destructive hover:bg-destructive/90">
                Confirm Rejection
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
       </AlertDialog>
    </div>
  );
}
