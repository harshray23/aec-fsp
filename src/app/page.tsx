
"use client";

import React, { useState, useEffect } from 'react';
import RoleSelector from "@/components/auth/RoleSelector";
import { SplashTransition } from '@/components/shared/SplashTransition';

export default function RootPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we are running on the client side
    if (typeof window !== 'undefined') {
      // Set isLoading to false immediately to avoid the artificial delay.
      // The splash screen can be shown for a very brief moment if needed,
      // but a long wait is not user-friendly.
      setIsLoading(false); 
    } else {
        // If on the server, don't show the splash screen
        setIsLoading(false);
    }
  }, []);

  // While this logic now makes the splash screen almost never appear,
  // it's kept in case a very brief loading state is desired in the future.
  if (isLoading) {
    return <SplashTransition />;
  }
  
  return <RoleSelector />;
}
