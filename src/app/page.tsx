
"use client";

import React, { useState, useEffect } from 'react';
import RoleSelector from "@/components/auth/RoleSelector";
import { SplashTransition } from '@/components/shared/SplashTransition';

export default function RootPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This effect ensures the splash screen is shown for a bit on the client.
    if (typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 3000); // Show splash for 3 seconds

      return () => clearTimeout(timer);
    } else {
        // If on the server, don't show the splash screen
        setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return <SplashTransition />;
  }
  
  return <RoleSelector />;
}
