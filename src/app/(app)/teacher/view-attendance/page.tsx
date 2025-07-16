
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { ViewAttendance } from "@/components/shared/ViewAttendance";
import { ListChecks } from "lucide-react";
import { USER_ROLES } from "@/lib/constants";

export default function TeacherViewAttendancePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="View Attendance Records"
        description="Review attendance for your assigned batches."
        icon={ListChecks}
      />
      <ViewAttendance role={USER_ROLES.TEACHER} />
    </div>
  );
}
