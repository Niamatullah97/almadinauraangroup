import type { NextConfig } from 'next';

void import('@opennextjs/cloudflare').then(({ initOpenNextCloudflareForDev }) =>
  initOpenNextCloudflareForDev(),
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@kabootar/shared'],
  // CI (Cloudflare Linux) vs local Windows CRLF caused flaky prettier failures during `next build`.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Cloudflare Workers have no Next.js image optimizer; routing /_next/image
  // through the Worker also competes with SSR API fetches on small devices.
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_UPLOADS_URL: process.env.NEXT_PUBLIC_UPLOADS_URL,
  },
};

export default nextConfig;
