import './globals.css';
import type { ReactNode } from 'react';
import { Figtree, Literata } from 'next/font/google';
import SiteHeader from '@/components/SiteHeader';

const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree', display: 'swap' });
const literata = Literata({ subsets: ['latin'], variable: '--font-literata', display: 'swap' });

export const metadata = {
  metadataBase: undefined,
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [{ media: '(min-width: 431px)', color: '#0a0a0a' }],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" className={`${figtree.variable} ${literata.variable} js`}><body><SiteHeader />{children}</body></html>;
}
