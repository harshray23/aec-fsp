
import type {NextConfig} from 'next';

// This file should ideally be deleted. 
// The main next.config.ts at the project root is the one that should be used.
const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // allowedDevOrigins is now a top-level property, not inside experimental
  },
  allowedDevOrigins: [
    'https://9003-firebase-studio-1748625231387.cluster-fkltigo73ncaixtmokrzxhwsfc.cloudworkstations.dev',
  ],
};

export default nextConfig;
