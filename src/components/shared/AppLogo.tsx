
interface AppLogoProps {
  width?: number | `${number}` | undefined;
  height?: number | `${number}` | undefined;
  className?: string;
}

export function AppLogo({ width = 40, height = 40, className }: AppLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="AEC FSP App Logo"
    >
      <path
        d="M12 2L2 7V17C2 18.1046 2.89543 19 4 19H20C21.1046 19 22 18.1046 22 17V7L12 2Z"
        fill="hsl(var(--primary))"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <text
        x="12"
        y="15.5"
        fontFamily="var(--font-geist-sans), sans-serif"
        fontSize="7"
        fill="hsl(var(--primary-foreground))"
        textAnchor="middle"
        fontWeight="bold"
      >
        AEC
      </text>
    </svg>
  );
}
