
"use client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle, Mail, Shield, Loader2, Edit3, Phone } from "lucide-react"; 
import type { Host } from "@/lib/types";
import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { USER_ROLES } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChangePasswordDialog } from "@/components/shared/ChangePasswordDialog";
import HostEditProfileForm, { type EditHostProfileFormValues } from "@/components/host/HostEditProfileForm";

export default function HostProfilePage() {
  const [hostProfile, setHostProfile] = useState<Host | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    let hostIdFromStorage: string | null = null;
    const storedUserJSON = localStorage.getItem("currentUser");
    
    if (storedUserJSON) {
        const user = JSON.parse(storedUserJSON);
        if (user && user.role === USER_ROLES.HOST && user.id) {
            hostIdFromStorage = user.id;
        }
    }

    if (!hostIdFromStorage) {
        toast({
            title: "Authentication Error",
            description: "Could not identify management user. Please log in again.",
            variant: "destructive",
        });
        router.push("/login?role=host");
        setIsLoading(false);
        return;
    }

    try {
      const res = await fetch(`/api/hosts/${hostIdFromStorage}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `Failed to fetch profile (${res.status})` }));
        throw new Error(errorData.message || `Error: ${res.status}`);
      }
      const data: Host = await res.json();
      setHostProfile(data);
    } catch (err: any) {
      setError(err.message || "Failed to load profile.");
      toast({
        title: "Failed to load profile",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [router, toast]);
  
  const handleSaveProfile = async (values: EditHostProfileFormValues) => {
    if (!hostProfile) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/hosts/${hostProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update profile.'}));
        throw new Error(errorData.message);
      }
      const updatedHost = await response.json();
      setHostProfile(updatedHost.host);
      localStorage.setItem("currentUser", JSON.stringify(updatedHost.host));

      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      setIsEditing(false);
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const fallbackName = hostProfile?.name || "Management";
  const avatarText = fallbackName.split(' ').map(n => n[0]).join('').toUpperCase() || 'M';
  
  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Loading Profile..." icon={Loader2} />
        <Card className="shadow-lg max-w-3xl mx-auto">
          <CardHeader className="items-center text-center border-b pb-6">
            <Skeleton className="h-24 w-24 rounded-full mb-4" />
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
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
        <PageHeader title="Error" icon={UserCircle} />
        <Alert variant="destructive" className="max-w-3xl mx-auto">
          <AlertTitle>Could not load profile</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!hostProfile) {
    return (
      <div className="space-y-8">
        <PageHeader title="Profile Not Found" icon={UserCircle} />
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
        title={isEditing ? "Edit Profile" : "My Profile"}
        description={isEditing ? "Update your management user information." : "View your management user information."}
        icon={UserCircle} 
        actions={
          !isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          )
        }
      />

      <Card className="shadow-lg max-w-3xl mx-auto p-6">
        {isEditing ? (
          <HostEditProfileForm
            hostData={hostProfile}
            onSave={handleSaveProfile}
            onCancel={() => setIsEditing(false)}
            isSaving={isSaving}
          />
        ) : (
          <>
            <CardHeader className="items-center text-center border-b pb-6 p-0">
                <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary ring-offset-2">
                <AvatarImage src={`https://placehold.co/150x150.png?text=${avatarText}`} alt={hostProfile.name} data-ai-hint="management avatar" />
                <AvatarFallback>{avatarText}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl">{hostProfile.name || "N/A"}</CardTitle>
                <CardDescription>{hostProfile.email || "N/A"} ({hostProfile.role || "N/A"})</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <Label htmlFor="email" className="flex items-center text-muted-foreground"><Mail className="mr-2 h-4 w-4" />Email</Label>
                    <Input id="email" value={hostProfile.email || "N/A"} readOnly className="mt-1 bg-muted/30" />
                </div>
                <div>
                  <Label htmlFor="phone" className="flex items-center text-muted-foreground"><Phone className="mr-2 h-4 w-4" />Phone Number</Label>
                  <Input id="phone" value={hostProfile.phoneNumber || 'N/A'} readOnly className="mt-1 bg-muted/30" />
                </div>
                <div>
                  <Label htmlFor="whatsapp" className="flex items-center text-muted-foreground"><Phone className="mr-2 h-4 w-4" />WhatsApp Number</Label>
                  <Input id="whatsapp" value={hostProfile.whatsappNumber || 'N/A'} readOnly className="mt-1 bg-muted/30" />
                </div>
                <div>
                    <Label htmlFor="role" className="flex items-center text-muted-foreground"><Shield className="mr-2 h-4 w-4" />Role</Label>
                    <Input id="role" value="Management" readOnly className="mt-1 bg-muted/30" />
                </div>
                <div>
                    <Label htmlFor="status" className="flex items-center text-muted-foreground"><Shield className="mr-2 h-4 w-4" />Account Status</Label>
                    <Input id="status" value={hostProfile.status || "N/A"} readOnly className="mt-1 bg-muted/30 capitalize" />
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
            </CardContent>
          </>
        )}
      </Card>

       <ChangePasswordDialog 
        isOpen={isChangePasswordDialogOpen}
        onClose={() => setIsChangePasswordDialogOpen(false)}
        userEmail={hostProfile?.email || ""}
      />
    </div>
  );
}
