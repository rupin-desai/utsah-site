import './globals.css';
import type { ReactNode } from 'react';
import { Figtree, Literata } from 'next/font/google';
import SiteHeader from '@/components/SiteHeader';
import IntroOverlay from '@/components/intro/IntroOverlay';

// Plays on every full page load, so <html data-intro="run"> is rendered on the
// server and this script only ever flips it to "done". Setting "run" from here
// instead would be a hydration mismatch: React 19 diffs <html>'s attributes and
// refuses to patch them. Teardown only — the write itself is pure CSS.
const INTRO_BOOT = `(function(){var d=document.documentElement;
var end=function(){d.dataset.intro='done'};
addEventListener('click',end,{once:true});
setTimeout(end,matchMedia('(prefers-reduced-motion: reduce)').matches?800:3600)})();`;

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
  // suppressHydrationWarning covers the case where hydration lands after the
  // script has already flipped data-intro to "done" (slow device, dev mode).
  return <html lang="en" data-intro="run" suppressHydrationWarning className={`${figtree.variable} ${literata.variable} js`}><body><script dangerouslySetInnerHTML={{ __html: INTRO_BOOT }} /><IntroOverlay /><SiteHeader />{children}</body></html>;
}
