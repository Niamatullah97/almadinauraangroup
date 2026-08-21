import type { Metadata } from 'next';

import { siteConfig } from './config';

export function buildPageMetadata(options: {
  title: string;
  description?: string;
  path?: string;
}): Metadata {
  const title = `${options.title} | ${siteConfig.name}`;
  const description = options.description ?? siteConfig.description;
  const url = options.path ? `${siteConfig.url}${options.path}` : siteConfig.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
