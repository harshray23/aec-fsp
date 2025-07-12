
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      'localhost',
      '9003-firebase-studio-1748625231387.cluster-fkltigo73ncaixtmokrzxhwsfc.cloudworkstations.dev',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: [
    'https://9003-firebase-studio-1748625231387.cluster-fkltigo73ncaixtmokrzxhwsfc.cloudworkstations.dev',
  ],
  async headers() {
    return [
      {
        // This regex matches all static file types in the public folder
        source: '/:path*(?:svg|jpg|jpeg|png|gif|ico|webp|avif|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            // This policy caches files for one year and requires revalidation upon expiration.
            value: 'public, max-age=31536000, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
