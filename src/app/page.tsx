
"use client";

import React, { useState, useEffect } from 'react';
import RoleSelector from "@/components/auth/RoleSelector";
import { SplashTransition } from '@/components/shared/SplashTransition';

export default function RootPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // Show splash screen for 3 seconds

    return () => clearTimeout(timer); // Cleanup timer on component unmount
  }, []);

  if (isLoading) {
    return <SplashTransition />;
  }
  
  return <RoleSelector />;
}
