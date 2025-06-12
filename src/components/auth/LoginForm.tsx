
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react"; 
import { getAuth, signInWithEmailAndPassword, type User as FirebaseUser } from "firebase/auth"; // Firebase Auth
import { app as firebaseApp } from "@/firebase"; // Firebase app instance


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
import type { Student } from "@/lib/types"; // For fetching student profile

// Schema now always expects email for Firebase Auth with client SDK
const getLoginFormSchema = () => {
  return z.object({
    email: z.string().email("Valid email is required for login."),
    password: z.string().min(1, "Password is required"),
  });
};


export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const role = searchParams.get("role") as UserRole | null;
  const auth = getAuth(firebaseApp);

  const formSchema = getLoginFormSchema(); // Simplified schema
  type LoginFormValues = z.infer<typeof formSchema>;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
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

    let successRedirectPath = "/";
    switch (role) {
      case USER_ROLES.STUDENT: successRedirectPath = "/student/dashboard"; break;
      case USER_ROLES.TEACHER: successRedirectPath = "/teacher/dashboard"; break;
      case USER_ROLES.ADMIN: successRedirectPath = "/admin/dashboard"; break;
      case USER_ROLES.HOST: successRedirectPath = "/host/dashboard"; break;
      default: break;
    }

    try {
      // --- Firebase Client-Side Authentication ---
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        throw new Error("Firebase authentication succeeded but user object is null.");
      }

      // --- Fetch additional profile data from Firestore ---
      let userProfile: any = { // `any` for now, will be typed based on role
        id: firebaseUser.uid, // Use Firebase UID as the primary ID for lookup
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || values.email.split('@')[0], // Fallback name
        role: role,
        // Add other common fields from Firebase user if needed
      };

      if (role === USER_ROLES.STUDENT) {
        const profileRes = await fetch(`/api/students/profile?studentId=${firebaseUser.uid}`); // Fetch by UID
        if (profileRes.ok) {
          const studentData: Student = await profileRes.json();
          userProfile = { ...userProfile, ...studentData, id: studentData.id || firebaseUser.uid }; // Prefer Firestore ID if available
        } else {
          console.warn(`Could not fetch student profile for UID ${firebaseUser.uid} after Firebase login. Status: ${profileRes.status}`);
          // Proceed with basic Firebase user data, or handle as error
        }
      } else {
        // For Teacher, Admin, Host - Fetch profile from their respective Firestore collections using UID
        // Example for Teacher (similar for Admin, Host if they have Firestore profiles beyond basic auth)
        // For now, let's assume non-student roles will primarily use the info from their server-side session/token if we mix auth strategies
        // Or, more simply for now, we store basic info from Firebase Auth and expect profile to be updated.
        // For simplicity, we'll use a generic mock API for non-student profile fetching for now.
        // In a real app, you'd fetch from /api/teachers/profile (using UID), /api/admins/profile etc.

        // This part is simplified. Ideally, you'd have specific profile fetching for each role.
        // Let's assume the backend `/api/users/login` was previously also fetching this profile,
        // but now we're doing client-side Firebase Auth.
        // We'll just use the Firebase user data for now for non-students for simplicity of this step.
         if (role === USER_ROLES.TEACHER || role === USER_ROLES.ADMIN || role === USER_ROLES.HOST) {
             // In a full system, you'd fetch teacher/admin/host specific profile data here using firebaseUser.uid
             // and merge it into userProfile.
             // For now, basic data from Firebase Auth is stored.
             console.log(`${role} logged in. Profile details would be fetched from Firestore using UID: ${firebaseUser.uid}`);
         }
      }
      
      localStorage.setItem("currentUser", JSON.stringify(userProfile));
      
      toast({
        title: "Login Successful!",
        description: `Welcome back, ${userProfile.name || 'User'}! Redirecting...`,
      });
      router.push(successRedirectPath);

    } catch (error: any) {
      console.error("Firebase Login/Profile Fetch error:", error);
      let errorMessage = "Login failed. Please check your credentials.";
      if (error.code) { // Firebase Auth error codes
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = "Invalid email or password.";
            break;
          case 'auth/invalid-email':
            errorMessage = "The email address is not valid.";
            break;
          default:
            errorMessage = error.message || "An unexpected error occurred.";
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Login Failed",
        description: errorMessage,
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

  // Label changed to "Email" as Firebase Client SDK signInWithEmailAndPassword requires email
  let identifierLabel = "Email"; 
  let identifierPlaceholder = "Enter your email";


  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">
          {roleTitle} Login
        </CardTitle>
        <CardDescription className="text-center">
          Enter your email and password to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{identifierLabel}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={identifierPlaceholder} {...field} />
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
                href={`/auth/forgot-password?role=${role}&email=${form.getValues('email')||''}`}
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
