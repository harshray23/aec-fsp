import React from 'react';
import { AppLogo } from '@/components/shared/AppLogo';
import { LoadingSpinner } from './LoadingSpinner';

export function SplashTransition() {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-cover bg-center"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      {/* Content Container */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="animate-pulse">
            <AppLogo width={150} height={150} />
          </div>
          <div className="text-center bg-black/30 backdrop-blur-sm p-6 rounded-lg mt-4">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Welcome to FSP Portal of
            </h1>
            <p className="text-lg text-white/80">
              Asansol Engineering College
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
