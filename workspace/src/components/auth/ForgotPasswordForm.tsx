
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { app as firebaseApp } from "@/firebase/index";

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

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const role = searchParams.get("role") as UserRole | null;
  const auth = getAuth(firebaseApp);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    if (!role) {
      toast({ title: "Error", description: "Role is missing.", variant: "destructive" });
      return;
    }

    try {
      // Step 1: Pre-flight check with our backend API to ensure the user exists for the given role.
      const preCheckResponse = await fetch('/api/auth/request-password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: values.email, role: role }),
      });

      if (!preCheckResponse.ok) {
          const errorData = await preCheckResponse.json().catch(() => ({ message: 'Could not verify your email for the selected role.'}));
          throw new Error(errorData.message);
      }

      // Step 2: If the pre-flight check is successful, send the actual Firebase password reset email.
      await sendPasswordResetEmail(auth, values.email);
      
      toast({
        title: "Password Reset Email Sent",
        description: `If an account exists for ${values.email} as a ${role}, you will receive an email with instructions to reset your password.`,
      });

      // Optionally, redirect the user after sending the email
      router.push(`/login?role=${role}`);

    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast({
        title: "Request Failed",
        description: error.message || "An error occurred. Please check the email address and try again.",
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
        <CardTitle className="text-3xl font-bold text-center">Forgot Password</CardTitle>
        <CardDescription className="text-center">
          Enter the email address associated with your {roleTitle} account.
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
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center text-sm">
          Remember your password?{" "}
          <Link href={`/login?role=${role}`} className="font-medium text-primary hover:underline">
            Login here
          </Link>
        </div>
        <div className="mt-4 text-center text-sm">
          <Link href="/" className="font-medium text-muted-foreground hover:text-primary hover:underline">
            Back to Role Selection
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
