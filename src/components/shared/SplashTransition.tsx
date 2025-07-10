
"use client";

import { AppLogo } from "@/components/shared/AppLogo";

export function SplashTransition() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="animate-pulse">
        <AppLogo width="120" height="120" />
      </div>
    </div>
  );
}
