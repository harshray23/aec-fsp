import { AppLogo } from "@/components/shared/AppLogo";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-cover bg-center"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 z-0" />
      
      {/* Content Container */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center">
        <Link href="/" className="mb-8 transition-transform hover:scale-105">
          <AppLogo width="60" height="60" />
        </Link>
        {children}
        <footer className="mt-8 text-center text-white/70 text-sm">
          <p>&copy; {new Date().getFullYear()} Asansol Engineering College. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
