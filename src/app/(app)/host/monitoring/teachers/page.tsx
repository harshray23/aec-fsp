
"use client"; 

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Briefcase, MoreHorizontal, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { teachers as mockTeachers } from "@/lib/mockData"; 
import { DEPARTMENTS } from "@/lib/constants";

export default function HostMonitorTeachersPage() {
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
              {mockTeachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>{teacher.id}</TableCell>
                  <TableCell className="font-medium">{teacher.name}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{DEPARTMENTS.find(d => d.value === teacher.department)?.label || teacher.department}</TableCell>
                  <TableCell>
                    <Badge variant={"default"}>Active</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled> {/* Actions disabled for host monitoring view */}
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled>View Details</DropdownMenuItem>
                        <DropdownMenuItem disabled>Manage Permissions</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {mockTeachers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No teachers found in the system.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: "Monitor Teachers - Host Panel - AEC FSP Portal",
};
