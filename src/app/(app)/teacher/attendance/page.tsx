
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function TeacherAttendanceMovedPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Attendance Feature Update"
        description="Important information regarding attendance management."
        icon={Info}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Attendance Management Moved</CardTitle>
          <CardDescription>
            The feature to mark and manage student attendance has been transitioned to the Administrator system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Teachers can view attendance records related to their assigned batches via the "Reports" section.
            For marking or making corrections to attendance, please coordinate with the FSP Administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

