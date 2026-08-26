import Link from 'next/link';

import { siteConfig } from '@/lib/config';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <p>
          &copy; {new Date().getFullYear()} {siteConfig.name}. Pigeon Tournament Management.
        </p>
        <nav>
          <Link href="/tournaments">Tournaments</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
