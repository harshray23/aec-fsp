
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { USER_ROLES, type UserRole } from "@/lib/constants";
import { admins as mockAdmins, teachers as mockTeachers } from "@/lib/mockData"; // Assuming students are elsewhere or not status-checked here

const getLoginFormSchema = (role: UserRole | null) => {
  const baseSchema = {
    password: z.string().min(6, "Password must be at least 6 characters"),
  };

  if (role === USER_ROLES.STUDENT) {
    return z.object({
      ...baseSchema,
      identifier: z.string().min(1, "Student ID or Email is required"), 
    });
  } else { 
    return z.object({
      ...baseSchema,
      email: z.string().email("Invalid email address"),
    });
  }
};


export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const role = searchParams.get("role") as UserRole | null;

  const formSchema = getLoginFormSchema(role);
  type LoginFormValues = z.infer<typeof formSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: role === USER_ROLES.STUDENT ? { identifier: "", password: "" } : { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    console.log("Login form submitted with values:", values, "and role:", role);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    let userStatus: string | undefined = "active"; // Default to active for students or if no status check needed
    let userToLogin;

    if (role === USER_ROLES.ADMIN) {
      userToLogin = mockAdmins.find(a => a.email === (values as any).email);
      userStatus = userToLogin?.status;
    } else if (role === USER_ROLES.TEACHER) {
      userToLogin = mockTeachers.find(t => t.email === (values as any).email);
      userStatus = userToLogin?.status;
    }
    // For USER_ROLES.STUDENT and USER_ROLES.HOST, we assume they are always active for now.

    if (!userToLogin && (role === USER_ROLES.ADMIN || role === USER_ROLES.TEACHER)) {
        toast({
            title: "Login Failed",
            description: "Invalid email or password.",
            variant: "destructive",
        });
        return;
    }


    if (userStatus === "pending_approval") {
      toast({
        title: "Account Pending Approval",
        description: "Your account is awaiting approval from the host. Please check back later.",
        variant: "default",
        duration: 5000,
      });
      return; // Don't redirect
    } else if (userStatus === "rejected") {
      toast({
        title: "Account Rejected",
        description: "Your registration was not approved. Please contact support for more information.",
        variant: "destructive",
        duration: 5000,
      });
      return; // Don't redirect
    } else if (userStatus !== "active" && (role === USER_ROLES.ADMIN || role === USER_ROLES.TEACHER)) {
      // Catch any other non-active status for Admin/Teacher if defined later
       toast({
        title: "Login Failed",
        description: "Your account is not active. Please contact support.",
        variant: "destructive",
      });
      return;
    }


    // If active, proceed with login simulation and redirect
    toast({
      title: "Login Successful!",
      description: `Simulating login for ${role}. Redirecting...`,
    });


    switch (role) {
      case USER_ROLES.STUDENT:
        router.push("/student/dashboard");
        break;
      case USER_ROLES.TEACHER:
        router.push("/teacher/dashboard");
        break;
      case USER_ROLES.ADMIN:
        router.push("/admin/dashboard");
        break;
      case USER_ROLES.HOST:
        router.push("/host/dashboard");
        break;
      default:
        toast({
          title: "Error",
          description: "Invalid role specified for login.",
          variant: "destructive",
        });
        router.push("/"); 
    }
  };

  if (!role || !Object.values(USER_ROLES).includes(role)) {
     if (typeof window !== 'undefined') router.push('/');
     return <p>Invalid role. Redirecting...</p>;
  }

  const roleTitle = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">
          {roleTitle} Login
        </CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your portal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {role === USER_ROLES.STUDENT ? (
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID / Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your Student ID or Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="email" // This field is specific to non-student roles in this schema
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Form>
        {role === USER_ROLES.STUDENT && (
          <div className="mt-6 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register/student" className="font-medium text-primary hover:underline">
              Register here
            </Link>
          </div>
        )}
         <div className="mt-4 text-center text-sm">
            <Link href="/" className="font-medium text-muted-foreground hover:text-primary hover:underline">
              Back to Role Selection
            </Link>
          </div>
      </CardContent>
    </Card>
  );
}
