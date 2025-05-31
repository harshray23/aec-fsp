
"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DEPARTMENTS, USER_ROLES, SECTIONS, SECTION_OPTIONS, type Section } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { students as mockStudents } from "@/lib/mockData";
import type { Student } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MailCheck, SmartphoneNfc } from "lucide-react";

const studentRegistrationSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  rollNumber: z.string().min(1, "Roll Number is required"),
  registrationNumber: z.string().min(1, "Registration Number is required"),
  department: z.string().min(1, "Department is required"),
  section: z.enum(SECTIONS, { required_error: "Section is required" }),
  phoneNumber: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  whatsappNumber: z.string().regex(/^\d{10}$/, "WhatsApp number must be 10 digits").optional().or(z.literal('')),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type StudentRegistrationFormValues = z.infer<typeof studentRegistrationSchema>;

const MOCK_EMAIL_OTP = "123456";
const MOCK_PHONE_OTP = "654321";

export default function StudentRegistrationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [registrationStep, setRegistrationStep] = useState<"form" | "emailVerify" | "phoneVerify">("form");
  const [currentUserDetails, setCurrentUserDetails] = useState<StudentRegistrationFormValues | null>(null);
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");

  const form = useForm<StudentRegistrationFormValues>({
    resolver: zodResolver(studentRegistrationSchema),
    defaultValues: {
      studentId: "",
      name: "",
      email: "",
      rollNumber: "",
      registrationNumber: "",
      department: "",
      section: undefined,
      phoneNumber: "",
      whatsappNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmitDetails = async (values: StudentRegistrationFormValues) => {
    console.log("Student registration form submitted:", values);
    setCurrentUserDetails(values);
    setRegistrationStep("emailVerify");
    toast({
      title: "Details Submitted",
      description: "A (mock) verification code has been sent to your email.",
    });
  };

  const handleEmailVerify = () => {
    if (emailOtp === MOCK_EMAIL_OTP) {
      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified.",
      });
      setRegistrationStep("phoneVerify");
    } else {
      toast({
        title: "Invalid Code",
        description: "The email verification code is incorrect. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleSendPhoneOtp = () => {
    // Simulate sending OTP
    toast({
        title: "Phone OTP Sent (Simulated)",
        description: `A (mock) OTP has been sent to ${currentUserDetails?.phoneNumber}. It is ${MOCK_PHONE_OTP}`,
    });
  }

  const handlePhoneVerifyAndRegister = () => {
    if (phoneOtp === MOCK_PHONE_OTP && currentUserDetails) {
      const newStudent: Student = {
        id: currentUserDetails.studentId,
        studentId: currentUserDetails.studentId,
        name: currentUserDetails.name,
        email: currentUserDetails.email,
        rollNumber: currentUserDetails.rollNumber,
        registrationNumber: currentUserDetails.registrationNumber,
        department: currentUserDetails.department,
        section: currentUserDetails.section,
        phoneNumber: currentUserDetails.phoneNumber,
        whatsappNumber: currentUserDetails.whatsappNumber || undefined,
        role: USER_ROLES.STUDENT,
        isEmailVerified: true, 
        isPhoneVerified: true,
      };
      mockStudents.push(newStudent);
      toast({
        title: "Registration Complete!",
        description: "Your phone has been verified and your account is created. You can now log in.",
      });
      router.push("/auth/login?role=student");
    } else {
      toast({
        title: "Invalid Phone Code",
        description: "The phone verification code is incorrect. Please try again.",
        variant: "destructive",
      });
    }
  };


  if (registrationStep === "emailVerify" && currentUserDetails) {
    return (
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center flex items-center justify-center gap-2"><MailCheck /> Email Verification</CardTitle>
          <CardDescription className="text-center">
            A verification code was (simulated to be) sent to {currentUserDetails.email}. Please enter it below. (Hint: {MOCK_EMAIL_OTP})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormItem>
            <FormLabel htmlFor="emailOtp">Email Verification Code</FormLabel>
            <Input 
              id="emailOtp" 
              placeholder="Enter 6-digit code" 
              value={emailOtp}
              onChange={(e) => setEmailOtp(e.target.value)}
              maxLength={6}
            />
          </FormItem>
          <Button onClick={handleEmailVerify} className="w-full">Verify Email</Button>
          <Button variant="outline" onClick={() => {
             toast({ title: "Code Resent (Simulated)", description: "Another verification code has been (simulated) sent."});
          }} className="w-full">Resend Code</Button>
          <Button variant="link" onClick={() => setRegistrationStep("form")} className="w-full text-muted-foreground">Back to Form</Button>
        </CardContent>
      </Card>
    );
  }
  
  if (registrationStep === "phoneVerify" && currentUserDetails) {
    return (
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center flex items-center justify-center gap-2"><SmartphoneNfc /> Phone Verification</CardTitle>
          <CardDescription className="text-center">
            Verify your phone number: {currentUserDetails.phoneNumber}. (Mock OTP is {MOCK_PHONE_OTP})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <Button onClick={handleSendPhoneOtp} className="w-full" variant="outline">Send Verification Code (SMS)</Button>
          <FormItem>
            <FormLabel htmlFor="phoneOtp">SMS Verification Code</FormLabel>
            <Input 
              id="phoneOtp" 
              placeholder="Enter 6-digit code" 
              value={phoneOtp}
              onChange={(e) => setPhoneOtp(e.target.value)}
              maxLength={6}
            />
          </FormItem>
          <Button onClick={handlePhoneVerifyAndRegister} className="w-full">Verify Phone & Register</Button>
           <Button variant="link" onClick={() => setRegistrationStep("emailVerify")} className="w-full text-muted-foreground">Back to Email Verification</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center">Student Registration</CardTitle>
        <CardDescription className="text-center">
          Create your account to access the FSP Portal.
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
                    <FormLabel>Student ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your Student ID" {...field} />
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
                    <FormLabel>Full Name</FormLabel>
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
                    <FormLabel>Email Address</FormLabel>
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
                    <FormLabel>Roll Number</FormLabel>
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
                    <FormLabel>Registration Number</FormLabel>
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
                    <FormLabel>Department</FormLabel>
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
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your section" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SECTION_OPTIONS.map(secOpt => (
                          <SelectItem key={secOpt.value} value={secOpt.value}>{secOpt.label}</SelectItem>
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
                    <FormLabel>Phone Number</FormLabel>
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
                    <FormLabel>WhatsApp Number (Optional)</FormLabel>
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Create a password" {...field} />
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
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            </ScrollArea>
            <Button type="submit" className="w-full mt-6" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Submitting..." : "Proceed to Verification"}
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link href="/auth/login?role=student" className="font-medium text-primary hover:underline">
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
