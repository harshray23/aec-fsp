
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/shared/AppLogo";
import { CollegeLogo } from "@/components/shared/CollegeLogo";
import { GraduationCap, Briefcase, UserCog } from "lucide-react";
import { USER_ROLES, type UserRole } from "@/lib/constants";

interface RoleCardProps {
  role: UserRole;
  title: string;
  description: string;
  icon: React.ReactNode;
  onSelect: (role: UserRole) => void;
}

function RoleCard({ role, title, description, icon, onSelect }: RoleCardProps) {
  return (
    <Card
      className="w-full md:w-72 cursor-pointer hover:shadow-lg transition-shadow duration-300 hover:border-primary"
      onClick={() => onSelect(role)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect(role);
        }
      }}
      aria-label={`Select role: ${title}`}
    >
      <CardHeader className="items-center text-center">
        <div className="p-3 rounded-full bg-primary/10 text-primary mb-2">
          {icon}
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <CardDescription>{description}</CardDescription>
        <Button variant="outline" className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90">
          Proceed as {title}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function RoleSelector() {
  const router = useRouter();

  const handleNonStudentRoleSelect = (role: UserRole) => {
    router.push(`/auth/login?role=${role}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-secondary">
      <div className="text-center mb-12">
        <div className="flex justify-center items-center gap-4 mb-4">
          <AppLogo width="80" height="80" />
          <CollegeLogo width="132" height="80" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          AEC FSP Portal
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Welcome to the Finishing School Program Portal
        </p>
        <p className="text-foreground mt-6 text-xl font-medium">Please select your role to continue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* Student Card with explicit Login and Register options */}
        <Card className="w-full md:w-72 hover:shadow-lg transition-shadow duration-300 hover:border-primary">
          <CardHeader className="items-center text-center">
            <div className="p-3 rounded-full bg-primary/10 text-primary mb-2">
              <GraduationCap className="w-10 h-10" />
            </div>
            <CardTitle className="text-2xl">Student</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <CardDescription>Access your batch details, attendance, and learning resources.</CardDescription>
            <Button
              variant="outline"
              className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => router.push(`/auth/login?role=${USER_ROLES.STUDENT}`)}
              aria-label="Login as Student"
            >
              Login as Student
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">
              New Student?{" "}
              <Link href={`/auth/register/student`} className="font-medium text-primary hover:underline">
                Register here
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Teacher Card */}
        <RoleCard
          role={USER_ROLES.TEACHER}
          title="Teacher"
          description="Manage batches, track student attendance, and update timetables."
          icon={<Briefcase className="w-10 h-10" />}
          onSelect={handleNonStudentRoleSelect}
        />
        {/* Admin Card */}
        <RoleCard
          role={USER_ROLES.ADMIN}
          title="Admin"
          description="Oversee the program, manage users, and view system-wide reports."
          icon={<UserCog className="w-10 h-10" />}
          onSelect={handleNonStudentRoleSelect}
        />
      </div>
      <footer className="mt-12 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Asansol Engineering College. All rights reserved.</p>
      </footer>
    </div>
  );
}
