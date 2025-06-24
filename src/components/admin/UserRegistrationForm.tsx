
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { USER_ROLES, DEPARTMENTS, type UserRole } from "@/lib/constants";
import { Checkbox } from "@/components/ui/checkbox";

const userRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum([USER_ROLES.TEACHER, USER_ROLES.ADMIN], {
    required_error: "Role is required.",
  }),
  department: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  bypassApproval: z.boolean().default(false),
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
      bypassApproval: false,
    },
  });

  const selectedRole = form.watch("role");
  const isBypassingApproval = form.watch("bypassApproval");

  const onSubmit = async (values: UserRegistrationFormValues) => {
    try {
      const response = await fetch('/api/admin/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to register user (${response.status})`);
      }
      
      toast({
          title: "User Registration Submitted",
          description: result.message,
      });
      form.reset();
      if (onSuccess) {
        onSuccess(values.role as 'teacher' | 'admin');
      } else {
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

        <FormField
          control={form.control}
          name="bypassApproval"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm bg-muted/50">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="bypassApproval"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <label
                  htmlFor="bypassApproval"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Activate user immediately
                </label>
                <p className="text-xs text-muted-foreground">
                  Bypasses management approval. An automatic username will be generated.
                </p>
              </div>
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Submitting..." : (isBypassingApproval ? "Register and Activate" : "Submit for Approval")}
        </Button>
      </form>
    </Form>
  );
}
