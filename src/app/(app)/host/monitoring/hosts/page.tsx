
"use client";

import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ServerCog, MoreHorizontal, Loader2 } from "lucide-react";
import type { Host } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function HostMonitorHostsPage() {
  const { toast } = useToast();
  const [hosts, setHosts] = useState<Host[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    fetchHosts();
  }, [toast]);
  

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
                    <Button variant="ghost" size="icon" disabled>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
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
    </div>
  );
}
