
import type {NextConfig} from 'next';

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://placehold.co;
    font-src 'self' https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self' https://9003-firebase-studio-1748625231387.cluster-fkltigo73ncaixtmokrzxhwsfc.cloudworkstations.dev https://6000-firebase-studio-1748625231387.cluster-fkltigo73ncaixtmokrzxhwsfc.cloudworkstations.dev;
    block-all-mixed-content;
    upgrade-insecure-requests;
`;

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
  allowedDevOrigins: [
    'https://9003-firebase-studio-1748625231387.cluster-fkltigo73ncaixtmokrzxhwsfc.cloudworkstations.dev',
    'https://6000-firebase-studio-1748625231387.cluster-fkltigo73ncaixtmokrzxhwsfc.cloudworkstations.dev',
  ],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\s{2,}/g, ' ').trim(),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
             key: 'Permissions-Policy',
             value: "camera=(), microphone=(), geolocation=()",
          }
        ],
      },
    ];
  },
};

export default nextConfig;
