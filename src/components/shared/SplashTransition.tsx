import React from 'react';
import { AppLogo } from '@/components/shared/AppLogo';

export function SplashTransition() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <div className="animate-pulse flex flex-col items-center justify-center gap-4">
        <AppLogo src="/aec.jpg" width="150" height="150" />
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-primary">
            Welcome to FSP Portal of
          </h1>
          <p className="text-lg text-muted-foreground">
            Asansol Engineering College
          </p>
        </div>
      </div>
    </div>
  );
}
