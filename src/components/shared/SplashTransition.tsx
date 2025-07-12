"use client";

import { AppLogo } from "@/components/shared/AppLogo";
import { cn } from "@/lib/utils";

export function SplashTransition() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="animate-pulse flex flex-col items-center justify-center gap-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Welcome to Portal
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            -- Asansol Engineering College
          </p>
        </div>
        <AppLogo src="/aec.png" width="1000" height="1000" className="max-w-xs md:max-w-sm" />
      </div>
    </div>
  );
}
