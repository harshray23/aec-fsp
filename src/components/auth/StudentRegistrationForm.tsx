
"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuth, createUserWithEmailAndPassword, type User as FirebaseUser } from "firebase/auth"; // Firebase Auth
import { app as firebaseApp } from "@/firebase"; // Firebase app instance

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem, 
  FormLabel as RHFFormLabel, 
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DEPARTMENTS, USER_ROLES } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
// mockStudents removed, student existence check is via API
import type { Student } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MailCheck, SmartphoneNfc, Loader2 } from "lucide-react"; // Added Loader2

const studentRegistrationSchema = z.object({
  studentId: z.string().regex(/^AEC\/\d{4}\/\d{4}$/, "Student ID must be in the format AEC/XXXX/YYYY."),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  rollNumber: z.string().min(1, "Roll Number is required"),
  registrationNumber: z.string().min(1, "Registration Number is required"),
  department: z.string().min(1, "Department is required"),
  phoneNumber: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  whatsappNumber: z.string().regex(/^\d{10}$/, "WhatsApp number must be 10 digits").optional().or(z.literal('')),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type StudentRegistrationFormValues = z.infer<typeof studentRegistrationSchema>;

const MOCK_EMAIL_OTP = "123456"; // Kept for simulated email step if desired, but Firebase Auth handles email verification
const MOCK_PHONE_OTP = "654321"; // Kept for simulated phone step if desired

export default function StudentRegistrationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [registrationStep, setRegistrationStep] = useState<"form" | "finalizing">("form"); // Simplified steps
  const [currentUserDetails, setCurrentUserDetails] = useState<StudentRegistrationFormValues | null>(null);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const auth = getAuth(firebaseApp);

  const form = useForm<StudentRegistrationFormValues>({
    resolver: zodResolver(studentRegistrationSchema),
    defaultValues: {
      studentId: "",
      name: "",
      email: "",
      rollNumber: "",
      registrationNumber: "",
      department: "",
      phoneNumber: "",
      whatsappNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmitDetails = async (values: StudentRegistrationFormValues) => {
    setIsSubmittingFinal(true); // Use a single submission state
    setCurrentUserDetails(values); // Store details for Firebase Auth creation

    try {
      // 1. Pre-check existence in Firestore via API
      const preCheckResponse = await fetch('/api/students/check-existence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: values.studentId, email: values.email }),
      });

      if (!preCheckResponse.ok) {
        const errorData = await preCheckResponse.json().catch(() => ({ message: "Pre-registration check failed."}));
        throw new Error(errorData.message);
      }
      await preCheckResponse.json(); 

      // 2. Create user in Firebase Authentication
      let firebaseUser: FirebaseUser;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        firebaseUser = userCredential.user;
        // Optionally, send email verification here if not automatically handled or if you want custom flow
        // await sendEmailVerification(firebaseUser);
        // toast({ title: "Verification Email Sent", description: "Please check your email to verify your account." });
      } catch (authError: any) {
        let errorMessage = "Firebase Authentication failed: ";
        if (authError.code === 'auth/email-already-in-use') {
          errorMessage += "This email is already registered in Firebase Authentication.";
        } else {
          errorMessage += authError.message;
        }
        throw new Error(errorMessage);
      }

      // 3. If Firebase Auth creation is successful, register student details in Firestore via API
      const studentApiPayload = {
        ...values,
        uid: firebaseUser.uid, // Pass Firebase UID
        isEmailVerified: firebaseUser.emailVerified, // Pass Firebase email verification status
        isPhoneVerified: false, // Phone verification is still mock/manual for now
      };
      delete (studentApiPayload as any).password; // Don't send password to Firestore registration API
      delete (studentApiPayload as any).confirmPassword;


      const registerResponse = await fetch('/api/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentApiPayload),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json().catch(() => ({ message: "Failed to save student profile to database."}));
        // Potentially delete the Firebase Auth user if Firestore save fails to avoid orphaned auth account
        // await firebaseUser.delete(); 
        throw new Error(errorData.message);
      }
      
      await registerResponse.json(); 
      
      toast({
        title: "Registration Successful!",
        description: "Your account has been created. You can now log in.",
      });
      router.push("/login?role=student");

    } catch (error: any) {
       toast({
        title: "Registration Error",
        description: error.message || "Could not complete registration.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingFinal(false);
    }
  };


  // Email & Phone verification steps are removed as Firebase Auth handles email verification,
  // and phone verification would require a real SMS service for Firebase Phone Auth.
  // The flow is now: Fill Form -> Submit (creates Firebase Auth user & Firestore profile).

  return (
    <Card className="w-full max-w-2xl shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">Student Registration</CardTitle>
        <CardDescription className="text-center">
          Create your account to access the FSP system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}> 
          <form onSubmit={form.handleSubmit(onSubmitDetails)} className="space-y-4">
            <ScrollArea className="h-[50vh] pr-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <RHFFormLabel>Student ID</RHFFormLabel>
                    <FormControl>
                      <Input placeholder="e.g., AEC/2021/0015" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <RHFFormLabel>Full Name</RHFFormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <RHFFormLabel>Email Address</RHFFormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rollNumber"
                render={({ field }) => (
                  <FormItem>
                    <RHFFormLabel>Roll Number</RHFFormLabel>
                    <FormControl>
                      <Input placeholder="Enter your roll number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <RHFFormLabel>Registration Number</RHFFormLabel>
                    <FormControl>
                      <Input placeholder="Enter your registration number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <RHFFormLabel>Department</RHFFormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEPARTMENTS.map(dept => (
                          <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <RHFFormLabel>Phone Number</RHFFormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Enter your 10-digit phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <RHFFormLabel>WhatsApp Number (Optional)</RHFFormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Enter your 10-digit WhatsApp number" {...field} />
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
                    <RHFFormLabel>Password</RHFFormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Create a password (min. 6 characters)" {...field} />
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
                    <RHFFormLabel>Confirm Password</RHFFormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            </ScrollArea>
            <Button type="submit" className="w-full mt-6" disabled={isSubmittingFinal || form.formState.isSubmitting}>
              {isSubmittingFinal || form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : "Register Account"}
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login?role=student" className="font-medium text-primary hover:underline">
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
