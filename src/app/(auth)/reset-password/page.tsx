
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Suspense } from "react";

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
