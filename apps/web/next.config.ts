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
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_UPLOADS_URL: process.env.NEXT_PUBLIC_UPLOADS_URL,
  },
};

export default nextConfig;
