'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import GlassSurface from './GlassSurface';
import { navigation } from './site-data';

// Split either side of the centred wordmark; equal flex on both groups keeps it centred.
const half = Math.ceil(navigation.length / 2);
const left = navigation.slice(0, half);
const right = navigation.slice(half);
const navGroup =
  'hidden flex-1 items-center gap-8 text-base font-light tracking-wide [text-shadow:0_1px_6px_rgba(0,0,0,0.45)] md:flex lg:gap-10';

export default function SiteHeader() {
  // Every route opens with a dark hero (`main > section`), and the white nav
  // text only needs help once the bar has floated off it onto a light section.
  const pathname = usePathname();
  const [tinted, setTinted] = useState(false);

  useEffect(() => {
    const hero = document.querySelector('main > section');
    if (!hero) return;
    // Shrink the root by the bar's height so it flips the moment the hero
    // stops sitting behind the bar, not when it leaves the viewport.
    const observer = new IntersectionObserver(([entry]) => setTinted(!entry.isIntersecting), {
      rootMargin: '-96px 0px 0px 0px',
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <header className="pointer-events-none sticky top-0 z-50 -mb-24 h-24 text-white">
      <div className="page-shell pt-4 sm:pt-5">
        <GlassSurface
          className="pointer-events-auto transition-shadow duration-300"
          width="100%"
          height="auto"
          borderRadius={24}
          borderWidth={0.04}
          backgroundOpacity={0.1}
          displace={0.5}
        >
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-0 bg-black/45 transition-opacity duration-500 ${tinted ? 'opacity-100' : 'opacity-0'}`}
          />
          <nav className="relative flex w-full items-center justify-between px-3 py-1 sm:px-4" aria-label="Main navigation">
            <div className={`${navGroup} justify-end`}>
              {left.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-gold-light">
                  {item.label}
                </Link>
              ))}
            </div>
            <Link href="/" aria-label="Utsah Events home" className="mx-auto shrink-0 md:mx-10 lg:mx-14">
              <Image
                src="/assets/utsah-wordmark.svg"
                alt="Utsah Events"
                width={386}
                height={170}
                priority
                className="h-9 w-auto object-contain sm:h-10"
              />
            </Link>
            <div className={`${navGroup} justify-start`}>
              {right.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-gold-light">
                  {item.label}
                </Link>
              ))}
            </div>
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Open menu"
                    className="absolute right-4 top-1/2 -translate-y-1/2 border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white md:hidden"
                  />
                }
              >
                <MenuIcon />
              </SheetTrigger>
              <SheetContent side="right" className="border-white/10 bg-ink text-white">
                <SheetHeader>
                  <SheetTitle className="display text-2xl text-white">Navigate</SheetTitle>
                </SheetHeader>
                <nav className="px-4 pb-6" aria-label="Mobile navigation">
                  {navigation.map((item) => (
                    <Link key={item.href} href={item.href} className="block border-b border-white/10 py-4 text-lg hover:text-gold-light">
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </nav>
        </GlassSurface>
      </div>
    </header>
  );
}
