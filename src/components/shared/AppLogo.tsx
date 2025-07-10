
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  width?: number | `${number}` | undefined;
  height?: number | `${number}` | undefined;
  className?: string;
}

export function AppLogo({ width = 40, height = 40, className }: AppLogoProps) {
  return (
    <Image
      src="/aec.jpg"
      alt="Asansol Engineering College Logo"
      width={width}
      height={height}
      className={cn("rounded-md", className)}
      priority
    />
  );
}
