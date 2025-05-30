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

const getLoginFormSchema = (role: UserRole | null) => {
  const baseSchema = {
    password: z.string().min(6, "Password must be at least 6 characters"),
  };

  if (role === USER_ROLES.STUDENT) {
    return z.object({
      ...baseSchema,
      identifier: z.string().min(1, "Student ID or Email is required"), // Can be Student ID or Email
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
    // Placeholder for actual login logic
    console.log("Login form submitted with values:", values, "and role:", role);
    toast({
      title: "Login Attempt",
      description: `Simulating login for ${role} with provided credentials.`,
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Redirect based on role
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
      default:
        toast({
          title: "Error",
          description: "Invalid role specified for login.",
          variant: "destructive",
        });
        router.push("/"); // Redirect to role selection if role is invalid
    }
  };

  if (!role || !Object.values(USER_ROLES).includes(role)) {
     // This case should ideally be handled by redirecting to role selection page or showing an error.
     // For now, we can show a message or redirect.
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
