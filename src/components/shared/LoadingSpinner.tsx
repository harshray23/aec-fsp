
"use client";

import React from 'react';
import Lottie from 'lottie-react';
import animationData from '../../../public/loading.json'; 
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

export function LoadingSpinner({ className, size = 50 }: LoadingSpinnerProps) {
  const style = {
    height: size,
    width: size,
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Lottie animationData={animationData} style={style} loop={true} />
    </div>
  );
}
