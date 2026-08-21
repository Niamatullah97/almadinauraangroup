import type { NextConfig } from 'next';

void import('@opennextjs/cloudflare').then(({ initOpenNextCloudflareForDev }) =>
  initOpenNextCloudflareForDev(),
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@kabootar/shared'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

export default nextConfig;
