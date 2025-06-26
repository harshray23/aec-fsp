
import Image from "next/image";

interface AppLogoProps {
  width?: number | `${number}` | undefined;
  height?: number | `${number}` | undefined;
  className?: string;
}

export function AppLogo({ width = 40, height = 40, className }: AppLogoProps) {
  return (
    <Image
      src="/logo1.avif" // This is the path to your logo in the public folder
      alt="AEC FSP App Logo"
      width={width}
      height={height}
      className={className}
      priority // Add priority if the logo is above the fold
    />
  );
}
