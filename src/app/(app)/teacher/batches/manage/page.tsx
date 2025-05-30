
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Users, PlusCircle, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { batches as mockTeacherBatches, teachers as mockTeachers, getMockCurrentUser } from "@/lib/mockData"; // Import from central store
import { usePathname } from "next/navigation";
import React from "react";

export default function ManageBatchesPage() {
  const pathname = usePathname();
  const currentUser = getMockCurrentUser(pathname);

  // For now, we assume a teacher might see all batches or batches assigned to them.
  // This logic can be refined if teacherId assignment becomes more specific.
  // If using a default teacherId in batch creation, filter by that or by the first teacher's ID.
  const placeholderTeacherId = mockTeachers.length > 0 ? mockTeachers[0].id : "TCH_DEFAULT";
  const displayedBatches = mockTeacherBatches.filter(batch => batch.teacherId === currentUser.id || batch.teacherId === placeholderTeacherId || mockTeacherBatches.length <= 3); // Show all if very few, else filter

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manage My Batches"
        description="View, create, or edit the batches you are assigned to."
        icon={Users}
        actions={
          <Button asChild>
            <Link href="/teacher/batches/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Batch
            </Link>
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>My Batch List</CardTitle>
          <CardDescription>A list of all batches you are currently managing or have managed.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Batch Name</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedBatches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>{batch.id}</TableCell>
                  <TableCell className="font-medium">{batch.name}</TableCell>
                  <TableCell>{batch.topic}</TableCell>
                  <TableCell>{batch.studentIds.length}</TableCell>
                  <TableCell>
                    <Badge variant={batch.status === "Ongoing" ? "default" : batch.status === "Scheduled" ? "outline" : "secondary"}>
                      {batch.status}
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
                        <DropdownMenuItem asChild>
                          <Link href={`/teacher/batches/view/${batch.id}`}> {/* Placeholder link */}
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                           <Link href={`/teacher/batches/edit/${batch.id}`}> {/* Placeholder link */}
                            <Edit className="mr-2 h-4 w-4" /> Edit Batch
                           </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Batch {/* Add delete functionality later */}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {displayedBatches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    You are not assigned to any batches or no batches have been created yet.
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
