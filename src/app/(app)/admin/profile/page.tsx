
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCircle, Edit3, Mail, Phone, Shield, ImagePlus } from "lucide-react";

// Mock data for the admin - Harsh Ray
const mockAdminProfile = {
  name: "Harsh Ray",
  email: "harshray2007@gmail.com",
  role: "Super Admin",
  phoneNumber: "9002555217",
  whatsappNumber: "9002555217",
  avatarUrl: `https://placehold.co/150x150.png?text=HR`, 
};

export default function AdminProfilePage() {
  const fallbackName = mockAdminProfile.name || "Admin";
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
            <AvatarImage src={mockAdminProfile.avatarUrl} alt={mockAdminProfile.name} data-ai-hint="admin avatar" />
            <AvatarFallback>{fallbackName.split(' ').map(n => n[0]).join('') || 'A'}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{mockAdminProfile.name}</CardTitle>
          <CardDescription>{mockAdminProfile.email} ({mockAdminProfile.role})</CardDescription>
          <Button variant="outline" className="mt-4">
            <ImagePlus className="mr-2 h-4 w-4" /> Change Photo
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="email" className="flex items-center text-muted-foreground"><Mail className="mr-2 h-4 w-4" />Email</Label>
              <Input id="email" value={mockAdminProfile.email} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="phone" className="flex items-center text-muted-foreground"><Phone className="mr-2 h-4 w-4" />Phone Number</Label>
              <Input id="phone" value={mockAdminProfile.phoneNumber} readOnly className="mt-1 bg-muted/30" />
            </div>
             <div>
              <Label htmlFor="whatsapp" className="flex items-center text-muted-foreground"><Phone className="mr-2 h-4 w-4" />WhatsApp Number</Label>
              <Input id="whatsapp" value={mockAdminProfile.whatsappNumber || 'N/A'} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="role" className="flex items-center text-muted-foreground"><Shield className="mr-2 h-4 w-4" />Role</Label>
              <Input id="role" value={mockAdminProfile.role} readOnly className="mt-1 bg-muted/30" />
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

export const metadata = {
  title: "My Profile - AEC FSP Portal",
};
