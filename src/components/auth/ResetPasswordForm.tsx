
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { app as firebaseApp } from "@/firebase";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const auth = getAuth(firebaseApp);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const actionCode = searchParams.get("oobCode");

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const checkCode = async () => {
      if (!actionCode) {
        setError("Invalid password reset link. It might be missing the required code.");
        setIsLoading(false);
        return;
      }
      try {
        const userEmail = await verifyPasswordResetCode(auth, actionCode);
        setEmail(userEmail);
      } catch (e: any) {
        console.error("Invalid password reset code:", e);
        setError("This password reset link is invalid or has expired. Please request a new one.");
      } finally {
        setIsLoading(false);
      }
    };
    checkCode();
  }, [actionCode, auth]);


  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!actionCode) {
      toast({ title: "Error", description: "Invalid action code. Please try again.", variant: "destructive" });
      return;
    }

    try {
      await confirmPasswordReset(auth, actionCode, values.newPassword);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. You can now log in.",
      });
      // A role isn't available from the reset link, so we send them to the main page.
      // A small inconvenience for a much more secure flow.
      router.push(`/`);
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast({
        title: "Request Failed",
        description: "This link may have expired. Please request a new password reset link.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
      return (
          <Card className="w-full max-w-md shadow-2xl">
              <CardHeader>
                  <CardTitle className="text-3xl font-bold text-center">Verifying Link...</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center items-center h-24">
                  <Loader2 className="h-8 w-8 animate-spin" />
              </CardContent>
          </Card>
      )
  }

  if (error || !email) {
      return (
          <Card className="w-full max-w-md shadow-2xl">
               <CardHeader>
                  <CardTitle className="text-3xl font-bold text-center">Invalid Link</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error || "Could not verify your email from this link."}</AlertDescription>
                </Alert>
                <div className="mt-4 text-center text-sm">
                    <Link href="/" className="font-medium text-primary hover:underline">
                        Back to Home
                    </Link>
                </div>
              </CardContent>
          </Card>
      )
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">Reset Password</CardTitle>
        <CardDescription className="text-center">
          Set a new password for your account: <span className="font-semibold">{email}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter new password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirm new password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </Form>
         <div className="mt-4 text-center text-sm">
            <Link href="/" className="font-medium text-muted-foreground hover:text-primary hover:underline">
              Back to Role Selection
            </Link>
          </div>
      </CardContent>
    </Card>
  );
}
