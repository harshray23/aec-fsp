
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Suspense } from "react";

// Force this page to be dynamically rendered on the client
export const dynamic = 'force-dynamic';

function ResetPasswordPageContent() {
  return <ResetPasswordForm />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}

export const metadata = {
  title: "Reset Password - AEC FSP",
};
