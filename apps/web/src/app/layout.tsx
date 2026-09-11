import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { buildPageMetadata } from '@/lib/seo';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = buildPageMetadata({
  title: 'AlMadina Uraan Group',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

const DESKTOP_VIEWPORT_SCRIPT = `(function(){var w=1280;var sw=screen.width||window.innerWidth||w;if(sw>=w)return;var s=Math.max(0.2,sw/w);var m=document.querySelector('meta[name="viewport"]');if(!m){m=document.createElement('meta');m.setAttribute('name','viewport');document.head.appendChild(m);}m.setAttribute('content','width='+w+',initial-scale='+s+',minimum-scale=0.15,maximum-scale=5,user-scalable=yes');})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script id="desktop-viewport" strategy="beforeInteractive">
          {DESKTOP_VIEWPORT_SCRIPT}
        </Script>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
