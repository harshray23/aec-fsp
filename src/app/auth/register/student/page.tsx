import StudentRegistrationForm from "@/components/auth/StudentRegistrationForm";
import { Suspense } from "react";

export default function StudentRegistrationPage() {
  return (
    <Suspense fallback={<div>Loading registration form...</div>}>
      <StudentRegistrationForm />
    </Suspense>
  );
}

export const metadata = {
  title: "Student Registration - AEC FSP Portal",
};
