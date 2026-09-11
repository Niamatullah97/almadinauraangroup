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
  width: 1280,
  userScalable: true,
  minimumScale: 0.1,
  maximumScale: 5,
};

const DESKTOP_VIEWPORT_SCRIPT = `(function(){var w=1280;var m=document.querySelector('meta[name="viewport"]');if(!m){m=document.createElement('meta');m.setAttribute('name','viewport');document.head.appendChild(m);}m.setAttribute('content','width='+w+',user-scalable=yes,minimum-scale=0.1,maximum-scale=5');var iw=window.innerWidth||w;if(iw<w){document.documentElement.style.zoom=String(Math.max(0.2,iw/w));}})();`;

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
