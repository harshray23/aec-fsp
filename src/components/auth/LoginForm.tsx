
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
// import { loginUser } from "@/lib/auth"; // Assuming an auth service for login

const getLoginFormSchema = (role: UserRole | null) => {
  const baseSchema = {
    password: z.string().min(1, "Password is required"),
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
    if (!role) {
      toast({ title: "Error", description: "Role is missing.", variant: "destructive" });
      return;
    }
    
    let loginApiEndpoint = "/api/users/login"; 
    if (role === USER_ROLES.STUDENT) {
      loginApiEndpoint = "/api/students/login";
    }
    
    let successRedirectPath = "/";
    switch (role) {
      case USER_ROLES.STUDENT: successRedirectPath = "/student/dashboard"; break;
      case USER_ROLES.TEACHER: successRedirectPath = "/teacher/dashboard"; break;
      case USER_ROLES.ADMIN: successRedirectPath = "/admin/dashboard"; break;
      case USER_ROLES.HOST: successRedirectPath = "/host/dashboard"; break;
      default: break;
    }

    try {
      const response = await fetch(loginApiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, role }), 
      });

      if (!response) {
        console.error("Login API error: No response received from server.");
        throw new Error("Login failed: Server did not respond.");
      }

      const data = await response.json();

      if (!response.ok) {
        console.error("Login API error response (status not OK):", data);
        throw new Error(data?.message || `Login failed with status: ${response.status}`);
      }
      
      if (data && data.user) {
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        toast({
          title: "Login Successful!",
          description: `Welcome back! Redirecting...`,
        });
        router.push(successRedirectPath);
      } else {
        console.error("Login API success, but no user data in response:", data);
        throw new Error("Login successful, but user data was not returned correctly from the server.");
      }

    } catch (error: any) {
      console.error("Login submit error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred. Please try again or check server logs.",
        variant: "destructive",
      });
    } 
  };

  if (!role || !Object.values(USER_ROLES).includes(role)) {
     if (typeof window !== 'undefined') router.push('/');
     return <p>Invalid role. Redirecting...</p>;
  }

  let roleTitle = role.charAt(0).toUpperCase() + role.slice(1);
  if (role === USER_ROLES.HOST) {
    roleTitle = "Management";
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">
          {roleTitle} Login
        </CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your account.
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
                name="email" 
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
