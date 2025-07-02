
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export default function AdminAttendanceMovedPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Attendance Management Update"
        description="Important information regarding the attendance feature."
        icon={Info}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Attendance Feature Moved</CardTitle>
          <CardDescription>
            The responsibility for marking student attendance has been transitioned to the Teacher panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Administrators can view comprehensive attendance reports in the "View Reports" section. For marking or correcting attendance for a specific batch, please coordinate with the assigned teacher.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
