
import StudentRegistrationForm from "@/components/auth/StudentRegistrationForm";
import { Suspense } from "react";

// Force this page to be dynamically rendered on the client
export const dynamic = 'force-dynamic';

export default function StudentRegistrationPage() {
  return (
    <Suspense fallback={<div>Loading registration form...</div>}>
      <StudentRegistrationForm />
    </Suspense>
  );
}

export const metadata = {
  title: "Student Registration - AEC FSP",
};
