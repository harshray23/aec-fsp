import { AppLogo } from "@/components/shared/AppLogo";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <Link href="/" className="mb-8 transition-transform hover:scale-105">
        <AppLogo width="60" height="60" />
      </Link>
      {children}
      <footer className="mt-8 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Asansol Engineering College. All rights reserved.</p>
      </footer>
    </div>
  );
}
