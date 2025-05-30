
import Image from 'next/image';

interface CollegeLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function CollegeLogo({ width = 132, height = 80, className }: CollegeLogoProps) {
  return (
    <Image
      src="https://placehold.co/202x246.png" // Placeholder for your logo
      alt="Asansol Engineering College Logo"
      width={width}
      height={height}
      className={className}
      data-ai-hint="college crest" // Hint for AI to find a similar image if needed
      priority // If the logo is above the fold, consider adding priority
    />
  );
}
