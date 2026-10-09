'use client';

/**
 * The close: the opener's depth trick again, so the page begins and ends on
 * the same idea. The groom laughs through falling petals in front of a band
 * that runs the opposite way to the hero's. Not pinned — the layers separate
 * as the section rises into view and are at rest once it fills the screen.
 */

import Link from 'next/link';
import { useScroll } from 'motion/react';
import { useRef } from 'react';
import DepthStage from '@/components/motion/DepthStage';
import { DISTANCE, Reveal } from '@/components/motion/reveal';
import { Marquee } from '@/components/motion/scroll';
import { EYEBROW, EyebrowLabel } from '@/components/Eyebrow';

export type DepthCloseProps = {
  index?: string;
  eyebrow: string;
  band: string[];
  cta: { href: string; label: string };
};

export default function DepthClose({ index, eyebrow, band, cta }: DepthCloseProps) {
  const section = useRef<HTMLElement>(null);
  // 0 as the section's top meets the bottom of the screen, 1 once it fills it.
  const { scrollYProgress } = useScroll({ target: section, offset: ['start end', 'end end'] });

  return (
    <section ref={section} data-tone="ink" className="relative h-svh min-h-[34rem] overflow-hidden text-white">
      <DepthStage
        bg="/assets/hero/layers/groom-bg.jpg"
        fg="/assets/hero/layers/groom-fg.webp"
        alt="A groom laughing through falling rose petals at his haldi"
        objectPosition="47% 45%"
        progress={scrollYProgress}
        intensity={0.6}
        middleClassName="top-[30%] sm:top-[28%]"
        middle={
          // The band is the section's heading; the hidden copy inside Marquee
          // is what screen readers announce.
          <h2>
            <Marquee items={band} loop={22} reverse className="display text-[clamp(2.75rem,8.5vw,8rem)] leading-[0.92] italic text-white/90 [text-shadow:0_1px_24px_rgba(0,0,0,.35)]" />
          </h2>
        }
        front={
          <div className="page-shell flex h-full flex-col justify-end pb-14 sm:pb-20 [text-shadow:0_1px_24px_rgba(0,0,0,.35)]">
            {/* margin 0: this copy sits in the last 15% of the screen, below the
                default trigger line, and would stay hidden while the close
                fills the viewport. */}
            <Reveal as="p" className={EYEBROW} distance={DISTANCE.small} margin="0px">
              <EyebrowLabel index={index}>{eyebrow}</EyebrowLabel>
            </Reveal>
            <Reveal className="mt-8" delay={0.15} distance={DISTANCE.small} margin="0px">
              <Link href={cta.href} className="inline-block bg-gold px-6 py-4 text-sm font-bold uppercase tracking-[.18em] text-ink [text-shadow:none] transition-colors duration-300 hover:bg-gold-light">
                {cta.label}
              </Link>
            </Reveal>
          </div>
        }
      />
      {/* The photo's top edge melts into the canvas, as the hero's foot does
          into the manifesto — no hard line where the reviews end. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-tone-bg to-transparent" />
    </section>
  );
}
