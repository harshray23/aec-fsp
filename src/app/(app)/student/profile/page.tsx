
"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Edit3, Mail, Phone, UserSquare2, Hash, Building, ImagePlus, ClipboardList, Loader2, BookCopy } from "lucide-react";
import type { Student, AcademicDetails } from "@/lib/types";
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { USER_ROLES, DEPARTMENTS } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChangePasswordDialog } from "@/components/shared/ChangePasswordDialog";
import AcademicDetailsForm, { type AcademicFormValues } from "@/components/student/AcademicDetailsForm";

export default function StudentProfilePage() {
  const [studentProfile, setStudentProfile] = useState<Partial<Student>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAcademics, setIsSavingAcademics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [isAcademicDialogOpen, setIsAcademicDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      setError(null);
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
        setError(error.message || "Failed to load profile.");
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

  const handleSaveAcademics = async (values: AcademicFormValues) => {
    if (!studentProfile.id) return;
    setIsSavingAcademics(true);
    try {
        const response = await fetch(`/api/students/${studentProfile.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ academics: values }),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || "Failed to save academic details.");
        }
        setStudentProfile(result.student); // Update state with the full updated student object from API
        toast({ title: "Success", description: "Academic details saved successfully." });
        setIsAcademicDialogOpen(false);
    } catch (error: any) {
        toast({ title: "Error Saving", description: error.message, variant: "destructive" });
    } finally {
        setIsSavingAcademics(false);
    }
  };

  const fallbackName = studentProfile.name || "Student";
  const avatarText = fallbackName.split(' ').map(n => n[0]).join('').toUpperCase() || 'S';
  const departmentLabel = DEPARTMENTS.find(d => d.value === studentProfile?.department)?.label || studentProfile?.department || "N/A";

  if (isLoading) {
    return (
       <div className="space-y-8">
        <PageHeader title="Loading Profile..." icon={Loader2} />
        <Card className="shadow-lg max-w-3xl mx-auto">
          <CardHeader className="items-center text-center border-b pb-6">
            <Skeleton className="h-24 w-24 rounded-full mb-4" />
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(7)].map((_, i) => (
                <div key={i}><Skeleton className="h-4 w-24 mb-1" /><Skeleton className="h-10 w-full" /></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
     return (
      <div className="space-y-8">
        <PageHeader title="Error" icon={GraduationCap} />
        <Alert variant="destructive" className="max-w-3xl mx-auto">
          <AlertTitle>Could not load profile</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!studentProfile || Object.keys(studentProfile).length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader title="Profile Not Found" icon={GraduationCap} />
        <Alert variant="default" className="max-w-3xl mx-auto">
          <AlertTitle>Profile data is unavailable.</AlertTitle>
          <AlertDescription>Please try logging out and logging back in.</AlertDescription>
        </Alert>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <PageHeader
        title="My Profile"
        description="View and manage your personal information."
        icon={GraduationCap}
        actions={
          <Button variant="outline" disabled> {/* Edit functionality not yet implemented for students */}
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
          <Button variant="outline" className="mt-4" disabled> {/* Change photo not implemented */}
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
              <Input id="department" value={departmentLabel} readOnly className="mt-1 bg-muted/30" />
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
             <div>
              <Label htmlFor="emailVerified" className="flex items-center text-muted-foreground"><Mail className="mr-2 h-4 w-4" />Email Verified</Label>
              <Input id="emailVerified" value={studentProfile.isEmailVerified ? "Yes" : "No"} readOnly className="mt-1 bg-muted/30" />
            </div>
             <div>
              <Label htmlFor="phoneVerified" className="flex items-center text-muted-foreground"><Phone className="mr-2 h-4 w-4" />Phone Verified</Label>
              <Input id="phoneVerified" value={studentProfile.isPhoneVerified ? "Yes" : "No"} readOnly className="mt-1 bg-muted/30" />
            </div>
          </div>
          
          <Card className="bg-secondary/50 mt-6">
            <CardHeader>
              <CardTitle className="text-base">Account Security</CardTitle>
            </CardHeader>
            <CardContent>
                 <Button variant="outline" onClick={() => setIsChangePasswordDialogOpen(true)}>Change Password</Button>
            </CardContent>
          </Card>

          <Card className="bg-secondary/50 mt-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base flex items-center gap-2"><BookCopy /> Academic Details</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setIsAcademicDialogOpen(true)}>Add / Edit Academics</Button>
              </div>
            </CardHeader>
            <CardContent>
              {studentProfile.academics ? (
                 <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold">Class 12th</h4>
                        <p className="text-sm text-muted-foreground">Board: {studentProfile.academics.class12?.board || 'N/A'}, Percentage: {studentProfile.academics.class12?.percentage || 'N/A'}%</p>
                    </div>
                     <div>
                        <h4 className="font-semibold">Class 10th</h4>
                        <p className="text-sm text-muted-foreground">Board: {studentProfile.academics.class10?.board || 'N/A'}, Percentage: {studentProfile.academics.class10?.percentage || 'N/A'}%</p>
                    </div>
                    <div>
                        <h4 className="font-semibold">Semester SGPA</h4>
                        <ul className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm list-inside text-muted-foreground">
                        {Object.entries(studentProfile.academics.semesters || {}).map(([sem, sgpa]) => (
                            sgpa ? <li key={sem}>Sem {sem.replace('sem', '')}: <span className="font-mono">{sgpa.toFixed(2)}</span></li> : null
                        ))}
                        </ul>
                    </div>
                 </div>
              ) : (
                <p className="text-muted-foreground text-sm">No academic details added yet.</p>
              )}
            </CardContent>
          </Card>

        </CardContent>
      </Card>
      
      <ChangePasswordDialog 
        isOpen={isChangePasswordDialogOpen}
        onClose={() => setIsChangePasswordDialogOpen(false)}
        userEmail={studentProfile?.email || ""}
      />

      {isAcademicDialogOpen && (
        <AcademicDetailsForm
            isOpen={isAcademicDialogOpen}
            onClose={() => setIsAcademicDialogOpen(false)}
            onSave={handleSaveAcademics}
            isSaving={isSavingAcademics}
            initialData={studentProfile.academics}
        />
      )}

    </div>
  );
}
