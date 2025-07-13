import Image from 'next/image';
import {cn} from '@/lib/utils';

interface AppLogoProps {
  src?: string;
  width?: number | `${number}` | undefined;
  height?: number | `${number}` | undefined;
  className?: string;
}

export function AppLogo({
  src = '/AEC.jpg',
  width = 40,
  height = 40,
  className,
}: AppLogoProps) {
  return (
    <Image
      src={src}
      alt="Asansol Engineering College Logo"
      width={width}
      height={height}
      className={cn('rounded-md', className)}
      priority
    />
  );
}
