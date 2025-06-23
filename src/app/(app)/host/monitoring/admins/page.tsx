
"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ShieldAlert, MoreHorizontal, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Admin } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function HostMonitorAdminsPage() {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    fetchAdmins();
  }, [toast]);
  
  const getStatusVariant = (status?: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "active": return "default";
      case "pending_approval": return "secondary";
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
                    <Button variant="ghost" size="icon" disabled>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
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
    </div>
  );
}
