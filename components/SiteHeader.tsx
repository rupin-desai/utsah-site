'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import GlassSurface from './GlassSurface';
import StaggeredMenu from './StaggeredMenu';
import './site-menu.css';
import { navigation, socials } from './site-data';

// Split either side of the centred wordmark; equal flex on both groups keeps it centred.
const half = Math.ceil(navigation.length / 2);
const left = navigation.slice(0, half);
const right = navigation.slice(half);
const navGroup =
  'hidden flex-1 items-center gap-8 text-base font-light tracking-wide [text-shadow:0_1px_6px_rgba(0,0,0,0.45)] md:flex lg:gap-10';
const menuItems = navigation.map((item) => ({ label: item.label, link: item.href, ariaLabel: item.label }));
// lucide-react v1 dropped brand marks, so these are the same three glyphs the
// footer uses, inlined.
const socialIcons: Record<string, ReactNode> = {
  Instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="size-6">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" />
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.5V8.5L15.8 12Z" />
    </svg>
  ),
  WhatsApp: (
    // Padded viewBox: this glyph runs edge to edge, so at a shared box size it
    // reads noticeably larger than the Instagram and YouTube marks.
    <svg viewBox="-2 -2 28 28" fill="currentColor" className="size-6">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 12.05 0" />
    </svg>
  ),
};
const socialItems = socials.map((social) => ({ ...social, icon: socialIcons[social.label] }));

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
            <Link href="/" aria-label="Utsah Events home" className="mr-auto shrink-0 md:mx-10 lg:mx-14">
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
          </nav>
        </GlassSurface>
      </div>
      {/* Mobile only. The component ships its own full-width header (logo left,
          toggle right); site-menu.css hides that logo and re-pads the row so the
          toggle lands inside the glass bar, over our own wordmark's row. */}
      <StaggeredMenu
        className="site-menu md:hidden"
        isFixed
        position="right"
        items={menuItems}
        socialItems={socialItems}
        logoUrl="/assets/utsah-wordmark.svg"
        colors={['#2b2b2b', '#0a0a0a']}
        accentColor="#c9a84c"
        menuButtonColor="#fff"
        openMenuButtonColor="#0a0a0a"
      />
    </header>
  );
}
