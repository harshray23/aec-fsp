
import type { SVGProps } from 'react';

export function CollegeLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 220 100" // Adjusted viewBox for text fitting
      width="132" // Default width (maintaining approx 2.2:1 ratio)
      height="60"  // Default height
      aria-label="Asansol Engineering College Logo Placeholder"
      {...props}
    >
      <rect width="220" height="100" rx="10" fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth="2" />
      <text
        x="50%"
        y="38%" // Adjusted y for better spacing
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="16" // Slightly smaller for better fit
        fill="hsl(var(--primary))"
        fontFamily="var(--font-geist-sans)"
        fontWeight="bold"
      >
        ASANSOL ENGINEERING
      </text>
      <text
        x="50%"
        y="62%" // Adjusted y for better spacing
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="16" // Slightly smaller for better fit
        fill="hsl(var(--primary))"
        fontFamily="var(--font-geist-sans)"
        fontWeight="bold"
      >
        COLLEGE
      </text>
      <text
        x="50%"
        y="85%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="12"
        fill="hsl(var(--muted-foreground))"
        fontFamily="var(--font-geist-mono)"
      >
        ESTD 1998
      </text>
    </svg>
  );
}
