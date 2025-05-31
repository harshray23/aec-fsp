
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Edit3, Mail, Phone, UserSquare2, Hash, Building, ImagePlus, ClipboardList } from "lucide-react";
import { SECTIONS } from "@/lib/constants"; // Import SECTIONS to infer type if needed, though not directly used here for mock

// Mock data - updated to placeholder
const mockStudentProfile = {
  name: "Student User",
  studentId: "N/A",
  email: "student@placeholder.aec.edu.in",
  rollNumber: "N/A",
  registrationNumber: "N/A",
  department: "N/A",
  section: "N/A" as (typeof SECTIONS[number] | "N/A"), // Ensure section type matches
  phoneNumber: "N/A",
  whatsappNumber: "N/A",
  avatarUrl: "https://placehold.co/150x150.png?text=SU", // SU for Student User
};

export default function StudentProfilePage() {
  const fallbackName = mockStudentProfile.name || "Student";
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
            <AvatarImage src={mockStudentProfile.avatarUrl} alt={mockStudentProfile.name} data-ai-hint="student avatar" />
            <AvatarFallback>{fallbackName.split(' ').map(n => n[0]).join('') || 'S'}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{mockStudentProfile.name}</CardTitle>
          <CardDescription>{mockStudentProfile.studentId}</CardDescription>
          <Button variant="outline" className="mt-4">
            <ImagePlus className="mr-2 h-4 w-4" /> Change Photo
          </Button>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="email" className="flex items-center text-muted-foreground"><Mail className="mr-2 h-4 w-4" />Email</Label>
              <Input id="email" value={mockStudentProfile.email} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="phone" className="flex items-center text-muted-foreground"><Phone className="mr-2 h-4 w-4" />Phone Number</Label>
              <Input id="phone" value={mockStudentProfile.phoneNumber} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="whatsapp" className="flex items-center text-muted-foreground"><Phone className="mr-2 h-4 w-4" />WhatsApp Number</Label>
              <Input id="whatsapp" value={mockStudentProfile.whatsappNumber || 'N/A'} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="department" className="flex items-center text-muted-foreground"><Building className="mr-2 h-4 w-4" />Department</Label>
              <Input id="department" value={mockStudentProfile.department} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="section" className="flex items-center text-muted-foreground"><ClipboardList className="mr-2 h-4 w-4" />Section</Label>
              <Input id="section" value={mockStudentProfile.section} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="rollNumber" className="flex items-center text-muted-foreground"><UserSquare2 className="mr-2 h-4 w-4" />Roll Number</Label>
              <Input id="rollNumber" value={mockStudentProfile.rollNumber} readOnly className="mt-1 bg-muted/30" />
            </div>
            <div>
              <Label htmlFor="regNumber" className="flex items-center text-muted-foreground"><Hash className="mr-2 h-4 w-4" />Registration Number</Label>
              <Input id="regNumber" value={mockStudentProfile.registrationNumber} readOnly className="mt-1 bg-muted/30" />
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
