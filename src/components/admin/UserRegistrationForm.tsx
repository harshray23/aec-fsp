
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { useToast } from "@/hooks/use-toast";
import { USER_ROLES, DEPARTMENTS, type UserRole } from "@/lib/constants";
// mockData imports removed as we will use API
// import { admins as mockAdmins, teachers as mockTeachers } from "@/lib/mockData"; 
// import type { Admin, Teacher } from "@/lib/types";

const userRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum([USER_ROLES.TEACHER, USER_ROLES.ADMIN], {
    required_error: "Role is required.",
  }),
  department: z.string().optional(), // Required only if role is teacher
  password: z.string().min(6, "Password must be at least 6 characters"), // Password is for form validation, not stored directly in Firestore by this API
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine(data => data.role !== USER_ROLES.TEACHER || (data.role === USER_ROLES.TEACHER && !!data.department), {
  message: "Department is required for teachers",
  path: ["department"],
});

type UserRegistrationFormValues = z.infer<typeof userRegistrationSchema>;

interface UserRegistrationFormProps {
  onSuccess?: (role?: 'teacher' | 'admin') => void; 
}

export default function UserRegistrationForm({ onSuccess }: UserRegistrationFormProps) {
  const router = useRouter(); 
  const { toast } = useToast();

  const form = useForm<UserRegistrationFormValues>({
    resolver: zodResolver(userRegistrationSchema),
    defaultValues: {
      name: "",
      email: "",
      role: undefined, 
      department: "",
      password: "",
      confirmPassword: "",
    },
  });

  const selectedRole = form.watch("role");

  const onSubmit = async (values: UserRegistrationFormValues) => {
    try {
      const response = await fetch('/api/admin/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values), // Send all form values, API will pick what it needs
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to register user (${response.status})`);
      }
      
      toast({
          title: "User Registration Submitted",
          description: `${values.name} has been registered as a ${values.role} and is awaiting host approval.`,
      });
      form.reset();
      if (onSuccess) {
        onSuccess(values.role as 'teacher' | 'admin');
      } else {
        // Default redirect logic if no onSuccess provided
        if (values.role === USER_ROLES.TEACHER) {
          router.push("/admin/users/teachers");
        } else if (values.role === USER_ROLES.ADMIN) {
          router.push("/admin/users/admins");
        }
      }
    } catch (error: any) {
      toast({
        title: "Registration Error",
        description: error.message || "Could not submit user registration.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter user's full name" {...field} />
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
                <Input type="email" placeholder="Enter user's email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={USER_ROLES.TEACHER}>Teacher</SelectItem>
                  <SelectItem value={USER_ROLES.ADMIN}>Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        {selectedRole === USER_ROLES.TEACHER && (
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher's department" />
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
        )}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Create a password for the user" {...field} />
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
                <Input type="password" placeholder="Confirm the password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Submitting Registration..." : "Submit for Approval"}
        </Button>
      </form>
    </Form>
  );
}
