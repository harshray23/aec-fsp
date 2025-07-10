"use client";

import { AppLogo } from "@/components/shared/AppLogo";
import { cn } from "@/lib/utils";

export function SplashTransition() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="animate-pulse flex flex-col items-center justify-center gap-6">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Welcome
        </h1>
        <AppLogo src="/aec.jpg" width="1000" height="1000" className="max-w-xs md:max-w-sm" />
      </div>
    </div>
  );
}
