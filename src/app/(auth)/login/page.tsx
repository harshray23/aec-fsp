
import LoginForm from "@/components/auth/LoginForm";
import { Suspense } from "react";

// Force this page to be dynamically rendered on the client
export const dynamic = 'force-dynamic';

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
