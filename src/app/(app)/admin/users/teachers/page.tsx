
"use client"; // Marking as client component to use hooks if needed for future interactions

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Briefcase, UserPlus, MoreHorizontal, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { teachers as mockTeachers } from "@/lib/mockData"; // Import from central store
import { DEPARTMENTS } from "@/lib/constants";

export default function ManageTeachersPage() {
  // In a real app, you might want to add delete/edit functionality here
  // which would modify the mockTeachers array and potentially re-render.

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
          <CardDescription>A list of all registered teachers in the system.</CardDescription>
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
                    <Badge variant={"default"}> {/* Placeholder status */}
                      Active
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
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
               {mockTeachers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No teachers found.
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
