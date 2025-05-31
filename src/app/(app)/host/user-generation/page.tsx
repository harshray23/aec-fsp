"use client";
import UserRegistrationForm from "@/components/admin/UserRegistrationForm"; // Re-using the existing form
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HostUserGenerationPage() {
  const router = useRouter();

  const handleSuccess = (role?: 'teacher' | 'admin') => {
    // After successful user creation by host, maybe redirect to a list or back to host dashboard
    if (role === 'teacher') {
        router.push('/host/monitoring/teachers'); // Or a general success page
    } else if (role === 'admin') {
        router.push('/host/monitoring/admins');
    } else {
        router.push('/host/dashboard');
    }
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Generate User Accounts (Host)"
        description="Create new accounts for Teachers or Administrators."
        icon={UserPlus}
      />
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>New User Details</CardTitle>
          <CardDescription>Fill in the form below to create a new Teacher or Admin account. The account will be provisioned immediately.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pass a custom onSuccess to UserRegistrationForm if needed, or let it use its default redirect */}
          <UserRegistrationForm onSuccess={() => handleSuccess()} />
        </CardContent>
      </Card>
    </div>
  );
}
