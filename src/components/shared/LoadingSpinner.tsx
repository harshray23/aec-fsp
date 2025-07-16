"use client";

import React from 'react';
import Lottie from "lottie-react";
import loadingAnimation from "../../../public/loading.json";
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

export function LoadingSpinner({ className, size = 120 }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Lottie
        animationData={loadingAnimation}
        loop={true}
        style={{ width: size, height: size }}
      />
    </div>
  );
}
