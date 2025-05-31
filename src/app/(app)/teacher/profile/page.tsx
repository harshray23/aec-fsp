
"use client"; 

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle, Edit3, Mail, Phone, Building, ImagePlus, BadgePercent, Briefcase } from "lucide-react";
import React from "react";
import { getMockCurrentUser } from "@/lib/mockData"; // To get current user details
import { usePathname } from "next/navigation";

export default function TeacherProfilePage() {
  const pathname = usePathname();
  // Fetch current teacher profile using the mock helper
  // Assuming getMockCurrentUser returns the structure including username and status for a teacher
  const mockTeacherProfile = React.useMemo(() => {
      const user = getMockCurrentUser(pathname);
      return {
          name: user.name || "Teacher User",
          email: user.email || "teacher@example.com",
          department: user.department || "N/A",
          phoneNumber: (user as any).phoneNumber || "N/A", // Cast if needed, or ensure type is correct
          username: user.username || undefined,
          status: (user as any).status || "active", // Cast if needed
          avatarUrl: (user as any).avatarUrl || `https://placehold.co/150x150.png?text=TU`,
      };
  }, [pathname]);
  

  const fallbackName = mockTeacherProfile.name || "Teacher";
  const avatarText = fallbackName.split(' ').map(n => n[0]).join('').toUpperCase() || 'T';

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Profile"
        description="View and manage your personal information."
        icon={UserCircle} 
        actions={
          <Button variant="outline">
            <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        }
      />

      <Card className="shadow-lg max-w-3xl mx-auto">
        <CardHeader className="items-center text-center border-b pb-6">
          <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-2">
            <AvatarImage src={mockTeacherProfile.avatarUrl} alt={mockTeacherProfile.name} data-ai-hint="teacher avatar" />
            <AvatarFallback>{avatarText}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{mockTeacherProfile.name}</CardTitle>
          <CardDescription>{mockTeacherProfile.email}</CardDescription>
           {mockTeacherProfile.username && (
            <CardDescription className="text-sm mt-1">Username: <span className="font-semibold text-primary">@{mockTeacherProfile.username}</span></CardDescription>
          )}
           <Button variant="outline" className="mt-4">
            <ImagePlus className="mr-2 h-4 w-4" /> Change Photo
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="usernameDisplay" className="flex items-center text-muted-foreground"><BadgePercent className="mr-2 h-4 w-4" />Username</Label>
              <Input id="usernameDisplay" value={mockTeacherProfile.username || 'Not Assigned'} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="email" className="flex items-center text-muted-foreground"><Mail className="mr-2 h-4 w-4" />Email</Label>
              <Input id="email" value={mockTeacherProfile.email} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="phone" className="flex items-center text-muted-foreground"><Phone className="mr-2 h-4 w-4" />Phone Number</Label>
              <Input id="phone" value={mockTeacherProfile.phoneNumber} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="department" className="flex items-center text-muted-foreground"><Building className="mr-2 h-4 w-4" />Department</Label>
              <Input id="department" value={mockTeacherProfile.department} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="status" className="flex items-center text-muted-foreground"><Briefcase className="mr-2 h-4 w-4" />Account Status</Label>
              <Input id="status" value={mockTeacherProfile.status} readOnly className="mt-1 bg-muted/30 capitalize" />
            </div>
          </div>
          
          <Card className="bg-secondary/50 mt-6">
            <CardHeader>
              <CardTitle className="text-base">Account Security</CardTitle>
            </CardHeader>
            <CardContent>
                 <Button variant="outline">Change Password</Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
