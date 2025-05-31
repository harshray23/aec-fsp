
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserCheck, UserX, ShieldQuestion, Briefcase, CircleUserRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { admins as mockAdmins, teachers as mockTeachers } from "@/lib/mockData";
import type { Admin, Teacher, UserApprovalStatus } from "@/lib/types";
import { USER_ROLES, DEPARTMENTS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
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
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

type PendingUser = (Admin | Teacher) & { type: 'admin' | 'teacher' };

export default function HostUserApprovalPage() {
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [selectedUserForApproval, setSelectedUserForApproval] = useState<PendingUser | null>(null);
  const [assignedUsername, setAssignedUsername] = useState("");

  const fetchPendingUsers = () => {
    const pendingAdmins = mockAdmins
      .filter(a => a.status === "pending_approval")
      .map(a => ({ ...a, type: 'admin' as const }));
    const pendingTeachers = mockTeachers
      .filter(t => t.status === "pending_approval")
      .map(t => ({ ...t, type: 'teacher' as const }));
    setPendingUsers([...pendingAdmins, ...pendingTeachers]);
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApproveUser = () => {
    if (!selectedUserForApproval || !assignedUsername.trim()) {
      toast({ title: "Error", description: "Username is required for approval.", variant: "destructive" });
      return;
    }

    const isUsernameTaken = 
        mockAdmins.some(a => a.username === assignedUsername.trim() && a.id !== selectedUserForApproval.id) ||
        mockTeachers.some(t => t.username === assignedUsername.trim() && t.id !== selectedUserForApproval.id);

    if (isUsernameTaken) {
        toast({ title: "Error", description: "This username is already taken. Please choose another.", variant: "destructive" });
        return;
    }
    
    if (selectedUserForApproval.type === 'admin') {
      const adminIndex = mockAdmins.findIndex(a => a.id === selectedUserForApproval.id);
      if (adminIndex !== -1) {
        mockAdmins[adminIndex].status = "active";
        mockAdmins[adminIndex].username = assignedUsername.trim();
      }
    } else if (selectedUserForApproval.type === 'teacher') {
      const teacherIndex = mockTeachers.findIndex(t => t.id === selectedUserForApproval.id);
      if (teacherIndex !== -1) {
        mockTeachers[teacherIndex].status = "active";
        mockTeachers[teacherIndex].username = assignedUsername.trim();
      }
    }

    toast({ title: "User Approved", description: `${selectedUserForApproval.name} has been approved with username ${assignedUsername.trim()}.` });
    setSelectedUserForApproval(null);
    setAssignedUsername("");
    fetchPendingUsers(); // Refresh list
  };

  const handleRejectUser = (userToReject: PendingUser) => {
    if (userToReject.type === 'admin') {
      const adminIndex = mockAdmins.findIndex(a => a.id === userToReject.id);
      if (adminIndex !== -1) mockAdmins[adminIndex].status = "rejected";
    } else if (userToReject.type === 'teacher') {
      const teacherIndex = mockTeachers.findIndex(t => t.id === userToReject.id);
      if (teacherIndex !== -1) mockTeachers[teacherIndex].status = "rejected";
    }
    toast({ title: "User Rejected", description: `${userToReject.name}'s registration has been rejected.`, variant: "default" });
    fetchPendingUsers(); // Refresh list
  };

  const getDepartmentLabel = (deptValue?: string) => {
    if (!deptValue) return "N/A";
    return DEPARTMENTS.find(d => d.value === deptValue)?.label || deptValue;
  };

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
                  <TableHead>Role</TableHead>
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
                      <Dialog onOpenChange={(open) => { if (open) setSelectedUserForApproval(user); else { setSelectedUserForApproval(null); setAssignedUsername(""); }}}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700">
                            <UserCheck className="mr-1 h-4 w-4" /> Approve
                          </Button>
                        </DialogTrigger>
                        {selectedUserForApproval && selectedUserForApproval.id === user.id && (
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Approve User & Assign Username</DialogTitle>
                            <DialogDescription>
                              Assign a unique username for {selectedUserForApproval.name} ({selectedUserForApproval.email}). This username will be used for display purposes.
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
                                onChange={(e) => setAssignedUsername(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g., john_doe_admin"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                               <Button variant="outline" onClick={() => { setSelectedUserForApproval(null); setAssignedUsername(""); }}>Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleApproveUser} disabled={!assignedUsername.trim()}>Confirm Approval</Button>
                          </DialogFooter>
                        </DialogContent>
                        )}
                      </Dialog>
                      
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700">
                            <UserX className="mr-1 h-4 w-4" /> Reject
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Rejection</AlertDialogTitle>
                                <AlertDialogDescription>
                                Are you sure you want to reject the registration for {user.name} ({user.email})? This action cannot be undone easily.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRejectUser(user)} className="bg-destructive hover:bg-destructive/90">
                                Confirm Rejection
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                       </AlertDialog>

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
    </div>
  );
}
