import type { SVGProps } from 'react';

export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width="40"
      height="40"
      aria-label="AEC FSP Portal Logo"
      {...props}
    >
      <rect width="100" height="100" rx="20" fill="hsl(var(--primary))" />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="40"
        fill="hsl(var(--primary-foreground))"
        fontFamily="var(--font-geist-sans)"
        fontWeight="bold"
      >
        AEC
      </text>
      <text
        x="50%"
        y="75%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize="20"
        fill="hsl(var(--primary-foreground))"
        fontFamily="var(--font-geist-mono)"
      >
        FSP
      </text>
    </svg>
  );
}
