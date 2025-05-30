
import Image from 'next/image';

interface CollegeLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function CollegeLogo({ width = 132, height = 80, className }: CollegeLogoProps) {
  return (
    <Image
      src="/college-logo.png" // Assumes college-logo.png is in the public folder
      alt="Asansol Engineering College Logo"
      width={width}
      height={height}
      className={className}
      priority // If the logo is above the fold, consider adding priority
    />
  );
}
