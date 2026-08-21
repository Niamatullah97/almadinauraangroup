import { describe, expect, it } from 'vitest';

import { buildPageMetadata } from '@/lib/seo';

describe('buildPageMetadata', () => {
  it('builds title, description, and canonical open graph url', () => {
    const metadata = buildPageMetadata({
      title: 'Tournaments',
      description: 'Browse all tournaments.',
      path: '/tournaments',
    });

    expect(metadata.title).toBe('Tournaments | AlMadina Uraan Group');
    expect(metadata.description).toBe('Browse all tournaments.');
    expect(metadata.openGraph).toMatchObject({
      title: 'Tournaments | AlMadina Uraan Group',
      description: 'Browse all tournaments.',
      url: 'http://localhost:3001/tournaments',
      siteName: 'AlMadina Uraan Group',
      type: 'website',
    });
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      title: 'Tournaments | AlMadina Uraan Group',
    });
  });

  it('uses default description when omitted', () => {
    const metadata = buildPageMetadata({ title: 'Home' });
    expect(metadata.description).toContain('Track pigeon racing tournaments');
  });
});
