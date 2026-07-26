import './globals.css';
import type { ReactNode } from 'react';

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
  return (
    <html lang="en" className="js">
      <body>{children}</body>
    </html>
  );
}
