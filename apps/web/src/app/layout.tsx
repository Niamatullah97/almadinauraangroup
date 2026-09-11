import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

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
  minimumScale: 0.15,
  maximumScale: 5,
};

/** Fit 1280px desktop layout to the device; overwrite every viewport meta (Next also emits initial-scale=1). */
const DESKTOP_VIEWPORT_SCRIPT = `(function(){var w=1280;function scale(){var dw=screen.width||screen.availWidth||0;if(!dw)dw=window.innerWidth||w;if(window.innerWidth&&window.innerWidth<dw&&window.innerWidth<w)dw=window.innerWidth;return dw>=w?1:Math.max(0.15,dw/w);}function apply(){var c='width='+w+',initial-scale='+scale()+',minimum-scale=0.15,maximum-scale=5,user-scalable=yes';var metas=document.querySelectorAll('meta[name="viewport"]');if(!metas.length){var m=document.createElement('meta');m.setAttribute('name','viewport');m.setAttribute('content',c);document.head.appendChild(m);return;}for(var i=0;i<metas.length;i++){if(metas[i].getAttribute('content')!==c)metas[i].setAttribute('content',c);}}apply();if(document.head){new MutationObserver(apply).observe(document.head,{childList:true,subtree:true,attributes:true,attributeFilter:['content']});}document.addEventListener('DOMContentLoaded',apply);window.addEventListener('load',apply);})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: DESKTOP_VIEWPORT_SCRIPT }} />
      </head>
      <body className={inter.className}>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
