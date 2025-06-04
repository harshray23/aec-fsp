
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCog, CheckCircle, AlertTriangle, Server, Users } from "lucide-react";
import { useEffect, useState } from "react";

export default function HostMonitorWebsitePage() {
  // Mock data for website status
  const [websiteStatus, setWebsiteStatus] = useState({
    overall: "Operational",
    responseTime: "120ms",
    lastChecked: new Date().toLocaleString(),
    activeUsers: 0, // Initialize activeUsers
  });

  useEffect(() => {
    // Simulate dynamic data fetching or updates
    const interval = setInterval(() => {
      setWebsiteStatus(prevStatus => ({
        ...prevStatus,
        responseTime: `${Math.floor(Math.random() * 80) + 50}ms`, // Random between 50-130ms
        lastChecked: new Date().toLocaleString(),
        activeUsers: Math.floor(Math.random() * 100) + 10, // Random active users
      }));
    }, 5000); // Update every 5 seconds

    // Initial random active users
     setWebsiteStatus(prevStatus => ({
        ...prevStatus,
        activeUsers: Math.floor(Math.random() * 100) + 10,
    }));


    return () => clearInterval(interval);
  }, []);


  return (
    <div className="space-y-8">
      <PageHeader
        title="Monitor Website Status (Management)"
        description="View overall website health, uptime, and performance metrics."
        icon={FileCog}
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {websiteStatus.overall === "Operational" ? 
                <CheckCircle className="h-6 w-6 text-green-500" /> : 
                <AlertTriangle className="h-6 w-6 text-red-500" />
            }
            Overall Status: {websiteStatus.overall}
          </CardTitle>
          <CardDescription>Last checked: {websiteStatus.lastChecked}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
            <Card className="p-4 bg-muted/30">
                <CardTitle className="text-sm font-medium flex items-center gap-1"><Server className="h-4 w-4"/>Average Response Time</CardTitle>
                <p className="text-2xl font-bold">{websiteStatus.responseTime}</p>
            </Card>
             <Card className="p-4 bg-muted/30">
                <CardTitle className="text-sm font-medium flex items-center gap-1"><Users className="h-4 w-4"/>Active Users (Simulated)</CardTitle>
                <p className="text-2xl font-bold">{websiteStatus.activeUsers}</p>
            </Card>
             <Card className="p-4 bg-muted/30 md:col-span-2">
                <CardTitle className="text-sm font-medium">Recent Events/Logs</CardTitle>
                <p className="text-muted-foreground mt-2">No critical events logged in the last 24 hours. System is stable.</p>
                {/* Placeholder for actual log display */}
            </Card>
        </CardContent>
      </Card>
      
      {/* Add more monitoring components or charts here as needed */}
    </div>
  );
}

// Removed metadata as it's a client component with dynamic data
