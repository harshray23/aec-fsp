"use client";

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

export function LoadingSpinner({ className, size = 50 }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Image
        src="/AEC.jpg"
        alt="Loading..."
        width={size}
        height={size}
        className="animate-pulse rounded-md"
      />
    </div>
  );
}
