
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react"; // Import useEffect

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
    password: z.string().min(1, "Password is required"),
  };

  if (role === USER_ROLES.STUDENT) {
    return z.object({
      ...baseSchema,
      identifier: z.string().min(1, "Student ID or Email is required"),
    });
  } else if (role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN || role === USER_ROLES.HOST) {
    return z.object({
      ...baseSchema,
      identifier: z.string().min(1, "Email or Username is required"),
    });
  }
  // Fallback for invalid role, though redirection should handle this
  return z.object({ ...baseSchema, identifier: z.string() });
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
    // Set default values based on the schema structure (always identifier + password)
    defaultValues: { identifier: "", password: "" },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') { 
      if (!role || !Object.values(USER_ROLES).includes(role)) {
        router.push('/');
      }
    }
  }, [role, router]);


  const onSubmit = async (values: LoginFormValues) => {
    if (!role) {
      toast({ title: "Error", description: "Role is missing.", variant: "destructive" });
      return;
    }

    let loginApiEndpoint = "/api/users/login"; // For Admin, Teacher, Host
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
        // Backend now expects 'identifier' for Teacher/Admin/Host as well
        body: JSON.stringify({ ...values, role }), 
      });

      const responseBodyText = await response.text();
      let parsedDataForErrorLog: any = null;

      if (!response.ok) {
        let errorMessage = `Login attempt failed. (Status: ${response.status} ${response.statusText || ''})`.trim();
        try {
          if (responseBodyText && responseBodyText.trim()) {
            parsedDataForErrorLog = JSON.parse(responseBodyText);
            if (parsedDataForErrorLog && typeof parsedDataForErrorLog === 'object' && parsedDataForErrorLog.message) {
              errorMessage = parsedDataForErrorLog.message;
            } else if (response.status === 401) {
                errorMessage = "Invalid credentials. Please check your identifier and password.";
            } else if (parsedDataForErrorLog && typeof parsedDataForErrorLog === 'object' && Object.keys(parsedDataForErrorLog).length === 0) {
                errorMessage = `Login failed (Status: ${response.status}). The server returned an empty error object.`;
            }
          } else if (response.status === 401) {
             errorMessage = "Invalid credentials. Please check your identifier and password.";
          } else {
            errorMessage = `Login failed (Status: ${response.status} ${response.statusText || ''}). Server returned an empty error response.`.trim();
          }
        } catch (jsonError) {
          console.warn("Could not parse error response as JSON from login API.", { status: response.status, body: responseBodyText, error: jsonError });
          if (responseBodyText.trim().toLowerCase().startsWith("<!doctype html")) {
            errorMessage = `Login failed: Server returned an unexpected HTML response. (${response.status}). Please check server logs.`;
          } else if (responseBodyText.length > 0 && responseBodyText.length < 200) {
            errorMessage = responseBodyText.substring(0, 150);
          }
        }
        console.error("Login API error details:", { status: response.status, parsedErrorBody: parsedDataForErrorLog, rawErrorBody: responseBodyText });
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      let userLoginData;
      try {
        if (!responseBodyText.trim()) {
           console.error("Login API success, but empty response body.");
           toast({
             title: "Login Error",
             description: "Login successful, but received an empty response from the server.",
             variant: "destructive",
           });
           return;
        }
        userLoginData = JSON.parse(responseBodyText);
      } catch (jsonError) {
        console.error("Login API success, but failed to parse response as JSON.", {status: response.status, body: responseBodyText, error: jsonError});
        toast({
          title: "Login Error",
          description: "Login was successful, but server response was malformed. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      if (userLoginData && userLoginData.user) {
        localStorage.setItem("currentUser", JSON.stringify(userLoginData.user));
        toast({
          title: "Login Successful!",
          description: `Welcome back! Redirecting...`,
        });
        router.push(successRedirectPath);
      } else {
        console.error("Login API success, but no user data in response:", userLoginData);
        toast({
            title: "Login Error",
            description: "Login was successful, but user data was not returned correctly. Please contact support.",
            variant: "destructive",
        });
        return;
      }

    } catch (error: any) {
      console.error("Login submit error (outer catch):", error);
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!role || !Object.values(USER_ROLES).includes(role)) {
     return <p>Invalid role. Redirecting...</p>;
  }

  let roleTitle = role.charAt(0).toUpperCase() + role.slice(1);
  if (role === USER_ROLES.HOST) {
    roleTitle = "Management";
  }

  let identifierLabel = "Email";
  let identifierPlaceholder = "Enter your email";

  if (role === USER_ROLES.STUDENT) {
    identifierLabel = "Student ID / Email";
    identifierPlaceholder = "Enter your Student ID or Email";
  } else if (role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN || role === USER_ROLES.HOST) {
    identifierLabel = "Email / Username";
    identifierPlaceholder = "Enter your Email or Username";
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
            <FormField
              control={form.control}
              name="identifier" // Always use 'identifier' for the form field name
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{identifierLabel}</FormLabel>
                  <FormControl>
                    <Input placeholder={identifierPlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
             <div className="flex items-center justify-end text-sm">
              <Link
                href={`/auth/forgot-password?role=${role}`}
                className="font-medium text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
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
