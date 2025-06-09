
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Edit3, Mail, Phone, UserSquare2, Hash, Building, ImagePlus, ClipboardList } from "lucide-react";
import { SECTIONS } from "@/lib/constants"; // Import SECTIONS to infer type if needed, though not directly used here for mock
import type { Student } from "@/lib/types";
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { USER_ROLES } from "@/lib/constants";
import { useRouter } from "next/navigation";

export default function StudentProfilePage() {
  const [studentProfile, setStudentProfile] = useState<Partial<Student>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      let studentIdFromStorage: string | null = null;
      const storedUserJSON = localStorage.getItem("currentUser");
      
      if (storedUserJSON) {
          const user = JSON.parse(storedUserJSON);
          if (user && user.role === USER_ROLES.STUDENT && (user.studentId || user.id)) {
              studentIdFromStorage = user.studentId || user.id;
          }
      }

      if (!studentIdFromStorage) {
          toast({
              title: "Error",
              description: "Could not identify student. Please log in again.",
              variant: "destructive",
          });
          router.push("/auth/login?role=student");
          setIsLoading(false);
          return;
      }

      try {
        const res = await fetch(`/api/students/profile?studentId=${studentIdFromStorage}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: `Failed to fetch profile (${res.status})` }));
          throw new Error(errorData.message || `Error: ${res.status}`);
        }
        const data: Student = await res.json();
        setStudentProfile(data);
      } catch (error: any) {
        toast({
          title: "Failed to load profile",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [router, toast]);

  const fallbackName = studentProfile.name || "Student";
  const avatarText = fallbackName.split(' ').map(n => n[0]).join('').toUpperCase() || 'S';

  if (isLoading) {
    return <div className="p-4">Loading profile...</div>; // Or a proper skeleton loader
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="My Profile"
        description="View and manage your personal information."
        icon={GraduationCap}
        actions={
          <Button variant="outline">
            <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
        }
      />

      <Card className="shadow-lg max-w-3xl mx-auto">
        <CardHeader className="items-center text-center border-b pb-6">
          <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-2">
            <AvatarImage src={(studentProfile as any).avatarUrl || `https://placehold.co/150x150.png?text=${avatarText}`} alt={studentProfile.name} data-ai-hint="student avatar" />
            <AvatarFallback>{avatarText}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{studentProfile.name || "N/A"}</CardTitle>
          <CardDescription>{studentProfile.studentId || "N/A"}</CardDescription>
          <Button variant="outline" className="mt-4">
            <ImagePlus className="mr-2 h-4 w-4" /> Change Photo
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="email" className="flex items-center text-muted-foreground"><Mail className="mr-2 h-4 w-4" />Email</Label>
              <Input id="email" value={studentProfile.email || "N/A"} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="phone" className="flex items-center text-muted-foreground"><Phone className="mr-2 h-4 w-4" />Phone Number</Label>
              <Input id="phone" value={studentProfile.phoneNumber || "N/A"} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="whatsapp" className="flex items-center text-muted-foreground"><Phone className="mr-2 h-4 w-4" />WhatsApp Number</Label>
              <Input id="whatsapp" value={studentProfile.whatsappNumber || 'N/A'} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="department" className="flex items-center text-muted-foreground"><Building className="mr-2 h-4 w-4" />Department</Label>
              <Input id="department" value={studentProfile.department || "N/A"} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="section" className="flex items-center text-muted-foreground"><ClipboardList className="mr-2 h-4 w-4" />Section</Label>
              <Input id="section" value={studentProfile.section || "N/A"} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="rollNumber" className="flex items-center text-muted-foreground"><UserSquare2 className="mr-2 h-4 w-4" />Roll Number</Label>
              <Input id="rollNumber" value={studentProfile.rollNumber || "N/A"} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="regNumber" className="flex items-center text-muted-foreground"><Hash className="mr-2 h-4 w-4" />Registration Number</Label>
              <Input id="regNumber" value={studentProfile.registrationNumber || "N/A"} readOnly className="mt-1 bg-muted/30" />
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
