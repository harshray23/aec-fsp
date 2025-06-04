
import UserRegistrationForm from "@/components/admin/UserRegistrationForm";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";

export default function CreateUserPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Register New User"
        description="Create accounts for new Teachers or Administrators."
        icon={UserPlus}
      />
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>New User Details</CardTitle>
          <CardDescription>Fill in the form below to create a new user account.</CardDescription>
        </CardHeader>
        <CardContent>
          <UserRegistrationForm />
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: "Register New User - AEC FSP",
};

