
"use client";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle, Edit3, Mail, Phone, Shield, ImagePlus } from "lucide-react";
import { admins } from "@/lib/mockData"; // Assuming Harsh Ray is the first/primary admin
import { USER_ROLES } from "@/lib/constants";

// For this prototype, we'll assume the first admin in the list is the logged-in admin.
// In a real app, this would come from an authentication context.
const currentAdmin = admins.find(a => a.email === "harshray2007@gmail.com") || {
  name: "Admin User",
  email: "admin@example.com",
  role: USER_ROLES.ADMIN,
  phoneNumber: "N/A",
  whatsappNumber: "N/A",
  avatarUrl: `https://placehold.co/150x150.png?text=AU`, 
};


export default function AdminProfilePage() {
  const fallbackName = currentAdmin.name || "Admin";
  const avatarText = fallbackName.split(' ').map(n => n[0]).join('').toUpperCase() || 'A';
  
  return (
    <div className="space-y-8">
      <PageHeader
        title="My Profile"
        description="View and manage your administrator information."
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
            <AvatarImage src={currentAdmin.avatarUrl || `https://placehold.co/150x150.png?text=${avatarText}`} alt={currentAdmin.name} data-ai-hint="admin avatar" />
            <AvatarFallback>{avatarText}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{currentAdmin.name}</CardTitle>
          <CardDescription>{currentAdmin.email} ({currentAdmin.role})</CardDescription>
          <Button variant="outline" className="mt-4">
            <ImagePlus className="mr-2 h-4 w-4" /> Change Photo
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="email" className="flex items-center text-muted-foreground"><Mail className="mr-2 h-4 w-4" />Email</Label>
              <Input id="email" value={currentAdmin.email} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="phone" className="flex items-center text-muted-foreground"><Phone className="mr-2 h-4 w-4" />Phone Number</Label>
              <Input id="phone" value={currentAdmin.phoneNumber || 'N/A'} readOnly className="mt-1 bg-muted/30" />
            </div>
             <div>
              <Label htmlFor="whatsapp" className="flex items-center text-muted-foreground"><Phone className="mr-2 h-4 w-4" />WhatsApp Number</Label>
              <Input id="whatsapp" value={currentAdmin.whatsappNumber || 'N/A'} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="role" className="flex items-center text-muted-foreground"><Shield className="mr-2 h-4 w-4" />Role</Label>
              <Input id="role" value={currentAdmin.role} readOnly className="mt-1 bg-muted/30" />
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
