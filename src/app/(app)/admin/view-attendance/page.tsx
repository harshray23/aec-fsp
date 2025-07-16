
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { ViewAttendance } from "@/components/shared/ViewAttendance";
import { ListChecks } from "lucide-react";
import { USER_ROLES } from "@/lib/constants";

export default function AdminViewAttendancePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="View Attendance Records"
        description="Monitor attendance across all batches and date ranges."
        icon={ListChecks}
      />
      <ViewAttendance role={USER_ROLES.ADMIN} />
    </div>
  );
}
