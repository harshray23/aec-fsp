
"use client";

import React, { useMemo } from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Clock, User, Shield, Briefcase, GraduationCap } from "lucide-react";
import type { ActivityLog } from '@/lib/types';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { format, subDays, eachDayOfInterval } from "date-fns";
import { Badge } from '@/components/ui/badge';

// Mock data for demonstration purposes
const generateMockActivities = (): ActivityLog[] => {
  const activities: ActivityLog[] = [];
  const users = [
    { name: "Admin User", role: "admin" as const },
    { name: "Teacher One", role: "teacher" as const },
    { name: "Student A", role: "student" as const },
    { name: "Management User", role: "host" as const }
  ];
  const actions = [
    { action: "User Login", details: "Successfully logged in." },
    { action: "Batch Update", details: "Updated batch FSP-CSE-2024." },
    { action: "Attendance Marked", details: "Attendance marked for 45 students." },
    { action: "Report Downloaded", details: "Downloaded batch attendance report." },
    { action: "User Approved", details: "Approved new teacher registration." },
  ];

  for (let i = 0; i < 150; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const date = subDays(new Date(), Math.floor(Math.random() * 30));
    activities.push({
      id: `act_${i}`,
      timestamp: date.toISOString(),
      user: user.name,
      role: user.role,
      action: action.action,
      details: action.details
    });
  }
  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const mockActivities = generateMockActivities();

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin': return <Shield className="h-4 w-4 text-red-500" />;
    case 'teacher': return <Briefcase className="h-4 w-4 text-green-500" />;
    case 'student': return <GraduationCap className="h-4 w-4 text-blue-500" />;
    case 'host': return <User className="h-4 w-4 text-orange-500" />;
    default: return <User className="h-4 w-4 text-gray-500" />;
  }
};

export default function ActivityMonitorPage() {
  const activityByDay = useMemo(() => {
    const interval = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    const dailyCounts = new Map<string, number>();
    interval.forEach(day => {
      dailyCounts.set(format(day, "yyyy-MM-dd"), 0);
    });

    mockActivities.forEach(activity => {
      const day = format(new Date(activity.timestamp), "yyyy-MM-dd");
      if (dailyCounts.has(day)) {
        dailyCounts.set(day, dailyCounts.get(day)! + 1);
      }
    });

    return Array.from(dailyCounts.entries()).map(([date, count]) => ({
      date: format(new Date(date), "dd MMM"),
      activities: count
    }));
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Activity Monitor"
        description="View recent system activities and monitor usage patterns."
        icon={BarChart3}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Activity Overview (Last 30 Days)</CardTitle>
          <CardDescription>A chart showing the number of activities per day.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  borderColor: 'hsl(var(--border))'
                }}
              />
              <Legend />
              <Bar dataKey="activities" fill="hsl(var(--primary))" name="Activities" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Log</CardTitle>
          <CardDescription>A detailed list of the most recent system activities.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockActivities.slice(0, 50).map(log => ( // Show latest 50 activities
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground text-xs">
                      {format(new Date(log.timestamp), "dd MMM, hh:mm a")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(log.role)}
                        <div>
                          <p className="font-medium">{log.user}</p>
                          <Badge variant="outline" className="capitalize">{log.role === 'host' ? 'Management' : log.role}</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell className="text-muted-foreground">{log.details}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
