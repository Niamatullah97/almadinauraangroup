import Image from 'next/image';
import Link from 'next/link';

import { siteConfig } from '@/lib/config';

export function Header() {
  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          <Image src="/logo.png" alt={`${siteConfig.name} logo`} width={52} height={52} priority />
          <span>{siteConfig.name}</span>
        </Link>
        <nav>
          <Link href="/tournaments">Tournaments</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </header>
  );
}
