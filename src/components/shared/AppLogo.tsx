
import Image from 'next/image';
import type { SVGProps } from 'react'; // Keep for prop compatibility if used elsewhere, though SVG specific parts are removed

interface AppLogoProps {
  width?: number | `${number}` | undefined;
  height?: number | `${number}` | undefined;
  className?: string;
}

export function AppLogo({ width = 40, height = 40, className }: AppLogoProps) {
  return (
    <Image
      src="/logo1.avif" // Updated to logo1.avif
      alt="AEC FSP App Logo"
      width={Number(width)}
      height={Number(height)}
      style={{ width: 'auto', height: 'auto' }}
      className={className}
      priority // Consider adding priority if this logo is above the fold
    />
  );
}

