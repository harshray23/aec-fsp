
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
        <AppLogo width="160" height="160" />
      </div>
    </div>
  );
}
