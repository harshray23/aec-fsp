
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { Suspense } from "react";

// Force this page to be dynamically rendered on the client
export const dynamic = 'force-dynamic';

function ForgotPasswordPageContent() {
  return <ForgotPasswordForm />;
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordPageContent />
    </Suspense>
  );
}

export const metadata = {
  title: "Forgot Password - AEC FSP",
};
