import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { buildPageMetadata } from '@/lib/seo';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = buildPageMetadata({
  title: 'AlMadina Uraan Group',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
