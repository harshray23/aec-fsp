
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
import { admins as mockAdmins, teachers as mockTeachers } from "@/lib/mockData"; // Import mutable arrays
import type { Admin, Teacher } from "@/lib/types";

const userRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum([USER_ROLES.TEACHER, USER_ROLES.ADMIN], {
    required_error: "Role is required.",
  }),
  department: z.string().optional(), // Required only if role is teacher
  password: z.string().min(6, "Password must be at least 6 characters"),
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
  onSuccess?: () => void; 
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
    console.log("User registration form submitted by admin:", values);
    
    const userId = `${values.role.toUpperCase()}_${Date.now()}`; // Simple unique ID for mock

    if (values.role === USER_ROLES.TEACHER) {
      const newTeacher: Teacher = {
        id: userId,
        name: values.name,
        email: values.email,
        role: USER_ROLES.TEACHER,
        department: values.department!,
      };
      mockTeachers.push(newTeacher);
    } else if (values.role === USER_ROLES.ADMIN) {
      const newAdmin: Admin = {
        id: userId,
        name: values.name,
        email: values.email,
        role: USER_ROLES.ADMIN,
      };
      mockAdmins.push(newAdmin);
    }
    
    toast({
        title: "User Registration Successful!",
        description: `${values.name} has been registered as a ${values.role}.`,
    });
    form.reset();
    if (onSuccess) {
      onSuccess();
    } else {
      // Redirect to the appropriate user list page
      if (values.role === USER_ROLES.TEACHER) {
        router.push("/admin/users/teachers");
      } else if (values.role === USER_ROLES.ADMIN) {
        router.push("/admin/users/admins");
      }
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
          {form.formState.isSubmitting ? "Registering User..." : "Register User"}
        </Button>
      </form>
    </Form>
  );
}
