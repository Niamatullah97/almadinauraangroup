import Link from 'next/link';

import { siteConfig, whatsappLink } from '@/lib/config';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Contact',
  description:
    'Get in touch with the AlMadina Uraan Group team for tournament inquiries and support.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <div className="container">
      <div className="page-hero">
        <h1>Contact us</h1>
        <p>
          Have questions about a tournament, registration, or results? Reach out and we&apos;ll get
          back to you as soon as possible.
        </p>
      </div>

      <div className="contact-grid">
        <article className="card">
          <h2>Email</h2>
          <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem' }}>
            <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
          </p>
        </article>

        <article className="card">
          <h2>Phone</h2>
          <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem' }}>
            <a href={`tel:${siteConfig.contactPhone}`}>{siteConfig.contactPhone}</a>
          </p>
        </article>

        <article className="card">
          <h2>WhatsApp</h2>
          <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem' }}>
            Chat with us for quick support.
          </p>
          <Link href={whatsappLink()} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Message on WhatsApp
          </Link>
        </article>
      </div>
    </div>
  );
}
