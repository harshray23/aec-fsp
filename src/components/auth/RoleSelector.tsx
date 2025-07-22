
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/shared/AppLogo";
import { GraduationCap, Briefcase, UserCog, UserRound, Code } from "lucide-react"; 
import { USER_ROLES, type UserRole } from "@/lib/constants";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


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
      className="w-full md:w-72 cursor-pointer hover:shadow-lg transition-shadow duration-300 hover:border-primary bg-background/80 backdrop-blur-sm"
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
    router.push(`/login?role=${role}`);
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-cover bg-center"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      {/* Content Container */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center">
        {/* Management Icon */}
        <div className="absolute top-4 right-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-12 w-12 text-white hover:bg-white/20" 
            onClick={() => router.push(`/login?role=${USER_ROLES.HOST}`)}
            aria-label="Management Login"
            title="Management Panel"
          >
            <UserRound className="h-7 w-7" />
          </Button>
        </div>
        
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-4 mb-4">
            <AppLogo src="/logo1.avif" width="80" height="80" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            AEC FSP
          </h1>
          <p className="text-white/80 mt-2 text-lg">
            Welcome to the Finishing School Program
          </p>
          <p className="text-white mt-6 text-xl font-medium">Please select your role to continue</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Student Card with explicit Login and Register options */}
          <Card className="w-full md:w-72 hover:shadow-lg transition-shadow duration-300 hover:border-primary bg-background/80 backdrop-blur-sm">
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
                onClick={() => router.push(`/login?role=${USER_ROLES.STUDENT}`)}
                aria-label="Login as Student"
              >
                Login as Student
              </Button>
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
        
        <div className="text-center mt-8 md:mt-12 w-full max-w-4xl">
           <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-background/80 backdrop-blur-sm">
                  <Code className="mr-2 h-4 w-4"/> Developed By
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-center">Meet the Developers</DialogTitle>
                  <DialogDescription className="text-center">
                    This project was brought to life by a dedicated team of student developers.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <Card className="text-center overflow-hidden">
                    <Image src="/iiimg1.jpg" alt="Harsh Ray" width={400} height={300} className="w-full h-48 object-cover" data-ai-hint="developer portrait" />
                    <CardContent className="p-4">
                        <h3 className="font-semibold text-lg text-foreground">Harsh Ray</h3>
                        <p className="text-sm font-medium text-primary">AIML</p>
                        <p className="text-sm text-muted-foreground mt-1">Backend and Automation Engineer</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center overflow-hidden">
                    <Image src="/iiimg2.jpg" alt="Sanjay Sharma" width={400} height={300} className="w-full h-48 object-cover" data-ai-hint="developer portrait" />
                    <CardContent className="p-4">
                        <h3 className="font-semibold text-lg text-foreground">Sanjay Sharma</h3>
                         <p className="text-sm font-medium text-primary">CSE</p>
                        <p className="text-sm text-muted-foreground mt-1">Backend and Database Engineer</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center overflow-hidden">
                    <Image src="/iiimg3.jpg" alt="Harsh Agarwalla" width={400} height={300} className="w-full h-48 object-cover" data-ai-hint="developer portrait" />
                    <CardContent className="p-4">
                        <h3 className="font-semibold text-lg text-foreground">Harsh Agarwalla</h3>
                         <p className="text-sm font-medium text-primary">IT</p>
                        <p className="text-sm text-muted-foreground mt-1">Testing and Frontend Engineer</p>
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>
        </div>
        
        <footer className="mt-8 text-center text-white/70 text-sm">
          <p>&copy; {new Date().getFullYear()} Asansol Engineering College. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
