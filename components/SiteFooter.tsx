'use client';

import Image from "next/image";
import Link from "next/link";
import { DISTANCE, Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import GlassSurface from "./GlassSurface";
import { navigation, socials } from "./site-data";

const link = "transition hover:text-gold-light";

/** Brand marks, drawn on a 24-unit grid in currentColor. */
const ICONS: Record<string, React.ReactNode> = {
  Instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" />
    </>
  ),
  YouTube: (
    <>
      <path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m10 9.2 5 2.8-5 2.8V9.2Z" fill="currentColor" />
    </>
  ),
  WhatsApp: (
    <>
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 7.8c-.3 0-.7.1-.9.5-.3.4-.9 1-.9 2.3s1 2.7 1.1 2.9c.1.2 1.9 3 4.7 4.1 2.3.9 2.8.7 3.3.7.5-.1 1.6-.7 1.9-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.6-.4l-1.9-.9c-.3-.1-.5-.2-.7.1l-.9 1.1c-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6l.5-.5.3-.5v-.5l-.9-2.1c-.2-.5-.4-.5-.6-.5H9Z" fill="currentColor" />
    </>
  ),
};

/**
 * Black glass, the navbar's own surface (GlassSurface) at footer scale. On the
 * home page (`overlay`) it is the foot of the closing scene, stacked under the
 * contact row inside DepthClose and refracting the photo; elsewhere it stands
 * on the ink. Kept
 * to one row on desktop so the scene, not the footer, owns the last screen.
 *
 * Reveals use margin 0: this sits at the very end of the page, where the
 * default trigger line can never be crossed.
 */
export default function SiteFooter({ overlay = false }: { overlay?: boolean }) {
  return (
    <footer className={`${overlay ? "relative w-full" : "relative bg-ink pt-6"} pb-2 text-white sm:pb-3`}>
      <div className="page-shell">
        <GlassSurface chromatic={false} width="100%" height="auto" borderRadius={24} borderWidth={0.04} backgroundOpacity={0.1} displace={0.5}>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-ink/70" />
          <div className="relative w-full px-6 py-7 sm:px-10 sm:py-8">
            <RevealGroup margin="0px" className="grid items-center justify-items-center gap-6 text-center lg:grid-cols-[1fr_auto_1fr] lg:justify-items-stretch lg:text-left">
              <RevealItem distance={DISTANCE.small} className="flex flex-col items-center gap-2 lg:flex-row lg:gap-5">
                <Image
                  src="/assets/utsah-wordmark.svg"
                  alt="Utsah Events"
                  width={386}
                  height={170}
                  className="h-11 w-auto object-contain"
                />
                <p className="max-w-[15rem] text-xs leading-5 text-white/55">
                  Thoughtful celebrations, planned and produced in Bardoli, Gujarat.
                </p>
              </RevealItem>

              <RevealItem
                as="nav"
                aria-label="Footer navigation"
                distance={DISTANCE.small}
                className="flex flex-wrap justify-center gap-x-7 gap-y-2 text-sm font-light tracking-wide"
              >
                {navigation.map((item) => (
                  <Link key={item.href} href={item.href} className={link}>
                    {item.label}
                  </Link>
                ))}
              </RevealItem>

              <RevealItem distance={DISTANCE.small} className="flex justify-center gap-3 lg:justify-end">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.link}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className="grid size-14 place-items-center rounded-full border border-white/15 bg-white/5 text-white/85 transition hover:border-gold hover:bg-gold/10 hover:text-gold-light"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden className="size-7">{ICONS[s.label]}</svg>
                  </a>
                ))}
              </RevealItem>
            </RevealGroup>

            <Reveal
              margin="0px"
              className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-4 text-[11px] text-white/45 sm:flex-row"
              distance={DISTANCE.small}
            >
              <span>© {new Date().getFullYear()} Utsah Events. All rights reserved.</span>
              <span className="flex gap-6">
                <Link href="/privacy" className={link}>Privacy policy</Link>
                <Link href="/terms" className={link}>Terms &amp; conditions</Link>
              </span>
            </Reveal>
          </div>
        </GlassSurface>
      </div>
    </footer>
  );
}
