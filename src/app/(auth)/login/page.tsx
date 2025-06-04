
import LoginForm from "@/components/auth/LoginForm";
import { Suspense } from "react";

function LoginPageContent() {
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading login form...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}

export const metadata = {
  title: "Login - AEC FSP",
};

